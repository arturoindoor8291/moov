"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import TareasKanbanBoard from "@/components/portafolio/TareasKanbanBoard";
import TareaTableView from "@/components/portafolio/TareaTableView";
import ProyectoSummaryChips from "@/components/portafolio/ProyectoSummaryChips";
import TareaFormModal, { type TareaFormValues } from "@/components/portafolio/TareaFormModal";
import { COLUMNA_LABEL, TIPO_TAREA_LABEL } from "@/components/portafolio/TareaCard";
import { canonicalProyecto, esResponsable, RESPONSABLES_CONOCIDOS, theme } from "@/components/portafolio/tareasTheme";
import { descendantIds } from "@/lib/portfolio/tareaTree";
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
  const [soloMias, setSoloMias] = useState(false);
  const [importanciaFilter, setImportanciaFilter] = useState<"all" | Tarea["nivel_importancia"]>("all");
  const [urgenciaFilter, setUrgenciaFilter] = useState<"all" | Tarea["nivel_urgencia"]>("all");
  const [tipoFilter, setTipoFilter] = useState<"all" | Tarea["tipo_tarea"]>("all");
  const [estadoFilter, setEstadoFilter] = useState<"all" | Tarea["columna_kanban"]>("all");
  const [responsableFilter, setResponsableFilter] = useState("all");
  const [saveError, setSaveError] = useState("");
  const [view, setView] = useState<"kanban" | "tabla">("kanban");
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

  // El filtro de responsable solo ofrece a las personas reales del equipo,
  // no las contrapartes externas que a veces quedan en el campo responsable.
  const responsables = RESPONSABLES_CONOCIDOS;

  const filtered = useMemo(() => {
    let result = tareas;
    if (selectedProyecto !== null) {
      result = result.filter((t) => canonicalProyecto(t.proyecto) === selectedProyecto);
    }
    if (soloMias && me) {
      const mine = [me.name, me.email].filter(Boolean).map((v) => v.trim().toLowerCase());
      result = result.filter((t) => mine.includes(t.responsable.trim().toLowerCase()));
    }
    if (importanciaFilter !== "all") result = result.filter((t) => t.nivel_importancia === importanciaFilter);
    if (urgenciaFilter !== "all") result = result.filter((t) => t.nivel_urgencia === urgenciaFilter);
    if (tipoFilter !== "all") result = result.filter((t) => t.tipo_tarea === tipoFilter);
    if (estadoFilter !== "all") result = result.filter((t) => t.columna_kanban === estadoFilter);
    if (responsableFilter !== "all") result = result.filter((t) => esResponsable(t.responsable, responsableFilter));
    return result;
  }, [
    tareas,
    selectedProyecto,
    soloMias,
    me,
    importanciaFilter,
    urgenciaFilter,
    tipoFilter,
    estadoFilter,
    responsableFilter,
  ]);

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

  // Creación inline desde la vista de Tabla, sin abrir el modal — la fila
  // aparece en su lugar en la tabla con solo el nombre por escribir.
  const handleCreateInline = useCallback(
    async (input: { proyecto: string; parent_id: string | null; tarea: string }) => {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto: input.proyecto,
          parent_id: input.parent_id,
          tarea: input.tarea,
          tipo_tarea: "compromiso_propio",
          nivel_importancia: "media",
          nivel_urgencia: "sin_urgencia_definida",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const saved: Tarea = await res.json();
      setTareas((prev) => [saved, ...prev]);
      return saved;
    },
    []
  );

  // Solo aplica al editar (la creación ya no pasa por el modal): opciones
  // de "actividad principal" dentro del mismo proyecto, sin la tarea misma
  // ni sus descendientes (evita un ciclo).
  const parentOptions = useMemo(() => {
    if (!modalTarea) return undefined;
    const excluded = new Set([modalTarea.id, ...descendantIds(tareas, modalTarea.id)]);
    return tareas
      .filter((t) => canonicalProyecto(t.proyecto) === canonicalProyecto(modalTarea.proyecto) && !excluded.has(t.id))
      .map((t) => ({ id: t.id, tarea: t.tarea }));
  }, [tareas, modalTarea]);

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
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() => setSoloMias((v) => !v)}
                style={{ ...s.viewToggleBtn, ...(soloMias ? s.viewToggleBtnActive : {}), border: `1px solid ${theme.border}`, borderRadius: "8px" }}
              >
                Asignadas a mí
              </button>
              <div style={s.viewToggle}>
                <button
                  onClick={() => setView("kanban")}
                  style={{ ...s.viewToggleBtn, ...(view === "kanban" ? s.viewToggleBtnActive : {}) }}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setView("tabla")}
                  style={{ ...s.viewToggleBtn, ...(view === "tabla" ? s.viewToggleBtnActive : {}) }}
                >
                  Tabla
                </button>
              </div>
              <button onClick={() => setModalTarea(null)} style={s.newBtn}>
                + Nueva tarea
              </button>
            </div>
          )}
        </div>

        <ProyectoSummaryChips tareas={tareas} selectedProyecto={selectedProyecto} onSelect={selectProyecto} />

        {tareas.length > 0 && (
          <div style={s.controls}>
            <select
              value={importanciaFilter}
              onChange={(e) => setImportanciaFilter(e.target.value as "all" | Tarea["nivel_importancia"])}
              style={s.select}
            >
              <option value="all">Toda importancia</option>
              <option value="alta">🔴 Alta</option>
              <option value="media">🟡 Media</option>
              <option value="baja">⚪ Baja</option>
            </select>
            <select
              value={urgenciaFilter}
              onChange={(e) => setUrgenciaFilter(e.target.value as "all" | Tarea["nivel_urgencia"])}
              style={s.select}
            >
              <option value="all">Toda urgencia</option>
              <option value="inmediata">🔺 Inmediata</option>
              <option value="esta_semana">🟠 Esta semana</option>
              <option value="este_mes">🔵 Este mes</option>
              <option value="sin_urgencia_definida">⚪ Sin urgencia definida</option>
            </select>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as "all" | Tarea["tipo_tarea"])}
              style={s.select}
            >
              <option value="all">Todo tipo</option>
              {(Object.keys(TIPO_TAREA_LABEL) as Tarea["tipo_tarea"][]).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_TAREA_LABEL[tipo]}
                </option>
              ))}
            </select>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as "all" | Tarea["columna_kanban"])}
              style={s.select}
            >
              <option value="all">Todo estado</option>
              {(Object.keys(COLUMNA_LABEL) as Tarea["columna_kanban"][]).map((col) => (
                <option key={col} value={col}>
                  {COLUMNA_LABEL[col]}
                </option>
              ))}
            </select>
            <select value={responsableFilter} onChange={(e) => setResponsableFilter(e.target.value)} style={s.select}>
              <option value="all">Todo responsable</option>
              {responsables.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {saveError && <p style={s.saveError}>{saveError}</p>}

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: theme.danger }}>{error}</p>
        ) : tareas.length === 0 ? (
          <p style={s.empty}>Todavía no tienes proyectos asignados. Pide a tu administrador que te dé acceso.</p>
        ) : view === "kanban" ? (
          <TareasKanbanBoard
            tareas={filtered}
            tareasById={tareasById}
            onColumnChange={handleColumnChange}
            onEdit={(t) => setModalTarea(t)}
          />
        ) : (
          <TareaTableView
            tareas={filtered}
            onColumnChange={handleColumnChange}
            onEdit={(t) => setModalTarea(t)}
            onCreateTarea={handleCreateInline}
          />
        )}

        {modalTarea !== undefined && (
          <TareaFormModal
            tarea={modalTarea}
            onClose={() => setModalTarea(undefined)}
            onSave={handleSaveTarea}
            proyectoOptions={proyectoOptions}
            hideConfidencial
            parentOptions={parentOptions}
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
  viewToggle: {
    display: "flex",
    border: `1px solid ${theme.border}`,
    borderRadius: "8px",
    overflow: "hidden",
  },
  viewToggleBtn: {
    background: theme.surface2,
    border: "none",
    padding: "9px 14px",
    fontSize: "13px",
    color: theme.textMuted,
    cursor: "pointer",
  },
  viewToggleBtnActive: {
    background: theme.surface3,
    color: theme.text,
    fontWeight: 600,
  },
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
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  select: {
    background: theme.surface2,
    border: `1px solid ${theme.border}`,
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: theme.text,
    outline: "none",
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
