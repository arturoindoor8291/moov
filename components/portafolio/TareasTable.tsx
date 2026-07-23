import ImportanciaBadge from "./ImportanciaBadge";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";
import { formatFechaLimite, isFechaLimiteUrgente } from "@/lib/portfolio/format";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  completado: "Completado",
  hallazgo_de_riesgo: "Hallazgo de riesgo",
  completado_con_preguntas_abiertas: "Completado (preguntas abiertas)",
};

function estadoLabel(estado: string): string {
  return ESTADO_LABEL[estado] ?? estado.replace(/_/g, " ");
}

export default function TareasTable({ tareas }: { tareas: Tarea[] }) {
  if (tareas.length === 0) {
    return <p style={s.empty}>Ninguna tarea coincide con el filtro.</p>;
  }

  return (
    <div style={s.tableWrap}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Startup</th>
            <th style={s.th}>Tarea</th>
            <th style={s.th}>Descripción</th>
            <th style={s.th}>Importancia</th>
            <th style={s.th}>Responsable</th>
            <th style={s.th}>Fecha límite</th>
            <th style={s.th}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {tareas.map((t) => {
            const isRiesgo = t.estado === "hallazgo_de_riesgo";
            const urgente = isFechaLimiteUrgente(t.fecha_limite);
            return (
              <tr key={t.id} style={{ ...s.tr, ...(isRiesgo ? s.trRiesgo : {}) }}>
                <td style={s.td}>{t.startup}</td>
                <td style={{ ...s.td, ...s.tdTarea }}>
                  {isRiesgo && <span style={s.riesgoIcon}>⚠</span>}
                  {t.tarea}
                </td>
                <td style={{ ...s.td, ...s.tdDescripcion }}>{t.descripcion}</td>
                <td style={s.td}>
                  <ImportanciaBadge nivel={t.nivel_importancia} />
                </td>
                <td style={s.td}>{t.responsable}</td>
                <td style={{ ...s.td, ...(urgente ? s.tdUrgente : {}) }}>
                  {formatFechaLimite(t.fecha_limite)}
                </td>
                <td style={{ ...s.td, ...(isRiesgo ? s.estadoRiesgo : {}) }}>{estadoLabel(t.estado)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  tableWrap: {
    background: "#07080d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    overflow: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "11px",
    fontWeight: 600,
    color: "rgba(238,241,246,0.45)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.06)" },
  trRiesgo: {
    background: "rgba(255,195,0,0.06)",
    boxShadow: "inset 3px 0 0 0 #ffc300",
  },
  td: { padding: "12px 16px", color: "#eef1f6", verticalAlign: "top" },
  tdTarea: { fontWeight: 600, minWidth: "220px" },
  tdDescripcion: { color: "rgba(238,241,246,0.65)", minWidth: "280px", lineHeight: 1.5 },
  tdUrgente: { color: "#ff5a5a", fontWeight: 700, whiteSpace: "nowrap" },
  estadoRiesgo: { color: "#ffc300", fontWeight: 600 },
  riesgoIcon: { marginRight: "6px" },
  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
