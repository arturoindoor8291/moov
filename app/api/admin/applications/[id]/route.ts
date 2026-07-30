import { NextRequest, NextResponse } from "next/server";
import { updateApplication } from "@/lib/airtable";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const { status, notes } = body as { status?: string; notes?: string };
  if (!status && notes === undefined) {
    return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  }

  try {
    await updateApplication(id, { status, notes });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/applications/update] Error:", err);
    return NextResponse.json({ message: "Failed to update application" }, { status: 500 });
  }
}
