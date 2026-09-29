import type { Tarea } from "./portfolioSchemas";

export interface TareaTreeRow {
  tarea: Tarea;
  depth: number;
  hasChildren: boolean;
}

/**
 * Aplana el árbol parent_id → hijos en una lista ordenada para renderizar
 * como tabla (cada fila sabe su profundidad para indentarse). Actividades
 * cuyo parent_id apunta a algo que ya no existe (o a sí mismas) caen como
 * fila de primer nivel en vez de desaparecer — más seguro que perder datos
 * silenciosamente ante una referencia rota.
 */
export function flattenTareaTree(tareas: Tarea[]): TareaTreeRow[] {
  const byId = new Map(tareas.map((t) => [t.id, t]));
  const childrenOf = new Map<string | null, Tarea[]>();

  for (const t of tareas) {
    const parentId = t.parent_id && t.parent_id !== t.id && byId.has(t.parent_id) ? t.parent_id : null;
    const bucket = childrenOf.get(parentId) ?? [];
    bucket.push(t);
    childrenOf.set(parentId, bucket);
  }

  const rows: TareaTreeRow[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = childrenOf.get(parentId) ?? [];
    for (const t of children) {
      rows.push({ tarea: t, depth, hasChildren: (childrenOf.get(t.id) ?? []).length > 0 });
      walk(t.id, depth + 1);
    }
  }
  walk(null, 0);
  return rows;
}

/** Ids de una tarea y todos sus descendientes — para no poder elegirla (ni a
 * sus hijos) como su propia actividad principal y crear un ciclo. */
export function descendantIds(tareas: Tarea[], rootId: string): Set<string> {
  const childrenOf = new Map<string, Tarea[]>();
  for (const t of tareas) {
    if (!t.parent_id) continue;
    const bucket = childrenOf.get(t.parent_id) ?? [];
    bucket.push(t);
    childrenOf.set(t.parent_id, bucket);
  }
  const out = new Set<string>();
  function walk(id: string) {
    for (const child of childrenOf.get(id) ?? []) {
      if (out.has(child.id)) continue;
      out.add(child.id);
      walk(child.id);
    }
  }
  walk(rootId);
  return out;
}
