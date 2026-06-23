import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GTMScript, GTMNoScript } from "@/components/analytics/GTM";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://apply.moov.vc"),
  title: {
    default: "Apply for Investment — MOOV | VC Fund for Mobility Startups in LATAM",
    template: "%s — MOOV",
  },
  description:
    "Apply to MOOV, the venture capital fund for mobility startups in Latin America. Pre-seed to Series A. We read every application and respond in 2 weeks.",
  keywords: [
    "venture capital mobility LATAM",
    "VC fund Mexico Colombia",
    "mobility startup investment",
    "apply for VC funding",
    "MOOV fund",
    "Grupo Huerpel",
  ],
  authors: [{ name: "MOOV", url: "https://moov.vc" }],
  openGraph: {
    type: "website",
    siteName: "MOOV",
    title: "Apply for Investment — MOOV VC",
    description:
      "MOOV invests in mobility startups across LATAM from Pre-seed to Series A. Backed by Grupo Huerpel. Apply in ~5 minutes.",
    images: [
      {
        url: "/og-apply.png",
        width: 1200,
        height: 630,
        alt: "MOOV — Apply for Investment",
      },
    ],
    locale: "en_US",
    alternateLocale: ["es_MX"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moovvc",
    title: "Apply for Investment — MOOV VC",
    description:
      "MOOV invests in mobility startups across LATAM from Pre-seed to Series A. Apply in ~5 minutes.",
    images: ["/og-apply.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrainsMono.variable}`}>
      <head>
        <GTMScript />
      </head>
      <body>
        <GTMNoScript />
        <a
          href="#main-form"
          className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 rounded px-4 py-2 bg-[#2f6dff] text-white text-sm font-semibold"
        >
          Skip to form
        </a>
        {children}
      </body>
    </html>
  );
}
