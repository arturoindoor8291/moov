import { NextRequest, NextResponse } from "next/server";
import { resolveTarea, upsertExternalTarea } from "@/lib/portfolio/tareasStore";
import { TareaSchema, type Tarea } from "@/lib/portfolio/portfolioSchemas";

const PatchSchema = TareaSchema.omit({ id: true }).partial();

function summarizeChanges(patch: Partial<Tarea>): string {
  const keys = Object.keys(patch) as (keyof Tarea)[];
  if (keys.length === 1 && keys[0] === "columna_kanban") {
    return `Estado cambiado a "${patch.columna_kanban}" desde el panel.`;
  }
  return `Editado desde el panel: ${keys.join(", ")}.`;
}

/**
 * Accepts a partial update to any editable field of a tarea — not just
 * columna_kanban. Native tareas (from tareas-data.json) get "forked" into
 * Redis on first full edit (see resolveTarea/upsertExternalTarea in
 * tareasStore.ts); externally-ingested or UI-created tareas already live
 * there and just get overwritten in place.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ message: "Nada que actualizar" }, { status: 400 });
  }

  const current = await resolveTarea(id);
  if (!current) {
    return NextResponse.json({ message: "Tarea no encontrada" }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const updated: Tarea = {
    ...current,
    ...parsed.data,
    id,
    fecha_actualizacion: today,
    historial: [...current.historial, { fecha: today, nota: summarizeChanges(parsed.data) }],
  };

  try {
    await upsertExternalTarea(updated);
  } catch (err) {
    console.error("[admin/tareas/:id] failed to persist update:", err);
    return NextResponse.json({ message: "No se pudo guardar el cambio" }, { status: 503 });
  }

  return NextResponse.json(updated);
}
