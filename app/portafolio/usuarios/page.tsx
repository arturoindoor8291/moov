"use client";

import { useState, useEffect, useCallback } from "react";
import PortafolioNav from "@/components/portafolio/PortafolioNav";
import UsersTable, { type PortafolioUserRow } from "@/components/portafolio/UsersTable";

export default function PortafolioUsuariosPage() {
  const [users, setUsers] = useState<PortafolioUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/portafolio/users");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/portafolio/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.message || "No se pudo crear el usuario.");
        return;
      }
      setNewUsername("");
      setNewPassword("");
      setNewRole("viewer");
      await fetchUsers();
    } catch {
      setCreateError("Error de conexión.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(id: string, status: "active" | "paused") {
    await fetch(`/api/portafolio/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  }

  async function handleResetPassword(id: string, password: string) {
    await fetch(`/api/portafolio/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/portafolio/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div style={s.page}>
      <PortafolioNav active="usuarios" />
      <main style={s.main}>
        <div style={s.header}>
          <h1 style={s.title}>Usuarios</h1>
          <p style={s.subtitle}>{users.length} usuario(s) con acceso al dashboard</p>
        </div>

        <form onSubmit={handleCreate} style={s.createForm}>
          <input
            type="text"
            placeholder="Usuario"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
            style={s.input}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={s.input}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "admin" | "viewer")}
            style={s.select}
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" disabled={creating} style={s.button}>
            {creating ? "Creando..." : "Agregar usuario"}
          </button>
        </form>
        {createError && <p style={s.error}>{createError}</p>}

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: "#ff5a5a" }}>{error}</p>
        ) : (
          <UsersTable
            users={users}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050506", color: "#eef1f6" },
  main: { maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" },
  header: { marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: 700, color: "#eef1f6", margin: "0 0 4px" },
  subtitle: { fontSize: "14px", color: "rgba(238,241,246,0.45)", margin: 0 },
  createForm: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px",
    padding: "16px",
    background: "#07080d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
  },
  input: {
    background: "#0c0e14",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#eef1f6",
    outline: "none",
    minWidth: "160px",
  },
  select: {
    background: "#0c0e14",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#eef1f6",
    outline: "none",
  },
  button: {
    background: "#2f6dff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    fontSize: "13px",
    color: "#ff5a5a",
    marginBottom: "16px",
  },
  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
