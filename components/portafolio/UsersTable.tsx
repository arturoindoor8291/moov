"use client";

import { useState } from "react";

export interface PortafolioUserRow {
  id: string;
  username: string;
  role: "admin" | "viewer";
  status: "active" | "paused";
  createdAt: string;
  lastLoginAt: string | null;
}

interface UsersTableProps {
  users: PortafolioUserRow[];
  onToggleStatus: (id: string, status: "active" | "paused") => Promise<void>;
  onResetPassword: (id: string, password: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function UsersTable({
  users,
  onToggleStatus,
  onResetPassword,
  onDelete,
}: UsersTableProps) {
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function handleResetSubmit(id: string) {
    if (!newPassword) return;
    await onResetPassword(id, newPassword);
    setResetTargetId(null);
    setNewPassword("");
  }

  return (
    <div style={s.tableWrap}>
      <table style={s.table}>
        <thead>
          <tr>
            {["Usuario", "Rol", "Estado", "Creado", "Último login", "Acciones"].map(
              (h) => (
                <th key={h} style={s.th}>
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={s.tr}>
              <td style={{ ...s.td, fontWeight: 600, color: "#eef1f6" }}>
                {u.username}
              </td>
              <td style={s.td}>{u.role}</td>
              <td style={s.td}>
                <span
                  style={{
                    ...s.statusBadge,
                    ...(u.status === "active" ? s.statusActive : s.statusPaused),
                  }}
                >
                  {u.status === "active" ? "Activo" : "Pausado"}
                </span>
              </td>
              <td style={s.td}>
                {new Date(u.createdAt).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td style={s.td}>
                {u.lastLoginAt
                  ? new Date(u.lastLoginAt).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td style={s.td}>
                <div style={s.actions}>
                  <button
                    style={s.actionBtn}
                    onClick={() =>
                      onToggleStatus(u.id, u.status === "active" ? "paused" : "active")
                    }
                  >
                    {u.status === "active" ? "Pausar" : "Reactivar"}
                  </button>

                  {resetTargetId === u.id ? (
                    <span style={s.resetRow}>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nueva contraseña"
                        style={s.resetInput}
                      />
                      <button
                        style={s.actionBtn}
                        onClick={() => handleResetSubmit(u.id)}
                      >
                        Guardar
                      </button>
                      <button
                        style={s.actionBtnGhost}
                        onClick={() => {
                          setResetTargetId(null);
                          setNewPassword("");
                        }}
                      >
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button
                      style={s.actionBtn}
                      onClick={() => setResetTargetId(u.id)}
                    >
                      Reset password
                    </button>
                  )}

                  <button
                    style={s.actionBtnDanger}
                    onClick={() => {
                      if (confirm(`¿Eliminar a ${u.username}?`)) onDelete(u.id);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  tableWrap: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 600,
    color: "rgba(238,241,246,0.4)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
  },
  tr: {},
  td: {
    padding: "14px 16px",
    fontSize: "13px",
    color: "rgba(238,241,246,0.7)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    whiteSpace: "nowrap",
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: 600,
    padding: "3px 9px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },
  statusActive: {
    background: "rgba(40,200,80,0.12)",
    color: "#28c850",
    border: "1px solid rgba(40,200,80,0.25)",
  },
  statusPaused: {
    background: "rgba(150,150,150,0.12)",
    color: "#969696",
    border: "1px solid rgba(150,150,150,0.25)",
  },
  actions: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  actionBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "rgba(238,241,246,0.7)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  actionBtnGhost: {
    background: "transparent",
    border: "none",
    padding: "5px 6px",
    fontSize: "12px",
    color: "rgba(238,241,246,0.4)",
    cursor: "pointer",
  },
  actionBtnDanger: {
    background: "rgba(255,90,90,0.08)",
    border: "1px solid rgba(255,90,90,0.2)",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#ff5a5a",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  resetRow: { display: "flex", alignItems: "center", gap: "6px" },
  resetInput: {
    background: "#0c0e14",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "5px 8px",
    fontSize: "12px",
    color: "#eef1f6",
    outline: "none",
    width: "140px",
  },
};
