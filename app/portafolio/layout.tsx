import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portafolio — MOOV",
  robots: { index: false, follow: false },
};

export default function PortafolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {children}
    </div>
  );
}
