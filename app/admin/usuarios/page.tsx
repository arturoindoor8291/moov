"use client";

import { useState, useEffect, useCallback } from "react";
import AdminNav from "@/components/admin/AdminNav";
import TareasUsersTable, { type TareasUserRow } from "@/components/admin/TareasUsersTable";
import { CANONICAL_PROYECTOS } from "@/lib/portfolio/proyectos";

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<TareasUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "member">("member");
  const [newProyectos, setNewProyectos] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tareas-usuarios");
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

  function toggleNewProyecto(proyecto: string) {
    setNewProyectos((prev) =>
      prev.includes(proyecto) ? prev.filter((p) => p !== proyecto) : [...prev, proyecto]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tareas-usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          proyectos: newProyectos,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.message || "No se pudo crear el usuario.");
        return;
      }
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("member");
      setNewProyectos([]);
      await fetchUsers();
    } catch {
      setCreateError("Error de conexión.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(id: string, status: "active" | "paused") {
    await fetch(`/api/admin/tareas-usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  }

  async function handleResetPassword(id: string, password: string) {
    await fetch(`/api/admin/tareas-usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/tareas-usuarios/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div style={s.page}>
      <AdminNav active="usuarios" />
      <main style={s.main}>
        <div style={s.header}>
          <h1 style={s.title}>Usuarios de tareas</h1>
          <p style={s.subtitle}>
            {users.length} usuario(s) con acceso a /tareas — su propio tablero, filtrado a sus proyectos.
          </p>
        </div>

        <form onSubmit={handleCreate} style={s.createForm}>
          <div style={s.createRow}>
            <input
              type="text"
              placeholder="Nombre"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              style={s.input}
            />
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
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
              onChange={(e) => setNewRole(e.target.value as "admin" | "member")}
              style={s.select}
            >
              <option value="member">Miembro (solo sus proyectos)</option>
              <option value="admin">Admin de tareas (todos los proyectos)</option>
            </select>
            <button type="submit" disabled={creating} style={s.button}>
              {creating ? "Creando..." : "Agregar usuario"}
            </button>
          </div>

          {newRole === "member" && (
            <div style={s.proyectosRow}>
              <span style={s.proyectosLabel}>Proyectos asignados:</span>
              {CANONICAL_PROYECTOS.map((p) => (
                <label key={p} style={s.proyectoCheck}>
                  <input
                    type="checkbox"
                    checked={newProyectos.includes(p)}
                    onChange={() => toggleNewProyecto(p)}
                    style={s.checkbox}
                  />
                  {p}
                </label>
              ))}
            </div>
          )}
        </form>
        {createError && <p style={s.error}>{createError}</p>}

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: "#ff5a5a" }}>{error}</p>
        ) : (
          <TareasUsersTable
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
    flexDirection: "column",
    gap: "12px",
    marginBottom: "12px",
    padding: "16px",
    background: "#07080d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
  },
  createRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  input: {
    background: "#0c0e14",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#eef1f6",
    outline: "none",
    minWidth: "180px",
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
  proyectosRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    paddingTop: "4px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  proyectosLabel: { fontSize: "12px", color: "rgba(238,241,246,0.5)", fontWeight: 600 },
  proyectoCheck: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "rgba(238,241,246,0.75)",
    cursor: "pointer",
  },
  checkbox: { width: "14px", height: "14px", cursor: "pointer" },
  error: {
    fontSize: "13px",
    color: "#ff5a5a",
    marginBottom: "16px",
  },
  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
