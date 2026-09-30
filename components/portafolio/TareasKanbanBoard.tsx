"use client";

import { useState } from "react";
import TareaCard, { COLUMNA_LABEL } from "./TareaCard";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";
import { COLUMN_DOT, theme } from "./tareasTheme";

const COLUMNS = Object.keys(COLUMNA_LABEL) as Tarea["columna_kanban"][];

const URGENCIA_RANK: Record<Tarea["nivel_urgencia"], number> = {
  inmediata: 0,
  esta_semana: 1,
  este_mes: 2,
  sin_urgencia_definida: 3,
};

const PAGE_SIZE = 10;

// Urgencia primero, luego fecha_limite (más próxima primero; sin fecha
// parseable al final) — el orden que pidió Arturo para priorizar el tablero.
function sortTareas(tareas: Tarea[]): Tarea[] {
  return [...tareas].sort((a, b) => {
    const urgenciaDiff = URGENCIA_RANK[a.nivel_urgencia] - URGENCIA_RANK[b.nivel_urgencia];
    if (urgenciaDiff !== 0) return urgenciaDiff;
    const aTime = a.fecha_limite ? new Date(a.fecha_limite).getTime() : NaN;
    const bTime = b.fecha_limite ? new Date(b.fecha_limite).getTime() : NaN;
    const aValid = !Number.isNaN(aTime);
    const bValid = !Number.isNaN(bTime);
    if (aValid && bValid) return aTime - bTime;
    if (aValid) return -1;
    if (bValid) return 1;
    return 0;
  });
}

interface TareasKanbanBoardProps {
  tareas: Tarea[];
  tareasById: Map<string, Tarea>;
  onColumnChange: (id: string, columna: Tarea["columna_kanban"]) => void;
  onEdit: (tarea: Tarea) => void;
}

export default function TareasKanbanBoard({ tareas, tareasById, onColumnChange, onEdit }: TareasKanbanBoardProps) {
  const [expandedColumns, setExpandedColumns] = useState<Set<Tarea["columna_kanban"]>>(new Set());
  const [dragOverColumn, setDragOverColumn] = useState<Tarea["columna_kanban"] | null>(null);

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDrop(e: React.DragEvent, columna: Tarea["columna_kanban"]) {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) onColumnChange(id, columna);
  }

  return (
    <div style={s.board}>
      {COLUMNS.map((key) => {
        const columnTareas = sortTareas(tareas.filter((t) => t.columna_kanban === key));
        const isExpanded = expandedColumns.has(key);
        const visible = isExpanded ? columnTareas : columnTareas.slice(0, PAGE_SIZE);
        const remaining = columnTareas.length - visible.length;

        return (
          <div
            key={key}
            style={{ ...s.column, ...(dragOverColumn === key ? s.columnDragOver : {}) }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(key);
            }}
            onDragLeave={() => setDragOverColumn((c) => (c === key ? null : c))}
            onDrop={(e) => handleDrop(e, key)}
          >
            <div style={s.columnHeader}>
              <span style={{ ...s.dot, background: COLUMN_DOT[key] }} />
              <span style={s.columnTitle}>{COLUMNA_LABEL[key]}</span>
              <span style={s.columnCount}>{columnTareas.length}</span>
            </div>
            <div style={s.columnBody}>
              {visible.length === 0 ? (
                <p style={s.empty}>Sin tareas.</p>
              ) : (
                visible.map((t) => (
                  <TareaCard
                    key={t.id}
                    tarea={t}
                    tareasById={tareasById}
                    onColumnChange={onColumnChange}
                    onDragStart={handleDragStart}
                    onEdit={onEdit}
                  />
                ))
              )}
            </div>
            {remaining > 0 && (
              <button
                onClick={() => setExpandedColumns((prev) => new Set(prev).add(key))}
                style={s.showMoreBtn}
              >
                Mostrar {remaining} más
              </button>
            )}
            {isExpanded && columnTareas.length > PAGE_SIZE && (
              <button
                onClick={() =>
                  setExpandedColumns((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                  })
                }
                style={s.showMoreBtn}
              >
                Mostrar menos
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  board: { display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px", alignItems: "flex-start" },
  column: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    padding: "14px",
    minWidth: "300px",
    maxWidth: "320px",
    flex: "0 0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    transition: "border-color 0.15s, background 0.15s",
  },
  columnDragOver: { borderColor: "rgba(47,109,255,0.5)", background: "rgba(47,109,255,0.05)" },
  columnHeader: { display: "flex", alignItems: "center", gap: "8px" },
  dot: { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  columnTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: theme.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  },
  columnCount: {
    marginLeft: "auto",
    fontSize: "13px",
    fontWeight: 600,
    color: theme.textFaint,
    fontFamily: "var(--tareas-font-display)",
  },
  columnBody: { display: "flex", flexDirection: "column", gap: "8px" },
  empty: { fontSize: "12px", color: theme.textFaint, textAlign: "center", padding: "16px 0" },
  showMoreBtn: {
    background: "transparent",
    border: `1px dashed ${theme.border}`,
    borderRadius: "8px",
    padding: "8px",
    fontSize: "12px",
    color: theme.textMuted,
    cursor: "pointer",
  },
};
