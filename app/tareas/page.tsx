"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import TareasKanbanBoard from "@/components/portafolio/TareasKanbanBoard";
import ProyectoSummaryChips from "@/components/portafolio/ProyectoSummaryChips";
import TareaFormModal, { type TareaFormValues } from "@/components/portafolio/TareaFormModal";
import { canonicalProyecto, theme } from "@/components/portafolio/tareasTheme";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";

interface TareasMe {
  name: string;
  email: string;
  role: "admin" | "member";
  proyectos: string[];
}

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--tareas-font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--tareas-font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

export default function TareasPage() {
  const router = useRouter();
  const [me, setMe] = useState<TareasMe | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProyecto, setSelectedProyecto] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  // undefined = modal closed, null = creating a new tarea, Tarea = editing
  const [modalTarea, setModalTarea] = useState<Tarea | null | undefined>(undefined);

  const fetchAll = useCallback(async () => {
    try {
      const [meRes, tareasRes] = await Promise.all([fetch("/api/tareas/me"), fetch("/api/tareas")]);
      if (!meRes.ok || !tareasRes.ok) throw new Error("Failed");
      setMe(await meRes.json());
      const data = await tareasRes.json();
      setTareas(data.tareas);
      setUltimaActualizacion(data.ultimaActualizacion);
    } catch {
      setError("No se pudieron cargar tus tareas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const tareasById = useMemo(() => new Map(tareas.map((t) => [t.id, t])), [tareas]);

  const proyectoOptions = useMemo(() => {
    if (!me) return [];
    if (me.role === "admin") return Array.from(new Set(tareas.map((t) => canonicalProyecto(t.proyecto)))).sort();
    return me.proyectos;
  }, [me, tareas]);

  const filtered = useMemo(() => {
    if (selectedProyecto === null) return tareas;
    return tareas.filter((t) => canonicalProyecto(t.proyecto) === selectedProyecto);
  }, [tareas, selectedProyecto]);

  const selectProyecto = useCallback((proyecto: string) => {
    setSelectedProyecto((cur) => (cur === proyecto ? null : proyecto));
  }, []);

  const handleColumnChange = useCallback((id: string, columna: Tarea["columna_kanban"]) => {
    let previousColumn: Tarea["columna_kanban"] | undefined;
    setSaveError("");
    setTareas((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        previousColumn = t.columna_kanban;
        return { ...t, columna_kanban: columna };
      })
    );

    fetch(`/api/tareas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columna_kanban: columna }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
      })
      .catch(() => {
        setTareas((prev) =>
          prev.map((t) => (t.id === id && previousColumn ? { ...t, columna_kanban: previousColumn } : t))
        );
        setSaveError("No se pudo guardar el cambio de estado. Intenta de nuevo.");
      });
  }, []);

  const handleSaveTarea = useCallback(async (values: TareaFormValues, id: string | null) => {
    const res = await fetch(id ? `/api/tareas/${id}` : "/api/tareas", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("Failed");
    const saved: Tarea = await res.json();
    setTareas((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev];
    });
    setModalTarea(undefined);
  }, []);

  async function handleLogout() {
    await fetch("/api/tareas/logout", { method: "POST" });
    router.push("/tareas/login");
  }

  const abiertas = tareas.filter((t) => t.columna_kanban !== "completada").length;

  return (
    <div className={`${spaceGrotesk.variable} ${ibmPlexSans.variable}`} style={s.page}>
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLeft}>
            <span style={s.logo}>MOOV</span>
            <span style={s.badge}>Tareas</span>
          </div>
          <div style={s.navRight}>
            {me && <span style={s.navEmail}>{me.name || me.email}</span>}
            <button onClick={handleLogout} style={s.logout}>
              Salir
            </button>
          </div>
        </div>
      </nav>
      <main style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Mis actividades</h1>
            <p style={s.subtitle}>
              {abiertas} abiertas en {proyectoOptions.length || "—"} proyecto{proyectoOptions.length === 1 ? "" : "s"}
              {ultimaActualizacion &&
                ` · Datos al ${new Date(ultimaActualizacion).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}`}
            </p>
          </div>
          {proyectoOptions.length > 0 && (
            <button onClick={() => setModalTarea(null)} style={s.newBtn}>
              + Nueva tarea
            </button>
          )}
        </div>

        <ProyectoSummaryChips tareas={tareas} selectedProyecto={selectedProyecto} onSelect={selectProyecto} />

        {saveError && <p style={s.saveError}>{saveError}</p>}

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: theme.danger }}>{error}</p>
        ) : tareas.length === 0 ? (
          <p style={s.empty}>Todavía no tienes proyectos asignados. Pide a tu administrador que te dé acceso.</p>
        ) : (
          <TareasKanbanBoard
            tareas={filtered}
            tareasById={tareasById}
            onColumnChange={handleColumnChange}
            onEdit={(t) => setModalTarea(t)}
          />
        )}

        {modalTarea !== undefined && (
          <TareaFormModal
            tarea={modalTarea}
            onClose={() => setModalTarea(undefined)}
            onSave={handleSaveTarea}
            proyectoOptions={proyectoOptions}
            hideConfidencial
          />
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "var(--tareas-font-body)" },
  nav: { background: theme.surface, borderBottom: `1px solid ${theme.border}`, position: "sticky", top: 0, zIndex: 50 },
  navInner: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 24px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navLeft: { display: "flex", alignItems: "center", gap: "10px" },
  logo: { fontSize: "18px", fontWeight: 800, color: theme.text, letterSpacing: "-0.5px" },
  badge: {
    fontSize: "10px",
    fontWeight: 600,
    color: theme.accent,
    background: "rgba(47,109,255,0.12)",
    border: "1px solid rgba(47,109,255,0.25)",
    borderRadius: "6px",
    padding: "2px 8px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  navRight: { display: "flex", alignItems: "center", gap: "14px" },
  navEmail: { fontSize: "13px", color: theme.textMuted },
  logout: {
    background: "transparent",
    border: `1px solid ${theme.border}`,
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "13px",
    color: theme.textMuted,
    cursor: "pointer",
  },
  main: { maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    gap: "16px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "26px",
    fontWeight: 600,
    margin: "0 0 4px",
    fontFamily: "var(--tareas-font-display)",
    letterSpacing: "-0.01em",
  },
  subtitle: { fontSize: "13px", color: theme.textMuted, margin: 0 },
  newBtn: {
    background: theme.accent,
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  saveError: {
    fontSize: "13px",
    color: theme.danger,
    background: "rgba(229,96,90,0.08)",
    border: "1px solid rgba(229,96,90,0.25)",
    borderRadius: "10px",
    padding: "10px 14px",
    marginBottom: "16px",
  },
  empty: { color: theme.textFaint, padding: "40px 0", textAlign: "center" },
};
