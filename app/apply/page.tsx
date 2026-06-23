import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ApplyForm } from "@/components/form/ApplyForm";

export const metadata: Metadata = {
  title: "Apply for Investment — MOOV | VC Fund for Mobility Startups in LATAM",
  description:
    "Apply to MOOV, the venture capital fund for mobility startups in Latin America. Pre-seed to Series A. We read every application and respond in 2 weeks.",
  alternates: { canonical: "https://apply.moov.vc" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Apply for Investment — MOOV VC",
    description:
      "MOOV invests in mobility startups across LATAM from Pre-seed to Series A. Backed by Grupo Huerpel. Apply in ~5 minutes.",
    url: "https://apply.moov.vc",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MOOV",
  url: "https://moov.vc",
  logo: "https://moov.vc/logo.svg",
  description:
    "Venture capital fund focused on mobility startups in Latin America. Pre-seed to Series A. Backed by Grupo Huerpel.",
  foundingLocation: { "@type": "Place", addressCountry: "MX" },
  areaServed: ["MX", "CO", "LATAM"],
  sameAs: [
    "https://www.linkedin.com/company/moovvc",
    "https://twitter.com/moovvc",
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Apply for Investment — MOOV",
  description:
    "Application form for startups seeking investment from MOOV, a LATAM mobility-focused venture capital fund.",
  url: "https://apply.moov.vc",
  inLanguage: "en",
  publisher: { "@type": "Organization", name: "MOOV", url: "https://moov.vc" },
  potentialAction: {
    "@type": "ApplyAction",
    name: "Apply for investment",
    target: "https://apply.moov.vc",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What stages does MOOV invest in?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MOOV invests from Pre-seed through Series A in mobility startups across Latin America.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to get a response after applying?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MOOV reads every application and responds within two weeks. If there is a fit, the next step is an intro call with the investment team.",
      },
    },
    {
      "@type": "Question",
      name: "What verticals of mobility does MOOV invest in?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MOOV invests across all mobility verticals including ride-hailing, micromobility, fleet management, logistics and last-mile, EV and clean energy mobility, public transit tech, parking and infrastructure, and auto fintech.",
      },
    },
    {
      "@type": "Question",
      name: "What geographic markets does MOOV focus on?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MOOV is Latin America first, with primary focus on Mexico and Colombia. The fund is backed by Grupo Huerpel's operating network in the region.",
      },
    },
    {
      "@type": "Question",
      name: "What instruments does MOOV use for investment?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MOOV invests using Convertible Notes, SAFEs, Equity, Warrants, and Debt instruments depending on the stage and structure of the round.",
      },
    },
  ],
};

