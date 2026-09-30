"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import AdminNav from "@/components/admin/AdminNav";
import TareasKanbanBoard from "@/components/portafolio/TareasKanbanBoard";
import TareaTableView from "@/components/portafolio/TareaTableView";
import ProyectoSummaryChips from "@/components/portafolio/ProyectoSummaryChips";
import { COLUMNA_LABEL, TIPO_TAREA_LABEL } from "@/components/portafolio/TareaCard";
import TareaFormModal, { type TareaFormValues } from "@/components/portafolio/TareaFormModal";
import { canonicalProyecto, esResponsable, RESPONSABLES_CONOCIDOS, theme } from "@/components/portafolio/tareasTheme";
import { descendantIds } from "@/lib/portfolio/tareaTree";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";

type NivelImportancia = Tarea["nivel_importancia"];
type NivelUrgencia = Tarea["nivel_urgencia"];
type TipoTarea = Tarea["tipo_tarea"];

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

export default function AdminTareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProyecto, setSelectedProyecto] = useState<string | null>(null);
  const [startupFilter, setStartupFilter] = useState("all");
  const [importanciaFilter, setImportanciaFilter] = useState<"all" | NivelImportancia>("all");
  const [urgenciaFilter, setUrgenciaFilter] = useState<"all" | NivelUrgencia>("all");
  const [tipoFilter, setTipoFilter] = useState<"all" | TipoTarea>("all");
  const [estadoFilter, setEstadoFilter] = useState<"all" | Tarea["columna_kanban"]>("all");
  const [responsableFilter, setResponsableFilter] = useState("all");
  const [hideCompletadas, setHideCompletadas] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [view, setView] = useState<"kanban" | "tabla">("kanban");
  const [usuarioNombres, setUsuarioNombres] = useState<string[]>([]);
  // undefined = modal closed, null = creating a new tarea, Tarea = editing
  const [modalTarea, setModalTarea] = useState<Tarea | null | undefined>(undefined);

  const fetchTareas = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tareas");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTareas(data.tareas);
      setUltimaActualizacion(data.ultimaActualizacion);
    } catch {
      setError("No se pudieron cargar las tareas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTareas();
  }, [fetchTareas]);

  useEffect(() => {
    fetch("/api/admin/tareas-usuarios")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.users) setUsuarioNombres(data.users.map((u: { name: string }) => u.name).filter(Boolean));
      })
      .catch(() => {
        // No bloquea el tablero si Airtable no está configurado todavía.
      });
  }, []);

  const tareasById = useMemo(() => new Map(tareas.map((t) => [t.id, t])), [tareas]);

  const proyectos = useMemo(
    () => Array.from(new Set(tareas.map((t) => canonicalProyecto(t.proyecto)))).sort(),
    [tareas]
  );

  const startups = useMemo(
    () => Array.from(new Set(tareas.map((t) => t.startup))).sort(),
    [tareas]
  );

  // El filtro de responsable solo ofrece a las personas reales del equipo,
  // no las contrapartes externas que a veces quedan en el campo responsable
  // (ej. "Mobi (envía)", "Leasy (Alejandro)").
  const responsables = RESPONSABLES_CONOCIDOS;

  // Aislar un proyecto: clic lo selecciona y el tablero solo muestra sus
  // tareas; clic de nuevo sobre el mismo lo quita y vuelve a mostrar todos.
  const selectProyecto = useCallback((proyecto: string) => {
    setSelectedProyecto((cur) => (cur === proyecto ? null : proyecto));
  }, []);

  const filtered = useMemo(() => {
    return tareas.filter((t) => {
      const matchProyecto = selectedProyecto === null || canonicalProyecto(t.proyecto) === selectedProyecto;
      const matchStartup = startupFilter === "all" || t.startup === startupFilter;
      const matchImportancia = importanciaFilter === "all" || t.nivel_importancia === importanciaFilter;
      const matchUrgencia = urgenciaFilter === "all" || t.nivel_urgencia === urgenciaFilter;
      const matchTipo = tipoFilter === "all" || t.tipo_tarea === tipoFilter;
      const matchEstado = estadoFilter === "all" || t.columna_kanban === estadoFilter;
      const matchResponsable = responsableFilter === "all" || esResponsable(t.responsable, responsableFilter);
      const matchCompletada = !hideCompletadas || t.columna_kanban !== "completada";
      return (
        matchProyecto &&
        matchStartup &&
        matchImportancia &&
        matchUrgencia &&
        matchTipo &&
        matchEstado &&
        matchResponsable &&
        matchCompletada
      );
    });
  }, [
    tareas,
    selectedProyecto,
    startupFilter,
    importanciaFilter,
    urgenciaFilter,
    tipoFilter,
    estadoFilter,
    responsableFilter,
    hideCompletadas,
  ]);

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

    fetch(`/api/admin/tareas/${id}`, {
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
    const res = await fetch(id ? `/api/admin/tareas/${id}` : "/api/admin/tareas", {
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
      const res = await fetch("/api/admin/tareas", {
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

  const abiertas = tareas.filter((t) => t.columna_kanban !== "completada").length;

  return (
    <div className={`${spaceGrotesk.variable} ${ibmPlexSans.variable}`} style={s.page}>
      <AdminNav active="tareas" />
      <main style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Tareas y Compromisos</h1>
            <p style={s.subtitle}>
              {abiertas} actividades abiertas en {proyectos.length || "—"} proyecto{proyectos.length === 1 ? "" : "s"}
              {ultimaActualizacion &&
                ` · Datos al ${new Date(ultimaActualizacion).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
        </div>

        <ProyectoSummaryChips tareas={tareas} selectedProyecto={selectedProyecto} onSelect={selectProyecto} />

        <div style={s.controls}>
          <select value={startupFilter} onChange={(e) => setStartupFilter(e.target.value)} style={s.select}>
            <option value="all">Todas las startups</option>
            {startups.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <select
            value={importanciaFilter}
            onChange={(e) => setImportanciaFilter(e.target.value as "all" | NivelImportancia)}
            style={s.select}
          >
            <option value="all">Toda importancia</option>
            <option value="alta">🔴 Alta</option>
            <option value="media">🟡 Media</option>
            <option value="baja">⚪ Baja</option>
          </select>
          <select
            value={urgenciaFilter}
            onChange={(e) => setUrgenciaFilter(e.target.value as "all" | NivelUrgencia)}
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
            onChange={(e) => setTipoFilter(e.target.value as "all" | TipoTarea)}
            style={s.select}
          >
            <option value="all">Todo tipo</option>
            {(Object.keys(TIPO_TAREA_LABEL) as TipoTarea[]).map((tipo) => (
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
          <label style={s.toggle}>
            <input
              type="checkbox"
              checked={hideCompletadas}
              onChange={(e) => setHideCompletadas(e.target.checked)}
              style={s.checkbox}
            />
            Ocultar completadas
          </label>
          <div style={{ flexGrow: 1 }} />
          <span style={s.hint}>Clic en un proyecto arriba para aislarlo. Clic en una tarjeta para ver el detalle.</span>
        </div>

        {saveError && <p style={s.saveError}>{saveError}</p>}

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: theme.danger }}>{error}</p>
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
            parentOptions={parentOptions}
            usuarioOptions={usuarioNombres}
          />
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "var(--tareas-font-body)" },
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
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: theme.textMuted,
    marginLeft: "4px",
    cursor: "pointer",
  },
  checkbox: { width: "14px", height: "14px", cursor: "pointer" },
  hint: { fontSize: "11px", color: theme.textFaint, whiteSpace: "nowrap" },
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
