"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PortafolioNavProps {
  active: "dashboard" | "overview" | "usuarios";
}

interface CurrentUser {
  username: string;
  role: "admin" | "viewer";
}

export default function PortafolioNav({ active }: PortafolioNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/portafolio/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/portafolio/logout", { method: "POST" });
    router.push("/portafolio/login");
  }

  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        <div style={s.left}>
          <span style={s.logo}>MOOV</span>
          <span style={s.badge}>Portafolio</span>
          <div style={s.divider} />
          <Link
            href="/portafolio"
            style={{ ...s.link, ...(active === "dashboard" ? s.linkActive : {}) }}
          >
            Startups
          </Link>
          <Link
            href="/portafolio/overview"
            style={{ ...s.link, ...(active === "overview" ? s.linkActive : {}) }}
          >
            Fondo
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/portafolio/usuarios"
              style={{ ...s.link, ...(active === "usuarios" ? s.linkActive : {}) }}
            >
              Usuarios
            </Link>
          )}
        </div>
        <div style={s.right}>
          {user && <span style={s.username}>{user.username}</span>}
          <button onClick={handleLogout} style={s.logout}>
            Cerrar sesión
          </button>
        </div>
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
  right: { display: "flex", alignItems: "center", gap: "14px" },
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
  username: {
    fontSize: "13px",
    color: "rgba(238,241,246,0.4)",
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
