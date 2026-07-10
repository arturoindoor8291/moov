"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PortafolioNav from "@/components/portafolio/PortafolioNav";
import StartupCard from "@/components/portafolio/StartupCard";
import type { StartupWithId, StartupEstadoSchema } from "@/lib/portfolio/portfolioSchemas";
import type { z } from "zod";

type Estado = z.infer<typeof StartupEstadoSchema>;

const ESTADO_LABEL: Record<Estado, string> = {
  sano: "🟢 Sano",
  vigilar: "🟡 Vigilar",
  critico: "🔴 Crítico",
};

export default function PortafolioDashboardPage() {
  const [startups, setStartups] = useState<StartupWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"all" | Estado>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const fetchStartups = useCallback(async () => {
    try {
      const res = await fetch("/api/portafolio/startups");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setStartups(data.startups);
    } catch {
      setError("No se pudieron cargar las startups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);

  const sectors = useMemo(
    () => Array.from(new Set(startups.map((s) => s.sector))).sort(),
    [startups]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return startups.filter((s) => {
      const matchSearch = !q || s.nombre.toLowerCase().includes(q);
      const matchEstado = estadoFilter === "all" || s.estado === estadoFilter;
      const matchSector = sectorFilter === "all" || s.sector === sectorFilter;
      return matchSearch && matchEstado && matchSector;
    });
  }, [startups, search, estadoFilter, sectorFilter]);

  return (
    <div style={s.page}>
      <PortafolioNav active="dashboard" />
      <main style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Startups</h1>
            <p style={s.subtitle}>{startups.length} startups en el portafolio</p>
          </div>
        </div>

        <div style={s.controls}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            style={s.search}
          />
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as "all" | Estado)}
            style={s.select}
          >
            <option value="all">Todos los estados</option>
            <option value="sano">{ESTADO_LABEL.sano}</option>
            <option value="vigilar">{ESTADO_LABEL.vigilar}</option>
            <option value="critico">{ESTADO_LABEL.critico}</option>
          </select>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            style={s.select}
          >
            <option value="all">Todos los sectores</option>
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: "#ff5a5a" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={s.empty}>Ninguna startup coincide con el filtro.</p>
        ) : (
          <div style={s.grid}>
            {filtered.map((st) => (
              <StartupCard key={st.id} startup={st} />
            ))}
          </div>
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
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  search: {
    flex: "1 1 220px",
    background: "#0c0e14",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#eef1f6",
    outline: "none",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },
  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
