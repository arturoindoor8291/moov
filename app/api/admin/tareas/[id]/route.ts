import { NextRequest, NextResponse } from "next/server";
import { getAllTareas } from "@/lib/portfolio/tareasData";
import { setColumnOverride } from "@/lib/portfolio/tareasStore";
import { TareaSchema } from "@/lib/portfolio/portfolioSchemas";

const ColumnaKanbanSchema = TareaSchema.shape.columna_kanban;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const exists = getAllTareas().some((t) => t.id === id);
  if (!exists) {
    return NextResponse.json({ message: "Tarea no encontrada" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const parsed = ColumnaKanbanSchema.safeParse((body as { columna_kanban?: unknown })?.columna_kanban);
  if (!parsed.success) {
    return NextResponse.json({ message: "columna_kanban inválida" }, { status: 400 });
  }

  try {
    await setColumnOverride(id, parsed.data);
  } catch (err) {
    console.error("[admin/tareas/:id] failed to persist column change:", err);
    return NextResponse.json({ message: "No se pudo guardar el cambio" }, { status: 503 });
  }

  return NextResponse.json({ id, columna_kanban: parsed.data });
}
