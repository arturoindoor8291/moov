import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Application Received — MOOV",
  description:
    "Your application has been received by MOOV. We'll review it and get back to you within two weeks.",
  robots: { index: false, follow: false },
};

export default async function SuccessPage() {
  const cookieStore = await cookies();
  const applied = cookieStore.get("moov_applied");
  if (!applied) {
    redirect("/apply");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050506", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 56px",
          borderBottom: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        <Link href="https://moov.vc" aria-label="MOOV home">
          <Logo />
        </Link>
      </nav>

      {/* Success content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        {/* Check circle */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(47,109,255,0.15)",
            border: "2px solid rgba(47,109,255,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
          }}
          aria-hidden="true"
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34d3ff"
            strokeWidth="2.2"
            strokeLinecap="square"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>

        <div
          className="font-mono"
          style={{ fontSize: "12px", color: "#2f6dff", letterSpacing: "0.12em", marginBottom: "18px", textTransform: "uppercase" }}
        >
          Application Received
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 700,
            color: "#eef1f6",
            margin: 0,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            maxWidth: "480px",
          }}
        >
          Thanks for applying to MOOV.
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "rgba(238,241,246,0.58)",
            margin: "20px auto 0",
            maxWidth: "380px",
            lineHeight: 1.6,
          }}
        >
          We&apos;ve received your application and will review it carefully. Expect to hear from us
          within <strong style={{ color: "#eef1f6" }}>two weeks</strong>.
        </p>

        {/* Timeline cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
            margin: "44px 0",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              background: "#0c0e14",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "left",
            }}
          >
            <div
              className="font-mono"
              style={{ fontSize: "10px", color: "rgba(238,241,246,0.4)", letterSpacing: "0.1em", marginBottom: "8px", textTransform: "uppercase" }}
            >
              Response time
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#eef1f6" }}>~2 weeks</div>
          </div>
          <div
            style={{
              background: "#0c0e14",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "left",
            }}
          >
            <div
              className="font-mono"
              style={{ fontSize: "10px", color: "rgba(238,241,246,0.4)", letterSpacing: "0.1em", marginBottom: "8px", textTransform: "uppercase" }}
            >
              Next step
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#eef1f6" }}>Intro call</div>
          </div>
        </div>

        {/* What happens next */}
        <div style={{ marginBottom: "44px", textAlign: "left", maxWidth: "380px" }}>
          <div
            className="font-mono"
            style={{ fontSize: "11px", color: "rgba(238,241,246,0.4)", letterSpacing: "0.1em", marginBottom: "16px", textTransform: "uppercase" }}
          >
            What happens next
          </div>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              "Our team reviews your application",
              "If we see a fit, we reach out to schedule an intro call",
              "We move fast — expect to hear from us within 14 days",
            ].map((step, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  fontSize: "14px",
                  color: "rgba(238,241,246,0.65)",
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "rgba(47,109,255,0.12)",
                    border: "1px solid rgba(47,109,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    color: "#34d3ff",
                    fontFamily: "var(--font-jetbrains-mono)",
                    marginTop: "2px",
                  }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <Link
          href="https://moov.vc"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 28px",
            borderRadius: "9px",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "#eef1f6",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Back to MOOV
        </Link>
      </main>
    </div>
  );
}
