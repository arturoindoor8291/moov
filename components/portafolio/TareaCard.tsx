"use client";

import { useState } from "react";
import ImportanciaBadge from "./ImportanciaBadge";
import UrgenciaBadge from "./UrgenciaBadge";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";
import { formatFechaLimite, isFechaLimiteUrgente } from "@/lib/portfolio/format";

export const COLUMNA_LABEL: Record<Tarea["columna_kanban"], string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  bloqueada: "Bloqueada",
  completada: "Completada",
};

export const TIPO_TAREA_LABEL: Record<Tarea["tipo_tarea"], string> = {
  compromiso_propio: "Compromiso propio",
  compromiso_contraparte: "Compromiso de contraparte",
  decision_comite: "Decisión de comité",
  hallazgo_riesgo: "Hallazgo de riesgo",
};

interface TareaCardProps {
  tarea: Tarea;
  tareasById: Map<string, Tarea>;
  onColumnChange: (id: string, columna: Tarea["columna_kanban"]) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

export default function TareaCard({ tarea, tareasById, onColumnChange, onDragStart }: TareaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isRiesgo = tarea.tipo_tarea === "hallazgo_riesgo";
  const urgenteFecha = isFechaLimiteUrgente(tarea.fecha_limite);
  const historialDesc = [...tarea.historial].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div
      id={`tarea-${tarea.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, tarea.id)}
      style={{ ...s.card, ...(isRiesgo ? s.cardRiesgo : {}), ...(urgenteFecha ? s.cardUrgente : {}) }}
    >
      <div style={s.headerRow}>
        {isRiesgo && (
          <span title="Hallazgo de riesgo — verificar, no es una tarea por hacer" style={s.riesgoIcon}>
            ⚠
          </span>
        )}
        <span style={s.title}>{tarea.tarea}</span>
      </div>
      <p style={s.startup}>{tarea.startup}</p>

      <div style={s.badgeRow}>
        <ImportanciaBadge nivel={tarea.nivel_importancia} />
        <UrgenciaBadge nivel={tarea.nivel_urgencia} />
        {tarea.confidencial && <span style={s.confidencialPill}>🔒 Sensible</span>}
      </div>

      {tarea.depende_de.length > 0 && (
        <div style={s.blockedRow}>
          {tarea.depende_de.map((depId) => {
            const dep = tareasById.get(depId);
            return (
              <a key={depId} href={`#tarea-${depId}`} style={s.blockedLink}>
                🔗 bloqueada por {depId}
                {dep ? `: ${dep.tarea}` : ""}
              </a>
            );
          })}
        </div>
      )}

      <div style={s.footerRow}>
        <span style={{ ...s.fechaLimite, ...(urgenteFecha ? s.fechaLimiteUrgente : {}) }}>
          {tarea.fecha_limite ? `Vence: ${formatFechaLimite(tarea.fecha_limite)}` : "Sin fecha límite"}
        </span>
        <select
          value={tarea.columna_kanban}
          onChange={(e) => onColumnChange(tarea.id, e.target.value as Tarea["columna_kanban"])}
          style={s.select}
        >
          {(Object.keys(COLUMNA_LABEL) as Tarea["columna_kanban"][]).map((col) => (
            <option key={col} value={col}>
              {COLUMNA_LABEL[col]}
            </option>
          ))}
        </select>
      </div>

      <button onClick={() => setExpanded((v) => !v)} style={s.expandBtn}>
        {expanded ? "Ocultar detalle ▲" : "Ver detalle ▼"}
      </button>

      {expanded && (
        <div style={s.detail}>
          <p style={s.detailLabel}>Tipo</p>
          <p style={s.detailText}>{TIPO_TAREA_LABEL[tarea.tipo_tarea]}</p>

          <p style={s.detailLabel}>Descripción</p>
          <p style={s.detailText}>{tarea.descripcion}</p>

          <p style={s.detailLabel}>Próxima acción</p>
          <p style={s.detailText}>{tarea.proxima_accion}</p>

          <p style={s.detailLabel}>Responsable</p>
          <p style={s.detailText}>{tarea.responsable}</p>

          <p style={s.detailLabel}>Estado</p>
          <p style={s.detailText}>{tarea.estado.replace(/_/g, " ")}</p>

          {tarea.checklist.length > 0 && (
            <>
              <p style={s.detailLabel}>Checklist</p>
              <ul style={s.checklist}>
                {tarea.checklist.map((c, i) => (
                  <li key={i} style={s.checklistItem}>
                    <input type="checkbox" checked={c.hecho} readOnly disabled style={s.checkbox} />
                    <span style={c.hecho ? s.checklistDone : undefined}>{c.item}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {tarea.enlaces.length > 0 && (
            <>
              <p style={s.detailLabel}>Enlaces</p>
              <ul style={s.linkList}>
                {tarea.enlaces.map((e, i) => (
                  <li key={i}>
                    <a href={e.url} target="_blank" rel="noreferrer" style={s.link}>
                      {e.titulo} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p style={s.detailLabel}>Fuente</p>
          <p style={s.detailText}>
            {tarea.fuente.referencia} — {tarea.fuente.fecha}
            {tarea.fuente.link && (
              <>
                {" "}
                <a href={tarea.fuente.link} target="_blank" rel="noreferrer" style={s.link}>
                  ver ↗
                </a>
              </>
            )}
          </p>

          {tarea.etiquetas.length > 0 && (
            <div style={s.tagRow}>
              {tarea.etiquetas.map((tag) => (
                <span key={tag} style={s.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {historialDesc.length > 0 && (
            <>
              <p style={s.detailLabel}>Historial</p>
              <ul style={s.historial}>
                {historialDesc.map((h, i) => (
                  <li key={i} style={s.historialItem}>
                    <span style={s.historialFecha}>{h.fecha}</span> — {h.nota}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: "#0c0e14",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    cursor: "grab",
  },
  cardRiesgo: { borderColor: "rgba(255,195,0,0.4)", boxShadow: "inset 3px 0 0 0 #ffc300" },
  cardUrgente: { borderColor: "rgba(255,90,90,0.35)" },
  headerRow: { display: "flex", alignItems: "flex-start", gap: "6px" },
  riesgoIcon: { color: "#ffc300", fontSize: "13px", lineHeight: "18px" },
  title: { fontSize: "13px", fontWeight: 700, color: "#eef1f6", lineHeight: 1.4 },
  startup: { fontSize: "11px", color: "rgba(238,241,246,0.45)", margin: 0 },
  badgeRow: { display: "flex", gap: "6px", flexWrap: "wrap" },
  confidencialPill: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#c98500",
    background: "rgba(201,133,0,0.12)",
    border: "1px solid rgba(201,133,0,0.3)",
    borderRadius: "20px",
    padding: "3px 10px",
  },
  blockedRow: { display: "flex", flexDirection: "column", gap: "4px" },
  blockedLink: { fontSize: "11px", color: "#ff9600", textDecoration: "none" },
  footerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" },
  fechaLimite: { fontSize: "11px", color: "rgba(238,241,246,0.45)" },
  fechaLimiteUrgente: { color: "#ff5a5a", fontWeight: 700 },
  select: {
    background: "#050506",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "4px 6px",
    fontSize: "11px",
    color: "#eef1f6",
    outline: "none",
  },
  expandBtn: {
    background: "transparent",
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: "8px",
    fontSize: "11px",
    color: "rgba(238,241,246,0.4)",
    cursor: "pointer",
    textAlign: "left",
  },
  detail: { display: "flex", flexDirection: "column", gap: "2px", paddingTop: "4px" },
  detailLabel: {
    fontSize: "10px",
    fontWeight: 700,
    color: "rgba(238,241,246,0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    margin: "8px 0 2px",
  },
  detailText: { fontSize: "12px", color: "rgba(238,241,246,0.8)", lineHeight: 1.5, margin: 0 },
  checklist: { margin: "2px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" },
  checklistItem: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(238,241,246,0.8)" },
  checkbox: { width: "12px", height: "12px" },
  checklistDone: { textDecoration: "line-through", color: "rgba(238,241,246,0.4)" },
  linkList: { margin: "2px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" },
  link: { fontSize: "12px", color: "#3987e5", textDecoration: "none" },
  tagRow: { display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "8px" },
  tag: {
    fontSize: "10px",
    color: "rgba(238,241,246,0.55)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "10px",
    padding: "2px 8px",
  },
  historial: { margin: "2px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" },
  historialItem: { fontSize: "11px", color: "rgba(238,241,246,0.65)", lineHeight: 1.5 },
  historialFecha: { color: "rgba(238,241,246,0.4)", fontWeight: 600 },
};
