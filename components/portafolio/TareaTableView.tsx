"use client";

import { useMemo, useRef, useState } from "react";
import { COLUMNA_LABEL, TIPO_TAREA_LABEL } from "./TareaCard";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";
import { formatFechaLimite } from "@/lib/portfolio/format";
import {
  COLUMN_DOT,
  canonicalProyecto,
  importanciaColor,
  isVencida,
  ownerInitial,
  proyectoColor,
  theme,
  urgenciaColor,
} from "./tareasTheme";

interface NuevaActividadInput {
  proyecto: string;
  parent_id: string | null;
  tarea: string;
}

interface TareaTableViewProps {
  tareas: Tarea[];
  onColumnChange: (id: string, columna: Tarea["columna_kanban"]) => void;
  onEdit: (tarea: Tarea) => void;
  // Crea la actividad y persiste — igual que Notion: la fila nueva aparece
  // en su lugar en la tabla con solo el nombre por escribir, nunca en un
  // diálogo aparte. Debe resolver con la tarea ya guardada (o rechazar).
  onCreateTarea: (input: NuevaActividadInput) => Promise<Tarea>;
}

const COLS = "22px minmax(240px, 1fr) 160px 64px 64px 150px 130px 110px 90px";

/**
 * Vista tipo Notion: una tabla por proyecto, cada fila una actividad, con
 * sub-filas anidadas (parent_id) para el plan OKR → actividades →
 * sub-actividades que pidió Arturo. Misma base de datos que el kanban —
 * solo cambia cómo se lee.
 *
 * Cada proyecto se puede colapsar (con contador de abiertas/total) y cada
 * fila trae su punto de estado más las dependencias (`depende_de`) como
 * chips: clic en el punto o en un chip entra en "modo enfoque", que resalta
 * toda la cadena (de qué depende y a qué bloquea) y difumina el resto — así
 * no hay que rastrear a mano quién bloquea a quién en una tabla larga.
 */
