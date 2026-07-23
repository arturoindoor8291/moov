"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminNavProps {
  active: "dashboard" | "portfolio" | "tareas";
}

export default function AdminNav({ active }: AdminNavProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        <div style={s.left}>
          <span style={s.logo}>MOOV</span>
          <span style={s.badge}>Admin</span>
          <div style={s.divider} />
          <Link
            href="/admin/dashboard"
            style={{ ...s.link, ...(active === "dashboard" ? s.linkActive : {}) }}
          >
            Applications
          </Link>
          <Link
            href="/admin/portfolio"
            style={{ ...s.link, ...(active === "portfolio" ? s.linkActive : {}) }}
          >
            Portfolio
          </Link>
          <Link
            href="/admin/tareas"
            style={{ ...s.link, ...(active === "tareas" ? s.linkActive : {}) }}
          >
            Tareas
          </Link>
        </div>
        <button onClick={handleLogout} style={s.logout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

const s: Record<string, React.CSSProperties> = {
  nav: {
    background: "#07080d",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 24px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { display: "flex", alignItems: "center", gap: "20px" },
  logo: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#eef1f6",
    letterSpacing: "-0.5px",
    textDecoration: "none",
  },
  badge: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#2f6dff",
    background: "rgba(47,109,255,0.12)",
    border: "1px solid rgba(47,109,255,0.25)",
    borderRadius: "6px",
    padding: "2px 8px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  divider: {
    width: "1px",
    height: "20px",
    background: "rgba(255,255,255,0.1)",
  },
  link: {
    fontSize: "14px",
    fontWeight: 500,
    color: "rgba(238,241,246,0.5)",
    textDecoration: "none",
    padding: "4px 0",
    borderBottom: "2px solid transparent",
    transition: "color 0.15s",
  },
  linkActive: {
    color: "#eef1f6",
    borderBottomColor: "#2f6dff",
  },
  logout: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "13px",
    color: "rgba(238,241,246,0.5)",
    cursor: "pointer",
  },
};
