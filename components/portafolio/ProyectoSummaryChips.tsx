"use client";

import type { Tarea } from "@/lib/portfolio/portfolioSchemas";
import { canonicalProyecto, isVencida, proyectoColor, theme } from "./tareasTheme";

interface ProyectoStat {
  proyecto: string;
  abiertas: number;
  bloqueadas: number;
  vencidas: number;
}

interface ProyectoSummaryChipsProps {
  tareas: Tarea[];
  selectedProyecto: string | null;
  onSelect: (proyecto: string) => void;
}

/**
 * Una tarjeta por proyecto real (agrupando las variantes de texto libre con
 * canonicalProyecto — "AutoCare"/"Mitaller" caen en "Mi Taller", etc.), al
 * estilo R2D2. Actúa como filtro de aislar: clic selecciona ese proyecto y
 * el tablero de abajo solo muestra sus tareas; clic de nuevo lo quita y
 * vuelve a mostrar todos.
 */
export default function ProyectoSummaryChips({ tareas, selectedProyecto, onSelect }: ProyectoSummaryChipsProps) {
  const stats = new Map<string, ProyectoStat>();
  for (const t of tareas) {
    const proyecto = canonicalProyecto(t.proyecto);
    const cur = stats.get(proyecto) ?? { proyecto, abiertas: 0, bloqueadas: 0, vencidas: 0 };
    if (t.columna_kanban !== "completada") {
      cur.abiertas += 1;
      if (t.columna_kanban === "bloqueada") cur.bloqueadas += 1;
      if (isVencida(t.fecha_limite)) cur.vencidas += 1;
    }
    stats.set(proyecto, cur);
  }
  const ordered = Array.from(stats.values()).sort((a, b) => a.proyecto.localeCompare(b.proyecto));

  if (ordered.length === 0) return null;

  return (
    <div style={s.row}>
      {ordered.map((p) => {
        const isActive = selectedProyecto === p.proyecto;
        const isDimmed = selectedProyecto !== null && !isActive;
        const color = proyectoColor(p.proyecto);
        return (
          <button
            key={p.proyecto}
            onClick={() => onSelect(p.proyecto)}
            aria-pressed={isActive}
            style={{
              ...s.chip,
              border: `1.5px solid ${isActive ? color : theme.border}`,
              opacity: isDimmed ? 0.45 : 1,
            }}
          >
            <div style={s.chipHeader}>
              <span style={{ ...s.dot, background: color }} />
              <span style={s.chipName}>{p.proyecto}</span>
            </div>
            <div style={s.chipStats}>
              <span style={s.chipCount}>{p.abiertas}</span>
              <span style={s.chipLabel}>abiertas</span>
              {p.bloqueadas > 0 && <span style={{ ...s.chipFlag, color: theme.warning }}>{p.bloqueadas} bloq.</span>}
              {p.vencidas > 0 && <span style={{ ...s.chipFlag, color: theme.danger }}>{p.vencidas} vencidas</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
    marginBottom: "18px",
  },
  chip: {
    all: "unset",
    boxSizing: "border-box",
    cursor: "pointer",
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: "10px",
    background: theme.surface,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    transition: "opacity 0.15s ease, border-color 0.15s ease",
  },
  chipHeader: { display: "flex", alignItems: "center", gap: "8px" },
  dot: { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  chipName: { fontSize: "13px", fontWeight: 600, color: theme.text },
  chipStats: { display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" },
  chipCount: { fontSize: "20px", fontWeight: 600, color: theme.text, fontFamily: "var(--tareas-font-display)" },
  chipLabel: { fontSize: "11px", color: theme.textMuted },
  chipFlag: { fontSize: "11px", fontWeight: 600 },
};
