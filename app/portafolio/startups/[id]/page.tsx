"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PortafolioNav from "@/components/portafolio/PortafolioNav";
import HealthBadge from "@/components/portafolio/HealthBadge";
import type { StartupWithId } from "@/lib/portfolio/portfolioSchemas";
import { formatMetricValue, formatUsd, formatPct } from "@/lib/portfolio/format";

export default function StartupDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<StartupWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStartup = useCallback(async () => {
    try {
      const res = await fetch(`/api/portafolio/startups/${params.id}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch {
      setError("No se pudo cargar esta startup.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchStartup();
  }, [fetchStartup]);

  return (
    <div style={s.page}>
      <PortafolioNav active="dashboard" />
      <main style={s.main}>
        <Link href="/portafolio" style={s.back}>
          ← Startups
        </Link>

        {loading ? (
          <p style={s.empty}>Cargando...</p>
        ) : error || !data ? (
          <p style={{ ...s.empty, color: "#ff5a5a" }}>{error || "No encontrada."}</p>
        ) : (
          <>
            <div style={s.header}>
              <div>
                <h1 style={s.title}>{data.nombre}</h1>
                <p style={s.sector}>{data.sector}</p>
                <p style={s.meta}>
                  {data.modelo_negocio} · {data.paises.join(", ")}
                </p>
              </div>
              <HealthBadge estado={data.estado} />
            </div>

            {data.alertas.length > 0 && (
              <div style={s.section}>
                <h2 style={s.sectionTitle}>Alertas activas</h2>
                <div style={s.alertList}>
                  {data.alertas.map((a, i) => (
                    <div key={i} style={s.alertCard}>
                      <p style={s.alertDesc}>⚠ {a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={s.twoCol}>
              <div style={s.section}>
                <h2 style={s.sectionTitle}>Resumen legal</h2>
                <dl style={s.dl}>
                  <dt style={s.dt}>Instrumento</dt>
                  <dd style={s.dd}>{data.legal.instrumento || "No localizado"}</dd>
                  <dt style={s.dt}>Monto invertido</dt>
                  <dd style={s.dd}>{formatUsd(data.legal.monto_usd)}</dd>
                  <dt style={s.dt}>Fecha de inversión</dt>
                  <dd style={s.dd}>{data.legal.fecha_inversion || "—"}</dd>
                  {data.legal.cap_usd != null && (
                    <>
                      <dt style={s.dt}>Cap</dt>
                      <dd style={s.dd}>{formatUsd(data.legal.cap_usd)}</dd>
                    </>
                  )}
                  <dt style={s.dt}>Vencimiento</dt>
                  <dd style={s.dd}>{data.legal.vencimiento || "—"}</dd>
                  <dt style={s.dt}>Entidad</dt>
                  <dd style={s.dd}>{data.legal.entidad || "—"}</dd>
                </dl>
                {data.legal.notas && <p style={s.notes}>{data.legal.notas}</p>}
              </div>

              <div style={s.section}>
                <h2 style={s.sectionTitle}>Resumen financiero</h2>
                {data.financiero.metrica_principal && data.financiero.valor != null ? (
                  <div style={s.metricBox}>
                    <span style={s.metricValue}>
                      {formatMetricValue(data.financiero.valor, data.financiero.moneda)}
                    </span>
                    <span style={s.metricLabel}>
                      {data.financiero.metrica_principal}
                      {data.financiero.fecha_dato ? ` — ${data.financiero.fecha_dato}` : ""}
                    </span>
                  </div>
                ) : (
                  <p style={s.bodyText}>Sin dato financiero disponible.</p>
                )}
                <div style={s.metricGrid}>
                  {data.financiero.arr != null && (
                    <div style={s.metricBox}>
                      <span style={s.metricValue}>{formatUsd(data.financiero.arr)}</span>
                      <span style={s.metricLabel}>ARR</span>
                    </div>
                  )}
                  {data.financiero.ebitda != null && (
                    <div style={s.metricBox}>
                      <span style={s.metricValue}>{formatUsd(data.financiero.ebitda)}</span>
                      <span style={s.metricLabel}>EBITDA</span>
                    </div>
                  )}
                  {data.financiero.margen_ebitda_pct != null && (
                    <div style={s.metricBox}>
                      <span style={s.metricValue}>{formatPct(data.financiero.margen_ebitda_pct)}</span>
                      <span style={s.metricLabel}>Margen EBITDA</span>
                    </div>
                  )}
                  {data.financiero.arr_objetivo != null && (
                    <div style={s.metricBox}>
                      <span style={s.metricValue}>{formatUsd(data.financiero.arr_objetivo)}</span>
                      <span style={s.metricLabel}>ARR objetivo</span>
                    </div>
                  )}
                </div>
                {data.financiero.tendencia && (
                  <p style={s.trendSummary}>{data.financiero.tendencia}</p>
                )}
              </div>
            </div>

            <div style={s.section}>
              <h2 style={s.sectionTitle}>Situación actual</h2>
              <p style={s.bodyText}>{data.situacion_actual}</p>
              {data.proximos_pasos.length > 0 && (
                <>
                  <h3 style={s.subTitle}>Próximos pasos recomendados</h3>
                  <ul style={s.list}>
                    {data.proximos_pasos.map((step, i) => (
                      <li key={i} style={s.listItem}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050506", color: "#eef1f6" },
  main: { maxWidth: "960px", margin: "0 auto", padding: "32px 24px" },
  back: {
    fontSize: "13px",
    color: "rgba(238,241,246,0.5)",
    textDecoration: "none",
    display: "inline-block",
    marginBottom: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    gap: "12px",
  },
  title: { fontSize: "28px", fontWeight: 700, margin: "0 0 4px" },
  sector: { fontSize: "14px", color: "rgba(238,241,246,0.5)", margin: "0 0 4px" },
  meta: { fontSize: "12px", color: "rgba(238,241,246,0.35)", margin: 0 },
  section: {
    background: "#07080d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "16px",
  },
  sectionTitle: { fontSize: "15px", fontWeight: 700, margin: "0 0 14px", color: "#eef1f6" },
  subTitle: { fontSize: "13px", fontWeight: 600, margin: "16px 0 8px", color: "rgba(238,241,246,0.7)" },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  dl: { margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "10px", columnGap: "12px" },
  dt: { fontSize: "12px", color: "rgba(238,241,246,0.45)" },
  dd: { fontSize: "13px", color: "#eef1f6", margin: 0, textAlign: "right" },
  notes: {
    fontSize: "12px",
    color: "rgba(238,241,246,0.5)",
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    lineHeight: 1.5,
  },
  trendSummary: { fontSize: "13px", color: "rgba(238,241,246,0.65)", margin: "12px 0 0" },
  metricGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" },
  metricBox: { display: "flex", flexDirection: "column", marginBottom: "4px" },
  metricValue: { fontSize: "18px", fontWeight: 700, color: "#eef1f6" },
  metricLabel: { fontSize: "11px", color: "rgba(238,241,246,0.4)" },
  bodyText: { fontSize: "14px", color: "rgba(238,241,246,0.75)", lineHeight: 1.6, margin: 0 },
  list: { margin: "8px 0 0", paddingLeft: "18px" },
  listItem: { fontSize: "14px", color: "rgba(238,241,246,0.75)", lineHeight: 1.6 },
  alertList: { display: "flex", flexDirection: "column", gap: "10px" },
  alertCard: {
    border: "1px solid rgba(255,195,0,0.25)",
    background: "rgba(255,195,0,0.08)",
    borderRadius: "10px",
    padding: "12px 14px",
  },
  alertDesc: { fontSize: "13px", color: "rgba(238,241,246,0.85)", margin: 0 },
  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