export default function TareaTableView({ tareas, onColumnChange, onEdit, onCreateTarea }: TareaTableViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [collapsedProyectos, setCollapsedProyectos] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);

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

  // Mapa global (no solo del proyecto en pantalla) para resolver el título
  // de una dependencia y para construir "a qué bloquea" a partir de
  // depende_de, que solo guarda el sentido inverso.
  const { byId, blocksOf } = useMemo(() => {
    const byId = new Map(tareas.map((t) => [t.id, t]));
    const blocksOf = new Map<string, string[]>();
    for (const t of tareas) {
      for (const depId of t.depende_de) {
        if (!byId.has(depId)) continue;
        const bucket = blocksOf.get(depId) ?? [];
        bucket.push(t.id);
        blocksOf.set(depId, bucket);
      }
    }
    return { byId, blocksOf };
  }, [tareas]);

  function focusChain(id: string): Set<string> {
    const seen = new Set<string>();
    function walkUp(cur: string) {
      if (seen.has(cur)) return;
      seen.add(cur);
      (byId.get(cur)?.depende_de ?? []).forEach(walkUp);
    }
    function walkDown(cur: string) {
      (blocksOf.get(cur) ?? []).forEach((n) => {
        if (seen.has(n)) return;
        seen.add(n);
        walkDown(n);
      });
    }
    walkUp(id);
    walkDown(id);
    return seen;
  }

  const focusSet = focusId ? focusChain(focusId) : null;

  function toggleFocus(id: string) {
    setFocusId((cur) => (cur === id ? null : id));
  }

  function jumpToFocus(id: string) {
    setFocusId(id);
    document.getElementById(`tarea-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expand(id: string) {
    setCollapsed((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleProyectoCollapsed(proyecto: string) {
    setCollapsedProyectos((prev) => {
      const next = new Set(prev);
      if (next.has(proyecto)) next.delete(proyecto);
      else next.add(proyecto);
      return next;
    });
  }

  return (
    <div style={s.wrap}>
      {focusId && (
        <div style={s.focusBar}>
          <span>
            Viendo la cadena de <strong style={{ fontFamily: "var(--tareas-font-display)" }}>{focusId}</strong>
            {byId.get(focusId) ? `: ${byId.get(focusId)!.tarea}` : ""}
          </span>
          <button onClick={() => setFocusId(null)} style={s.focusClearBtn}>
            Limpiar enfoque
          </button>
        </div>
      )}
      {grupos.map(([proyecto, items]) => (
        <ProyectoGroup
          key={proyecto}
          proyecto={proyecto}
          items={items}
          collapsed={collapsed}
          proyectoCollapsed={collapsedProyectos.has(proyecto)}
          onToggleProyectoCollapsed={() => toggleProyectoCollapsed(proyecto)}
          onToggleCollapsed={toggleCollapsed}
          onExpand={expand}
          onColumnChange={onColumnChange}
          onEdit={onEdit}
          onCreateTarea={onCreateTarea}
          byId={byId}
          blocksOf={blocksOf}
          focusSet={focusSet}
          onToggleFocus={toggleFocus}
          onJumpToFocus={jumpToFocus}
        />
      ))}
    </div>
  );
}

type Row = { kind: "tarea"; tarea: Tarea; depth: number } | { kind: "draft"; depth: number };

function ProyectoGroup({
  proyecto,
  items,
  collapsed,
  proyectoCollapsed,
  onToggleProyectoCollapsed,
  onToggleCollapsed,
  onExpand,
  onColumnChange,
  onEdit,
  onCreateTarea,
  byId,
  blocksOf,
  focusSet,
  onToggleFocus,
  onJumpToFocus,
}: {
  proyecto: string;
  items: Tarea[];
  collapsed: Set<string>;
  proyectoCollapsed: boolean;
  onToggleProyectoCollapsed: () => void;
  onToggleCollapsed: (id: string) => void;
  onExpand: (id: string) => void;
  onColumnChange: (id: string, columna: Tarea["columna_kanban"]) => void;
  onEdit: (tarea: Tarea) => void;
  onCreateTarea: (input: NuevaActividadInput) => Promise<Tarea>;
  byId: Map<string, Tarea>;
  blocksOf: Map<string, string[]>;
  focusSet: Set<string> | null;
  onToggleFocus: (id: string) => void;
  onJumpToFocus: (id: string) => void;
}) {
  // parentId === undefined = sin fila nueva en este proyecto ahora mismo.
  const [draftParentId, setDraftParentId] = useState<string | null | undefined>(undefined);
  const [draftValue, setDraftValue] = useState("");
  const [saving, setSaving] = useState(false);

  const childrenOf = useMemo(() => {
    const idsAqui = new Set(items.map((t) => t.id));
    const map = new Map<string | null, Tarea[]>();
    for (const t of items) {
      const parentId = t.parent_id && t.parent_id !== t.id && idsAqui.has(t.parent_id) ? t.parent_id : null;
      const bucket = map.get(parentId) ?? [];
      bucket.push(t);
      map.set(parentId, bucket);
    }
    return map;
  }, [items]);

  const rows: Row[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const t of childrenOf.get(parentId) ?? []) {
      rows.push({ kind: "tarea", tarea: t, depth });
      if (!collapsed.has(t.id)) {
        walk(t.id, depth + 1);
        if (draftParentId === t.id) rows.push({ kind: "draft", depth: depth + 1 });
      }
    }
  }
  walk(null, 0);
  if (draftParentId === null) rows.push({ kind: "draft", depth: 0 });

  const abiertas = items.filter((t) => t.columna_kanban !== "completada").length;

  function startAddRoot() {
    setDraftParentId(null);
    setDraftValue("");
  }

  function startAddSub(parent: Tarea) {
    onExpand(parent.id);
    setDraftParentId(parent.id);
    setDraftValue("");
  }

  function cancelDraft() {
    setDraftParentId(undefined);
    setDraftValue("");
  }

  async function commitDraft() {
    const nombre = draftValue.trim();
    if (!nombre || draftParentId === undefined) {
      cancelDraft();
      return;
    }
    setSaving(true);
    try {
      await onCreateTarea({ proyecto, parent_id: draftParentId, tarea: nombre });
      cancelDraft();
    } catch {
      // Deja la fila abierta con lo que el usuario escribió para reintentar.
      setSaving(false);
    }
  }

  return (
    <div style={s.group}>
      <div style={s.groupHeader}>
        <button
          onClick={onToggleProyectoCollapsed}
          style={s.groupHeaderBtn}
          aria-expanded={!proyectoCollapsed}
          aria-label={proyectoCollapsed ? "Expandir proyecto" : "Colapsar proyecto"}
        >
          <span aria-hidden="true" style={{ ...s.groupChevron, ...(proyectoCollapsed ? s.groupChevronCollapsed : {}) }}>
            ▾
          </span>
          <span style={{ ...s.dot, background: proyectoColor(proyecto) }} />
          <span style={s.groupTitle}>{proyecto}</span>
          <span style={s.groupCount}>
            {abiertas} abiertas · {items.length} total
          </span>
        </button>
        <div style={{ flexGrow: 1 }} />
        <button onClick={startAddRoot} style={s.addRootBtn}>
          + Actividad principal
        </button>
      </div>

      {!proyectoCollapsed && (
        <>
          <div style={s.headerRow}>
            <span />
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
            rows.map((row, i) => {
              if (row.kind === "draft") {
                return (
                  <DraftRow
                    key={`draft-${i}`}
                    depth={row.depth}
                    value={draftValue}
                    saving={saving}
                    onChange={setDraftValue}
                    onCommit={commitDraft}
                    onCancel={cancelDraft}
                  />
                );
              }
              const { tarea, depth } = row;
              const hasChildren = (childrenOf.get(tarea.id) ?? []).length > 0;
              const vencida = isVencida(tarea.fecha_limite);
              const bloqueaA = blocksOf.get(tarea.id) ?? [];
              const isFocused = focusSet?.has(tarea.id) ?? false;
              const isDimmed = focusSet != null && !isFocused;
              const rowStyle = {
                ...s.row,
                ...(isFocused ? s.rowFocused : {}),
                ...(isDimmed ? s.rowDimmed : {}),
              };

              return (
                <div key={tarea.id} id={`tarea-row-${tarea.id}`} style={rowStyle}>
                  <span style={s.centerCell}>
                    <button
                      onClick={() => onToggleFocus(tarea.id)}
                      title="Ver de qué depende y a qué bloquea"
                      aria-label="Enfocar cadena de dependencias"
                      style={{ ...s.statusDotBtn, background: COLUMN_DOT[tarea.columna_kanban] }}
                    />
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                      {Array.from({ length: depth }).map((_, gi) => (
                        <span key={gi} style={s.guide} />
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
                    {(tarea.depende_de.length > 0 || bloqueaA.length > 0) && (
                      <div style={s.depRow}>
                        {tarea.depende_de.map((depId) => (
                          <button key={`needs-${depId}`} onClick={() => onJumpToFocus(depId)} style={s.depChip} title={byId.get(depId)?.tarea}>
                            ↑ depende de {depId}
                          </button>
                        ))}
                        {bloqueaA.map((blockedId) => (
                          <button key={`blocks-${blockedId}`} onClick={() => onJumpToFocus(blockedId)} style={s.depChip} title={byId.get(blockedId)?.tarea}>
                            ↓ desbloquea {blockedId}
                          </button>
                        ))}
                      </div>
                    )}
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

                  <span style={{ ...s.cellMuted, ...(vencida ? s.cellVencida : {}) }}>
                    {tarea.fecha_limite ? (vencida ? `venció ${formatFechaLimite(tarea.fecha_limite)}` : formatFechaLimite(tarea.fecha_limite)) : "—"}
                  </span>

                  <button onClick={() => startAddSub(tarea)} style={s.addSubBtn} title="Agregar sub-actividad">
                    + sub
                  </button>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

function DraftRow({
  depth,
  value,
  saving,
  onChange,
  onCommit,
  onCancel,
}: {
  depth: number;
  value: string;
  saving: boolean;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const committing = useRef(false);

  return (
    <div style={s.row}>
      <span />
      <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
        {Array.from({ length: depth }).map((_, i) => (
          <span key={i} style={s.guide} />
        ))}
        <span style={{ width: "14px", flexShrink: 0 }} />
        <input
          autoFocus
          value={value}
          disabled={saving}
          placeholder="Nombre de la actividad…"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              committing.current = true;
              onCommit();
            } else if (e.key === "Escape") {
              committing.current = true;
              onCancel();
            }
          }}
          onBlur={() => {
            // Enter/Escape ya resolvieron la fila; evita commitear dos veces.
            if (committing.current) return;
            onCommit();
          }}
          style={s.draftInput}
        />
      </div>
      <span style={s.cellMuted}>—</span>
      <span style={s.centerCell} />
      <span style={s.centerCell} />
      <span style={s.cellMuted}>—</span>
      <span style={s.cellMuted}>—</span>
      <span style={s.cellMuted}>—</span>
      <span />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: "20px" },
  focusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    background: theme.surface2,
    border: `1px solid ${theme.accent}`,
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "12.5px",
    color: theme.textMuted,
    position: "sticky",
    top: "56px",
    zIndex: 10,
  },
  focusClearBtn: {
    background: "transparent",
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "12px",
    color: theme.text,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
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
    padding: "8px 14px",
    borderBottom: `1px solid ${theme.border}`,
  },
  groupHeaderBtn: {
    all: "unset",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    padding: "4px 0",
    minWidth: 0,
  },
  groupChevron: {
    color: theme.textFaint,
    fontSize: "11px",
    transition: "transform 0.15s",
    flexShrink: 0,
  },
  groupChevronCollapsed: { transform: "rotate(-90deg)" },
  dot: { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  groupTitle: { fontSize: "14px", fontWeight: 600, color: theme.text, fontFamily: "var(--tareas-font-display)" },
  groupCount: { fontSize: "11px", color: theme.textFaint, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" },
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
    transition: "opacity 0.15s, background 0.15s",
  },
  rowFocused: { background: theme.surface2 },
  rowDimmed: { opacity: 0.35 },
  guide: { display: "inline-block", width: "16px", height: "100%", borderLeft: `1px solid ${theme.border}`, flexShrink: 0 },
  statusDotBtn: {
    all: "unset",
    display: "inline-block",
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    cursor: "pointer",
    flexShrink: 0,
  },
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
  depRow: { display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "4px", paddingLeft: "18px" },
  depChip: {
    all: "unset",
    fontSize: "10.5px",
    padding: "2px 7px",
    borderRadius: "6px",
    background: theme.surface3,
    color: theme.textMuted,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  draftInput: {
    all: "unset",
    boxSizing: "border-box",
    fontSize: "13px",
    color: theme.text,
    minWidth: 0,
    flexGrow: 1,
    borderBottom: `1px solid ${theme.accent}`,
    padding: "1px 0",
  },
  cellMuted: { fontSize: "12px", color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cellVencida: { color: theme.danger, fontWeight: 600 },
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
