"use client";

import { useMemo, useState } from "react";
import { COLUMNA_LABEL, TIPO_TAREA_LABEL } from "./TareaCard";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";
import { formatFechaLimite } from "@/lib/portfolio/format";
import {
  canonicalProyecto,
  importanciaColor,
  ownerInitial,
  proyectoColor,
  theme,
  urgenciaColor,
} from "./tareasTheme";

interface TareaTableViewProps {
  tareas: Tarea[];
  onColumnChange: (id: string, columna: Tarea["columna_kanban"]) => void;
  onEdit: (tarea: Tarea) => void;
  onAddRoot: (proyecto: string) => void;
  onAddSub: (parent: Tarea) => void;
}

const COLS = "minmax(240px, 1fr) 160px 64px 64px 150px 130px 110px 90px";

/**
 * Vista tipo Notion: una tabla por proyecto, cada fila una actividad, con
 * sub-filas anidadas (parent_id) para el plan OKR → actividades →
 * sub-actividades que pidió Arturo. Misma base de datos que el kanban —
 * solo cambia cómo se lee.
 */
export default function TareaTableView({ tareas, onColumnChange, onEdit, onAddRoot, onAddSub }: TareaTableViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const grupos = useMemo(() => {
    const map = new Map<string, Tarea[]>();
    for (const t of tareas) {
      const key = canonicalProyecto(t.proyecto);
      const bucket = map.get(key) ?? [];
      bucket.push(t);
      map.set(key, bucket);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tareas]);

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={s.wrap}>
      {grupos.map(([proyecto, items]) => (
        <ProyectoGroup
          key={proyecto}
          proyecto={proyecto}
          items={items}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onColumnChange={onColumnChange}
          onEdit={onEdit}
          onAddRoot={onAddRoot}
          onAddSub={onAddSub}
        />
      ))}
    </div>
  );
}

