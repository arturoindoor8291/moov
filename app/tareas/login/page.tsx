"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TareasLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tareas/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/tareas");
      } else {
        const data = await res.json();
        setError(data.message || "Credenciales inválidas");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logo}>MOOV</span>
          <span style={styles.badge}>Tareas</span>
        </div>

        <h1 style={styles.title}>Iniciar sesión</h1>
        <p style={styles.subtitle}>Tablero de actividades de tu proyecto</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              style={styles.input}
              placeholder="tu@correo.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#10131A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    background: "#171B23",
    border: "1px solid #2A3038",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "32px",
  },
  logo: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#F2F4F3",
    letterSpacing: "-1px",
  },
  badge: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#2f6dff",
    background: "rgba(47,109,255,0.12)",
    border: "1px solid rgba(47,109,255,0.25)",
    borderRadius: "6px",
    padding: "2px 8px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#F2F4F3",
    margin: "0 0 6px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#9AA3AC",
    margin: "0 0 28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#9AA3AC",
  },
  input: {
    background: "#0c0e14",
    border: "1px solid #2A3038",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#F2F4F3",
    outline: "none",
    transition: "border-color 0.15s",
  },
  error: {
    fontSize: "13px",
    color: "#E5605A",
    background: "rgba(229,96,90,0.08)",
    border: "1px solid rgba(229,96,90,0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
    margin: 0,
  },
  button: {
    background: "#2f6dff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
    marginTop: "4px",
  },
};
