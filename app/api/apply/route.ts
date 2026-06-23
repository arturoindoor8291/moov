import { NextRequest, NextResponse } from "next/server";
import { applicationSchema } from "@/lib/schema";
import { createApplicationRecord } from "@/lib/airtable";
import { checkRateLimit } from "@/lib/ratelimit";
import { Resend } from "resend";
import { render } from "@react-email/render";
import ConfirmationEmail from "@/emails/ConfirmationEmail";
import InternalNotification from "@/emails/InternalNotification";

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function sanitizeString(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIP(req);
  const { allowed, reset } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { message: "Too many submissions. Please try again in an hour." },
      {
        status: 429,
        headers: {
          "Retry-After": reset ? String(Math.ceil((reset - Date.now()) / 1000)) : "3600",
        },
      }
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = {
    ...parsed.data,
    // Sanitize free-text fields before storing/emailing
    founderName: sanitizeString(parsed.data.founderName),
    startupName: sanitizeString(parsed.data.startupName),
    companyDescription: sanitizeString(parsed.data.companyDescription),
    country: sanitizeString(parsed.data.country),
  };

  // Save to Airtable
  let airtableRecordId: string;
  try {
    airtableRecordId = await createApplicationRecord(data);
  } catch (err) {
    console.error("[apply] Airtable error:", err);
    return NextResponse.json(
      { message: "Failed to save your application. Please try again or email deals@moov.vc" },
      { status: 500 }
    );
  }

  // Send emails in parallel (don't fail the request if email fails)
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "apply@moov.vc";
  const teamEmail = process.env.MOOV_TEAM_EMAIL || "team@moov.vc";

  await Promise.allSettled([
    // Confirmation to founder
    (async () => {
      const html = await render(
        ConfirmationEmail({
          founderName: data.founderName,
          startupName: data.startupName,
          roundStage: data.roundStage,
        })
      );
      await resend.emails.send({
        from: `MOOV <${fromEmail}>`,
        to: data.email,
        subject: "Application received — MOOV",
        html,
      });
    })(),

    // Internal notification to MOOV team
    (async () => {
      const html = await render(
        InternalNotification({ data, airtableRecordId })
      );
      await resend.emails.send({
        from: `MOOV Apply <${fromEmail}>`,
        to: teamEmail,
        subject: `New application: ${data.startupName} — ${data.roundStage} (${data.country})`,
        html,
        replyTo: data.email,
      });
    })(),
  ]).then((results) => {
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[apply] Email send error:", result.reason);
      }
    }
  });

  // Set cookie to allow access to /apply/success
  const response = NextResponse.json({ success: true, id: airtableRecordId });
  response.cookies.set("moov_applied", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return response;
}