function ProyectoGroup({
  proyecto,
  items,
  collapsed,
  onToggleCollapsed,
  onColumnChange,
  onEdit,
  onAddRoot,
  onAddSub,
}: {
  proyecto: string;
  items: Tarea[];
  collapsed: Set<string>;
  onToggleCollapsed: (id: string) => void;
  onColumnChange: (id: string, columna: Tarea["columna_kanban"]) => void;
  onEdit: (tarea: Tarea) => void;
  onAddRoot: (proyecto: string) => void;
  onAddSub: (parent: Tarea) => void;
}) {
  const childrenOf = useMemo(() => {
    const byId = new Set(items.map((t) => t.id));
    const map = new Map<string | null, Tarea[]>();
    for (const t of items) {
      const parentId = t.parent_id && t.parent_id !== t.id && byId.has(t.parent_id) ? t.parent_id : null;
      const bucket = map.get(parentId) ?? [];
      bucket.push(t);
      map.set(parentId, bucket);
    }
    return map;
  }, [items]);

  const rows: { tarea: Tarea; depth: number }[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const t of childrenOf.get(parentId) ?? []) {
      rows.push({ tarea: t, depth });
      if (!collapsed.has(t.id)) walk(t.id, depth + 1);
    }
  }
  walk(null, 0);

  return (
    <div style={s.group}>
      <div style={s.groupHeader}>
        <span style={{ ...s.dot, background: proyectoColor(proyecto) }} />
        <span style={s.groupTitle}>{proyecto}</span>
        <span style={s.groupCount}>{items.length}</span>
        <div style={{ flexGrow: 1 }} />
        <button onClick={() => onAddRoot(proyecto)} style={s.addRootBtn}>
          + Actividad principal
        </button>
      </div>

      <div style={s.headerRow}>
        <span>Actividad</span>
        <span>Tipo</span>
        <span style={s.centerHead}>Imp.</span>
        <span style={s.centerHead}>Urg.</span>
        <span>Estado</span>
        <span>Responsable</span>
        <span>Fecha límite</span>
        <span />
      </div>

      {rows.length === 0 ? (
        <p style={s.empty}>Sin actividades.</p>
      ) : (
        rows.map(({ tarea, depth }) => {
          const hasChildren = (childrenOf.get(tarea.id) ?? []).length > 0;
          return (
            <div key={tarea.id} style={s.row}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                {Array.from({ length: depth }).map((_, i) => (
                  <span key={i} style={s.guide} />
                ))}
                <button
                  onClick={() => hasChildren && onToggleCollapsed(tarea.id)}
                  style={{ ...s.chevronBtn, visibility: hasChildren ? "visible" : "hidden" }}
                  aria-label={collapsed.has(tarea.id) ? "Expandir" : "Colapsar"}
                >
                  {collapsed.has(tarea.id) ? "▸" : "▾"}
                </button>
                <button onClick={() => onEdit(tarea)} style={s.titleBtn} title={tarea.tarea}>
                  {tarea.tarea}
                </button>
              </div>

              <span style={s.cellMuted}>{TIPO_TAREA_LABEL[tarea.tipo_tarea]}</span>

              <span style={s.centerCell}>
                <span title={tarea.nivel_importancia} style={{ ...s.smallDot, background: importanciaColor(tarea.nivel_importancia) }} />
              </span>
              <span style={s.centerCell}>
                <span title={tarea.nivel_urgencia} style={{ ...s.smallDot, background: urgenciaColor(tarea.nivel_urgencia) }} />
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

              <span style={s.cellMuted}>
                {tarea.responsable ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={s.ownerAvatar}>{ownerInitial(tarea.responsable)}</span>
                    {tarea.responsable}
                  </span>
                ) : (
                  "—"
                )}
              </span>

              <span style={s.cellMuted}>{tarea.fecha_limite ? formatFechaLimite(tarea.fecha_limite) : "—"}</span>

              <button onClick={() => onAddSub(tarea)} style={s.addSubBtn} title="Agregar sub-actividad">
                + sub
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: "20px" },
  group: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    overflow: "hidden",
  },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 14px",
    borderBottom: `1px solid ${theme.border}`,
  },
  dot: { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  groupTitle: { fontSize: "14px", fontWeight: 600, color: theme.text, fontFamily: "var(--tareas-font-display)" },
  groupCount: { fontSize: "12px", color: theme.textFaint },
  addRootBtn: {
    background: "transparent",
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    color: theme.textMuted,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: COLS,
    gap: "8px",
    padding: "8px 14px",
    background: theme.surface2,
    fontSize: "11px",
    fontWeight: 600,
    color: theme.textFaint,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  centerHead: { textAlign: "center" },
  row: {
    display: "grid",
    gridTemplateColumns: COLS,
    gap: "8px",
    alignItems: "center",
    padding: "8px 14px",
    borderTop: `1px solid ${theme.border}`,
  },
  guide: { display: "inline-block", width: "16px", height: "100%", borderLeft: `1px solid ${theme.border}`, flexShrink: 0 },
  chevronBtn: {
    all: "unset",
    cursor: "pointer",
    fontSize: "10px",
    color: theme.textFaint,
    width: "14px",
    flexShrink: 0,
    textAlign: "center",
  },
  titleBtn: {
    all: "unset",
    cursor: "pointer",
    fontSize: "13px",
    color: theme.text,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  cellMuted: { fontSize: "12px", color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  centerCell: { display: "flex", justifyContent: "center" },
  smallDot: { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%" },
  select: {
    background: theme.surface3,
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    padding: "4px 6px",
    fontSize: "11px",
    color: theme.text,
    outline: "none",
  },
  ownerAvatar: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    boxSizing: "border-box",
    border: `1.5px solid ${theme.accent}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "8px",
    fontWeight: 600,
    color: theme.accent,
    flexShrink: 0,
  },
  addSubBtn: {
    background: "transparent",
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    padding: "3px 8px",
    fontSize: "11px",
    color: theme.textFaint,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  empty: { fontSize: "12px", color: theme.textFaint, textAlign: "center", padding: "16px 0" },
};
