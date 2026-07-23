"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PortafolioNav from "@/components/portafolio/PortafolioNav";
import TareasTable from "@/components/portafolio/TareasTable";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";

type NivelImportancia = Tarea["nivel_importancia"];

export default function PortafolioTareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startupFilter, setStartupFilter] = useState("all");
  const [importanciaFilter, setImportanciaFilter] = useState<"all" | NivelImportancia>("all");
  const [hideCompletadas, setHideCompletadas] = useState(false);

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

  const startups = useMemo(
    () => Array.from(new Set(tareas.map((t) => t.startup))).sort(),
    [tareas]
  );

  const filtered = useMemo(() => {
    return tareas.filter((t) => {
      const matchStartup = startupFilter === "all" || t.startup === startupFilter;
      const matchImportancia = importanciaFilter === "all" || t.nivel_importancia === importanciaFilter;
      const matchCompletada = !hideCompletadas || t.estado !== "completado";
      return matchStartup && matchImportancia && matchCompletada;
    });
  }, [tareas, startupFilter, importanciaFilter, hideCompletadas]);

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
          <select
            value={startupFilter}
            onChange={(e) => setStartupFilter(e.target.value)}
            style={s.select}
          >
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

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: "#ff5a5a" }}>{error}</p>
        ) : (
          <TareasTable tareas={filtered} />
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050506", color: "#eef1f6" },
  main: { maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" },
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
  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
