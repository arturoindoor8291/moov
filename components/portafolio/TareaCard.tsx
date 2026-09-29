"use client";

import { useState } from "react";
import ProyectoBadge from "./ProyectoBadge";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";
import { formatFechaLimite, isFechaLimiteUrgente } from "@/lib/portfolio/format";
import { importanciaColor, ownerInitial, theme, urgenciaColor } from "./tareasTheme";

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
  onEdit: (tarea: Tarea) => void;
}

export default function TareaCard({ tarea, tareasById, onColumnChange, onDragStart, onEdit }: TareaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isRiesgo = tarea.tipo_tarea === "hallazgo_riesgo";
  const urgenteFecha = isFechaLimiteUrgente(tarea.fecha_limite);
  const historialDesc = [...tarea.historial].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const fechaColor = tarea.fecha_limite ? urgenciaColor(tarea.nivel_urgencia) : theme.textFaint;

  return (
    <div
      id={`tarea-${tarea.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, tarea.id)}
      style={{ ...s.card, ...(isRiesgo ? s.cardRiesgo : {}), ...(urgenteFecha ? s.cardUrgente : {}) }}
    >
      <button onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} style={s.cardBtn}>
        <div style={s.headTop}>
          <span title="Importancia" style={{ ...s.dot, background: importanciaColor(tarea.nivel_importancia) }} />
          <span title="Urgencia" style={{ ...s.dot, background: urgenciaColor(tarea.nivel_urgencia) }} />
          <ProyectoBadge proyecto={tarea.proyecto} />
          {tarea.confidencial && <span style={s.confidencialPill}>🔒</span>}
          <div style={{ flexGrow: 1 }} />
          {isRiesgo && (
            <span title="Hallazgo de riesgo — verificar, no es una tarea por hacer" style={s.riesgoIcon}>
              ⚠
            </span>
          )}
          <span aria-hidden="true" style={s.chevron}>
            {expanded ? "▴" : "▾"}
          </span>
        </div>

        <div style={s.title}>{tarea.tarea}</div>
        {tarea.startup && <p style={s.startup}>{tarea.startup}</p>}

        {tarea.depende_de.length > 0 && (
          <div style={s.blockedRow}>
            {tarea.depende_de.map((depId) => {
              const dep = tareasById.get(depId);
              return (
                <span key={depId} style={s.blockedLink}>
                  🔗 bloqueada por {depId}
                  {dep ? `: ${dep.tarea}` : ""}
                </span>
              );
            })}
          </div>
        )}

        <div style={s.footerRow}>
          <span style={s.ownerAvatar} title={tarea.responsable || "Sin responsable"}>
            {ownerInitial(tarea.responsable)}
          </span>
          <span style={{ ...s.fecha, color: fechaColor }}>
            {tarea.fecha_limite ? formatFechaLimite(tarea.fecha_limite) : "Sin fecha límite"}
          </span>
        </div>
      </button>

      <div style={s.actionsRow}>
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
        <button onClick={() => onEdit(tarea)} style={s.editBtn}>
          Editar ✎
        </button>
      </div>

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
    background: theme.surface2,
    border: `1px solid ${theme.border}`,
    borderRadius: "10px",
    overflow: "hidden",
    cursor: "grab",
  },
  cardRiesgo: { borderColor: "rgba(224,178,60,0.4)", boxShadow: `inset 3px 0 0 0 ${theme.warning}` },
  cardUrgente: { borderColor: "rgba(229,96,90,0.35)" },
  cardBtn: {
    all: "unset",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    cursor: "pointer",
    padding: "12px",
  },
  headTop: { display: "flex", alignItems: "center", gap: "6px" },
  dot: { display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 },
  riesgoIcon: { color: theme.warning, fontSize: "13px", lineHeight: "18px" },
  chevron: { fontSize: "10px", color: theme.textFaint },
  confidencialPill: { fontSize: "11px" },
  title: { fontSize: "13px", fontWeight: 500, lineHeight: 1.4, color: theme.text, textAlign: "left" },
  startup: { fontSize: "11px", color: theme.textMuted, margin: 0, textAlign: "left" },
  blockedRow: { display: "flex", flexDirection: "column", gap: "4px" },
  blockedLink: { fontSize: "11px", color: theme.warning, textAlign: "left" },
  footerRow: { display: "flex", alignItems: "center", gap: "8px" },
  ownerAvatar: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    boxSizing: "border-box",
    border: `1.5px solid ${theme.accent}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: 600,
    color: theme.accent,
    flexShrink: 0,
  },
  fecha: { fontSize: "11px", fontWeight: 500 },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    borderTop: `1px solid ${theme.border}`,
    padding: "8px 12px",
  },
  select: {
    background: theme.surface3,
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    padding: "4px 6px",
    fontSize: "11px",
    color: theme.text,
    outline: "none",
  },
  editBtn: {
    background: "transparent",
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    padding: "3px 9px",
    fontSize: "11px",
    color: theme.textMuted,
    cursor: "pointer",
  },
  detail: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "10px 12px 12px",
    borderTop: `1px solid ${theme.border}`,
  },
  detailLabel: {
    fontSize: "10px",
    fontWeight: 600,
    color: theme.textFaint,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    margin: "8px 0 2px",
  },
  detailText: { fontSize: "12px", color: theme.textMuted, lineHeight: 1.5, margin: 0 },
  checklist: { margin: "2px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" },
  checklistItem: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: theme.textMuted },
  checkbox: { width: "12px", height: "12px" },
  checklistDone: { textDecoration: "line-through", color: theme.textFaint },
  linkList: { margin: "2px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" },
  link: { fontSize: "12px", color: theme.accent, textDecoration: "none" },
  tagRow: { display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "8px" },
  tag: {
    fontSize: "10px",
    color: theme.textMuted,
    background: theme.surface3,
    borderRadius: "10px",
    padding: "2px 8px",
  },
  historial: { margin: "2px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" },
  historialItem: { fontSize: "11px", color: theme.textMuted, lineHeight: 1.5 },
  historialFecha: { color: theme.textFaint, fontWeight: 600 },
};
