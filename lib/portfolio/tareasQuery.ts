import type { Tarea } from "./portfolioSchemas";

export interface TareasFilters {
  proyecto?: string;
  estado?: Tarea["columna_kanban"];
  responsable?: string;
  actualizadas_desde?: string;
  limite: number;
}

export interface TareaResumen {
  id: string;
  proyecto: string;
  startup: string;
  tarea: string;
  columna_kanban: Tarea["columna_kanban"];
  responsable: string;
  fecha_limite: string | null;
  nivel_importancia: Tarea["nivel_importancia"];
  nivel_urgencia: Tarea["nivel_urgencia"];
  proxima_accion: string;
  fecha_actualizacion: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const IMPORTANCIA_ORDEN: Record<Tarea["nivel_importancia"], number> = { alta: 0, media: 1, baja: 2 };

/** Case- and accent-insensitive "contains" so "ualabee" matches "Ualabee" and "Decision" matches "Decisión". */
function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function matches(haystack: string, needle: string): boolean {
  return normalize(haystack).includes(normalize(needle));
}

/**
 * fecha_limite is free text in the schema (some native tareas carry things
 * like "Próximas semanas (sin fecha exacta)"), so only real AAAA-MM-DD values
 * are sortable; everything else sorts after them, together with null.
 */
function fechaLimiteOrden(t: Tarea): string {
  return t.fecha_limite && ISO_DATE.test(t.fecha_limite) ? t.fecha_limite : "9999-99-99";
}

/**
 * Read-only projection of the kanban for the MCP list tool. Tareas flagged
 * `confidencial` are dropped entirely (not redacted) and only the fields in
 * TareaResumen ever leave this function — descripcion, historial, enlaces,
 * fuente, etc. are never exposed.
 */
export function listarTareas(tareas: Tarea[], filters: TareasFilters): { total: number; tareas: TareaResumen[] } {
  const visibles = tareas
    .filter((t) => !t.confidencial)
    .filter((t) => !filters.proyecto || matches(t.proyecto, filters.proyecto))
    .filter((t) => !filters.estado || t.columna_kanban === filters.estado)
    .filter((t) => !filters.responsable || matches(t.responsable, filters.responsable))
    .filter((t) => !filters.actualizadas_desde || t.fecha_actualizacion >= filters.actualizadas_desde)
    .sort((a, b) => {
      const byFecha = fechaLimiteOrden(a).localeCompare(fechaLimiteOrden(b));
      if (byFecha !== 0) return byFecha;
      const byImportancia = IMPORTANCIA_ORDEN[a.nivel_importancia] - IMPORTANCIA_ORDEN[b.nivel_importancia];
      return byImportancia !== 0 ? byImportancia : a.id.localeCompare(b.id);
    });

  return {
    total: visibles.length,
    tareas: visibles.slice(0, filters.limite).map((t) => ({
      id: t.id,
      proyecto: t.proyecto,
      startup: t.startup,
      tarea: t.tarea,
      columna_kanban: t.columna_kanban,
      responsable: t.responsable,
      fecha_limite: t.fecha_limite,
      nivel_importancia: t.nivel_importancia,
      nivel_urgencia: t.nivel_urgencia,
      proxima_accion: t.proxima_accion,
      fecha_actualizacion: t.fecha_actualizacion,
    })),
  };
}
