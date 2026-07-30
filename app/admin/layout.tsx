import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — MOOV",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {children}
    </div>
  );
}
