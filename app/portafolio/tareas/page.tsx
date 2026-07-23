"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PortafolioNav from "@/components/portafolio/PortafolioNav";
import TareasKanbanBoard from "@/components/portafolio/TareasKanbanBoard";
import { TIPO_TAREA_LABEL } from "@/components/portafolio/TareaCard";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";

type NivelImportancia = Tarea["nivel_importancia"];
type NivelUrgencia = Tarea["nivel_urgencia"];
type TipoTarea = Tarea["tipo_tarea"];

export default function PortafolioTareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startupFilter, setStartupFilter] = useState("all");
  const [importanciaFilter, setImportanciaFilter] = useState<"all" | NivelImportancia>("all");
  const [urgenciaFilter, setUrgenciaFilter] = useState<"all" | NivelUrgencia>("all");
  const [tipoFilter, setTipoFilter] = useState<"all" | TipoTarea>("all");
  const [hideCompletadas, setHideCompletadas] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchTareas = useCallback(async () => {
    try {
      const res = await fetch("/api/portafolio/tareas");
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

  const tareasById = useMemo(() => new Map(tareas.map((t) => [t.id, t])), [tareas]);

  const startups = useMemo(
    () => Array.from(new Set(tareas.map((t) => t.startup))).sort(),
    [tareas]
  );

  const filtered = useMemo(() => {
    return tareas.filter((t) => {
      const matchStartup = startupFilter === "all" || t.startup === startupFilter;
      const matchImportancia = importanciaFilter === "all" || t.nivel_importancia === importanciaFilter;
      const matchUrgencia = urgenciaFilter === "all" || t.nivel_urgencia === urgenciaFilter;
      const matchTipo = tipoFilter === "all" || t.tipo_tarea === tipoFilter;
      const matchCompletada = !hideCompletadas || t.columna_kanban !== "completada";
      return matchStartup && matchImportancia && matchUrgencia && matchTipo && matchCompletada;
    });
  }, [tareas, startupFilter, importanciaFilter, urgenciaFilter, tipoFilter, hideCompletadas]);

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

    fetch(`/api/portafolio/tareas/${id}`, {
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

  return (
    <div style={s.page}>
      <PortafolioNav active="tareas" />
      <main style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Tareas y Compromisos</h1>
            <p style={s.subtitle}>
              {tareas.length} tareas registradas
              {ultimaActualizacion &&
                ` · Datos al ${new Date(ultimaActualizacion).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}`}
            </p>
          </div>
        </div>

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
          <label style={s.toggle}>
            <input
              type="checkbox"
              checked={hideCompletadas}
              onChange={(e) => setHideCompletadas(e.target.checked)}
              style={s.checkbox}
            />
            Ocultar completadas
          </label>
        </div>

        {saveError && <p style={s.saveError}>{saveError}</p>}

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: "#ff5a5a" }}>{error}</p>
        ) : (
          <TareasKanbanBoard tareas={filtered} tareasById={tareasById} onColumnChange={handleColumnChange} />
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050506", color: "#eef1f6" },
  main: { maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    gap: "16px",
    flexWrap: "wrap",
  },
  title: { fontSize: "26px", fontWeight: 700, margin: "0 0 4px" },
  subtitle: { fontSize: "13px", color: "rgba(238,241,246,0.45)", margin: 0 },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "24px",
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
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "rgba(238,241,246,0.65)",
    marginLeft: "4px",
    cursor: "pointer",
  },
  checkbox: { width: "14px", height: "14px", cursor: "pointer" },
  saveError: {
    fontSize: "13px",
    color: "#ff5a5a",
    background: "rgba(255,90,90,0.08)",
    border: "1px solid rgba(255,90,90,0.25)",
    borderRadius: "10px",
    padding: "10px 14px",
    marginBottom: "16px",
  },
  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
