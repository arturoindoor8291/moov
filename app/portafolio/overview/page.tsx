"use client";

import { useState, useEffect } from "react";
import PortafolioNav from "@/components/portafolio/PortafolioNav";
import type { PortfolioFondo } from "@/lib/portfolio/portfolioSchemas";
import { formatUsd, formatPct } from "@/lib/portfolio/format";

// Categorical palette, fixed order (never cycled) — one hue per legal
// instrument type, cycling through the dataviz skill's validated
// dark-mode default steps if there are more types than colors.
const INSTRUMENT_COLOR_ORDER = ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767", "#d55181"];

// Existing app status colors (HealthBadge, StartupCard) — kept consistent
// across the dashboard rather than the dataviz skill's generic defaults.
const ESTADO_COLOR = { sano: "#28c850", vigilar: "#ffc300", critico: "#ff5a5a" };
const ESTADO_LABEL = { sano: "Sano", vigilar: "Vigilar", critico: "Crítico" };

export default function PortafolioOverviewPage() {
  const [data, setData] = useState<PortfolioFondo | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portafolio/overview")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json) => {
        setData(json.fondo);
        setUltimaActualizacion(json.ultimaActualizacion);
      })
      .catch(() => setError("No se pudo cargar el resumen del fondo."))
      .finally(() => setLoading(false));
  }, []);

  const totalStartups = data
    ? data.startups_sanas + data.startups_vigilar + data.startups_criticas
    : 0;
  const instrumentEntries = data ? Object.entries(data.distribucion_instrumento) : [];
  const maxInstrumentCount = instrumentEntries.length
    ? Math.max(...instrumentEntries.map(([, count]) => count), 1)
    : 1;

  return (
    <div style={s.page}>
      <PortafolioNav active="overview" />
      <main style={s.main}>
        <div style={s.header}>
          <h1 style={s.title}>Fondo</h1>
          {ultimaActualizacion && (
            <p style={s.subtitle}>
              Datos al{" "}
              {new Date(ultimaActualizacion).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error || !data ? (
          <p style={{ ...s.empty, color: "#ff5a5a" }}>{error || "Sin datos."}</p>
        ) : (
          <>
            {/* Fund growth — stat tiles + disclaimer */}
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Crecimiento del fondo</h2>
              <div style={s.statRow}>
                <div style={s.statTile}>
                  <span style={s.statLabel}>Capital invertido (confirmado)</span>
                  <span style={s.statValue}>{formatUsd(data.total_invertido_confirmado_usd)}</span>
                </div>
                <div style={s.statTile}>
                  <span style={s.statLabel}>MOIC a costo</span>
                  <span style={s.statValue}>{data.moic_a_costo.toFixed(1)}x</span>
                </div>
                <div style={s.statTile}>
                  <span style={s.statLabel}>Crecimiento a costo</span>
                  <span style={s.statValue}>{formatPct(data.crecimiento_pct_a_costo)}</span>
                </div>
              </div>
              <div style={s.disclaimer}>⚠️ {data.nota_crecimiento}</div>
              {data.startups_sin_monto_confirmado.length > 0 && (
                <p style={s.footnote}>
                  Sin monto de inversión confirmado: {data.startups_sin_monto_confirmado.join(", ")}
                </p>
              )}
            </div>

            <div style={s.twoCol}>
              {/* Health distribution — stacked bar */}
              <div style={s.section}>
                <h2 style={s.sectionTitle}>Distribución por salud</h2>
                <div style={s.stackedBar}>
                  {(["sano", "vigilar", "critico"] as const).map((key) => {
                    const count =
                      key === "sano"
                        ? data.startups_sanas
                        : key === "vigilar"
                          ? data.startups_vigilar
                          : data.startups_criticas;
                    if (count === 0) return null;
                    const pct = (count / totalStartups) * 100;
                    return (
                      <div
                        key={key}
                        style={{ ...s.stackedSegment, width: `${pct}%`, background: ESTADO_COLOR[key] }}
                        title={`${ESTADO_LABEL[key]}: ${count}`}
                      />
                    );
                  })}
                </div>
                <div style={s.legend}>
                  {(["sano", "vigilar", "critico"] as const).map((key) => {
                    const count =
                      key === "sano"
                        ? data.startups_sanas
                        : key === "vigilar"
                          ? data.startups_vigilar
                          : data.startups_criticas;
                    return (
                      <div key={key} style={s.legendItem}>
                        <span style={{ ...s.legendSwatch, background: ESTADO_COLOR[key] }} />
                        <span style={s.legendLabel}>
                          {ESTADO_LABEL[key]} ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legal instrument distribution — horizontal bars, by count */}
              <div style={s.section}>
                <h2 style={s.sectionTitle}>Distribución por instrumento legal</h2>
                <div style={s.barList}>
                  {instrumentEntries.map(([instrumento, count], i) => {
                    const color = INSTRUMENT_COLOR_ORDER[i % INSTRUMENT_COLOR_ORDER.length];
                    const widthPct = (count / maxInstrumentCount) * 100;
                    return (
                      <div key={instrumento} style={s.barRow}>
                        <span style={s.barRowLabel}>{instrumento}</span>
                        <div style={s.barTrack}>
                          <div
                            style={{ ...s.barFill, width: `${Math.max(widthPct, 6)}%`, background: color }}
                          />
                        </div>
                        <span style={s.barRowValue}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050506", color: "#eef1f6" },
  main: { maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" },
  header: { marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: 700, margin: "0 0 4px" },
  subtitle: { fontSize: "13px", color: "rgba(238,241,246,0.45)", margin: 0 },
  section: {
    background: "#07080d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "16px",
  },
  sectionTitle: { fontSize: "15px", fontWeight: 700, margin: "0 0 16px", color: "#eef1f6" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },

  statRow: { display: "flex", gap: "32px", marginBottom: "16px", flexWrap: "wrap" },
  statTile: { display: "flex", flexDirection: "column", gap: "4px" },
  statLabel: { fontSize: "12px", color: "rgba(238,241,246,0.5)" },
  statValue: { fontSize: "26px", fontWeight: 600, color: "#eef1f6" },
  disclaimer: {
    fontSize: "13px",
    color: "#ffc300",
    background: "rgba(255,195,0,0.08)",
    border: "1px solid rgba(255,195,0,0.25)",
    borderRadius: "10px",
    padding: "12px 14px",
    lineHeight: 1.5,
  },
  footnote: { fontSize: "12px", color: "rgba(238,241,246,0.4)", marginTop: "10px", marginBottom: 0 },

  stackedBar: {
    display: "flex",
    height: "24px",
    borderRadius: "4px",
    overflow: "hidden",
    gap: "2px",
    background: "#050506",
  },
  stackedSegment: { height: "100%" },
  legend: { display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" },
  legendItem: { display: "flex", alignItems: "center", gap: "6px" },
  legendSwatch: { width: "10px", height: "10px", borderRadius: "3px", display: "inline-block" },
  legendLabel: { fontSize: "12px", color: "rgba(238,241,246,0.65)" },

  barList: { display: "flex", flexDirection: "column", gap: "12px" },
  barRow: { display: "grid", gridTemplateColumns: "150px 1fr auto", alignItems: "center", gap: "10px" },
  barRowLabel: { fontSize: "12px", color: "rgba(238,241,246,0.65)" },
  barTrack: { background: "#050506", borderRadius: "4px", height: "20px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "4px" },
  barRowValue: { fontSize: "12px", color: "rgba(238,241,246,0.5)", whiteSpace: "nowrap", textAlign: "right" },

  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