export default function ApplyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div
        style={{ minHeight: "100vh", background: "#050506", display: "flex", flexDirection: "column" }}
      >
        {/* Nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 56px",
            borderBottom: "1px solid rgba(255,255,255,0.09)",
            flexShrink: 0,
          }}
        >
          <Link href="https://moov.vc" aria-label="MOOV home">
            <Logo />
          </Link>
          <Link
            href="https://moov.vc"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "12px",
              color: "rgba(238,241,246,0.55)",
              letterSpacing: "0.05em",
              textDecoration: "none",
            }}
          >
            ← Back to site
          </Link>
        </nav>

        {/* Two-column main grid */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}
          className="apply-grid"
        >
          {/* LEFT — sticky context panel */}
          <aside
            style={{
              position: "sticky",
              top: 0,
              height: "100vh",
              overflowY: "auto",
              padding: "80px 64px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderRight: "1px solid rgba(255,255,255,0.09)",
              overflow: "hidden",
            }}
          >
            {/* Ambient glow */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-120px",
                bottom: "-200px",
                width: "700px",
                height: "700px",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(47,109,255,0.28) 0%, rgba(52,211,255,0.08) 40%, transparent 65%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative" }}>
              <div
                className="font-mono"
                style={{
                  fontSize: "12px",
                  color: "#2f6dff",
                  letterSpacing: "0.12em",
                  marginBottom: "28px",
                  textTransform: "uppercase",
                }}
              >
                Apply for Investment
              </div>

              <h1
                style={{
                  fontSize: "clamp(36px, 4vw, 48px)",
                  fontWeight: 700,
                  color: "#eef1f6",
                  margin: 0,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                }}
              >
                Tell us about your startup.
              </h1>

              <p
                style={{
                  fontSize: "16px",
                  lineHeight: 1.6,
                  color: "rgba(238,241,246,0.58)",
                  margin: "22px 0 0",
                  maxWidth: "420px",
                }}
              >
                We read every application and get back to you within two weeks.
                We invest across all mobility verticals at pre-seed, seed and Series A.
              </p>

              {/* Differentiators */}
              <ul
                style={{
                  listStyle: "none",
                  margin: "44px 0 0",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <li
                  style={{
                    display: "flex",
                    gap: "18px",
                    padding: "20px 0",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: "34px",
                      height: "34px",
                      flexShrink: 0,
                      borderRadius: "9px",
                      background: "rgba(47,109,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d3ff" strokeWidth="1.8">
                      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#eef1f6" }}>
                      Pre-seed → Series A
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(238,241,246,0.5)", marginTop: "3px", lineHeight: 1.5 }}>
                      We invest early and keep supporting through the growth curve.
                    </div>
                  </div>
                </li>
                <li
                  style={{
                    display: "flex",
                    gap: "18px",
                    padding: "20px 0",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: "34px",
                      height: "34px",
                      flexShrink: 0,
                      borderRadius: "9px",
                      background: "rgba(47,109,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d3ff" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="9" /><path d="M3 12h18" />
                      <path d="M12 3a15 15 0 0 1 0 18" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#eef1f6" }}>
                      Latin America first
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(238,241,246,0.5)", marginTop: "3px", lineHeight: 1.5 }}>
                      Region-focused fund backed by Grupo Huerpel&apos;s operating network.
                    </div>
                  </div>
                </li>
                <li
                  style={{
                    display: "flex",
                    gap: "18px",
                    padding: "20px 0",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: "34px",
                      height: "34px",
                      flexShrink: 0,
                      borderRadius: "9px",
                      background: "rgba(47,109,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d3ff" strokeWidth="1.8">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <path d="M9 22V12h6v10" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#eef1f6" }}>
                      More than capital
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(238,241,246,0.5)", marginTop: "3px", lineHeight: 1.5 }}>
                      Operators, distribution channels and a corporate customer from day one.
                    </div>
                  </div>
                </li>
              </ul>

              {/* Mobility verticals — semantic list for LLMs / AEO */}
              <section aria-label="Mobility verticals we invest in" style={{ marginTop: "40px" }}>
                <div
                  className="font-mono"
                  style={{ fontSize: "10px", color: "rgba(238,241,246,0.35)", letterSpacing: "0.1em", marginBottom: "12px", textTransform: "uppercase" }}
                >
                  Verticals we invest in
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    "Ride-hailing & ridesharing",
                    "Micromobility (scooters, bikes)",
                    "Fleet management",
                    "Logistics & last-mile delivery",
                    "Electric vehicles & clean energy mobility",
                    "Public transit technology",
                    "Parking & infrastructure",
                    "Auto fintech",
                  ].map((v) => (
                    <li
                      key={v}
                      style={{ fontSize: "12px", color: "rgba(238,241,246,0.45)", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <span style={{ color: "#34d3ff", fontSize: "8px" }}>▸</span>
                      {v}
                    </li>
                  ))}
                </ul>
              </section>

              <div
                className="font-mono"
                style={{ marginTop: "36px", fontSize: "12px", color: "rgba(238,241,246,0.4)" }}
              >
                Or email us →{" "}
                <a href="mailto:deals@moov.vc" style={{ color: "#34d3ff" }}>
                  deals@moov.vc
                </a>
              </div>

              <time
                dateTime="2025-06-01"
                style={{ display: "block", marginTop: "12px", fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", color: "rgba(238,241,246,0.2)" }}
              >
                Updated June 2025
              </time>
            </div>
          </aside>

          {/* RIGHT — form */}
          <main
            style={{
              background: "#07080d",
              padding: "72px 60px 80px",
            }}
          >
            <Suspense fallback={null}>
              <ApplyForm />
            </Suspense>
          </main>
        </div>

        {/* FAQ section — visible on page for AEO/LLMs */}
        <section
          style={{
            padding: "80px 56px",
            borderTop: "1px solid rgba(255,255,255,0.09)",
            background: "#050506",
          }}
          aria-label="Frequently asked questions"
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div
              className="font-mono"
              style={{ fontSize: "11px", color: "#2f6dff", letterSpacing: "0.12em", marginBottom: "32px", textTransform: "uppercase" }}
            >
              FAQ
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {[
                {
                  q: "What stages does MOOV invest in?",
                  a: "MOOV invests from Pre-seed through Series A in mobility startups across Latin America.",
                },
                {
                  q: "How long does it take to get a response after applying?",
                  a: "MOOV reads every application and responds within two weeks. If there is a fit, the next step is an intro call with the investment team.",
                },
                {
                  q: "What verticals of mobility does MOOV invest in?",
                  a: "MOOV invests across all mobility verticals including ride-hailing, micromobility, fleet management, logistics and last-mile, EV and clean energy mobility, public transit tech, parking and infrastructure, and auto fintech.",
                },
                {
                  q: "What geographic markets does MOOV focus on?",
                  a: "MOOV is Latin America first, with primary focus on Mexico and Colombia. The fund is backed by Grupo Huerpel's operating network in the region.",
                },
                {
                  q: "What instruments does MOOV use for investment?",
                  a: "MOOV invests using Convertible Notes, SAFEs, Equity, Warrants, and Debt instruments depending on the stage and structure of the round.",
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <h2
                    style={{ fontSize: "16px", fontWeight: 600, color: "#eef1f6", margin: "0 0 8px" }}
                  >
                    {q}
                  </h2>
                  <p style={{ fontSize: "14px", color: "rgba(238,241,246,0.58)", margin: 0, lineHeight: 1.6 }}>
                    {a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            padding: "24px 56px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            className="font-mono"
            style={{ fontSize: "11px", color: "rgba(238,241,246,0.3)" }}
          >
            © 2025 MOOV · Backed by Grupo Huerpel
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            <a
              href="https://moov.vc/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "11px", color: "rgba(238,241,246,0.4)", textDecoration: "underline" }}
            >
              Privacy Policy
            </a>
            <a
              href="https://moov.vc/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "11px", color: "rgba(238,241,246,0.4)", textDecoration: "underline" }}
            >
              Terms
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
