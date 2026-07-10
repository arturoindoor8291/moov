import Link from "next/link";
import HealthBadge from "./HealthBadge";
import type { StartupWithId } from "@/lib/portfolio/portfolioSchemas";
import { formatMetricValue } from "@/lib/portfolio/format";

export default function StartupCard({ startup }: { startup: StartupWithId }) {
  const hasAlerts = startup.alertas.length > 0;
  const hasMetric = startup.financiero.metrica_principal && startup.financiero.valor != null;

  return (
    <Link href={`/portafolio/startups/${startup.id}`} style={s.link}>
      <div style={s.card}>
        <div style={s.header}>
          <span style={s.name}>{startup.nombre}</span>
          <HealthBadge estado={startup.estado} />
        </div>
        <p style={s.sector}>{startup.sector}</p>

        {hasMetric ? (
          <div style={s.metrics}>
            <div style={s.metric}>
              <span style={s.metricValue}>
                {formatMetricValue(startup.financiero.valor, startup.financiero.moneda)}
              </span>
              <span style={s.metricLabel}>{startup.financiero.metrica_principal}</span>
            </div>
          </div>
        ) : (
          <p style={s.emptyMetrics}>Sin métricas disponibles.</p>
        )}

        <div style={s.footer}>
          {hasAlerts && <span style={s.alertPill}>⚠ {startup.alertas.length} alerta(s)</span>}
          {startup.financiero.fecha_dato && (
            <span style={s.updated}>Dato al {startup.financiero.fecha_dato}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

const s: Record<string, React.CSSProperties> = {
  link: { textDecoration: "none", color: "inherit" },
  card: {
    background: "#07080d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "18px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    transition: "border-color 0.15s",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" },
  name: { fontSize: "16px", fontWeight: 700, color: "#eef1f6" },
  sector: { fontSize: "12px", color: "rgba(238,241,246,0.45)", margin: 0, minHeight: "32px" },
  metrics: { display: "flex", gap: "18px", marginTop: "4px" },
  metric: { display: "flex", flexDirection: "column" },
  metricValue: { fontSize: "18px", fontWeight: 700, color: "#eef1f6" },
  metricLabel: { fontSize: "11px", color: "rgba(238,241,246,0.4)" },
  emptyMetrics: { fontSize: "12px", color: "rgba(238,241,246,0.35)", margin: 0 },
  footer: {
    marginTop: "auto",
    paddingTop: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  alertPill: {
    fontSize: "11px",
    color: "#ff5a5a",
    background: "rgba(255,90,90,0.08)",
    border: "1px solid rgba(255,90,90,0.2)",
    borderRadius: "20px",
    padding: "2px 8px",
  },
  updated: { fontSize: "11px", color: "rgba(238,241,246,0.35)" },
};
