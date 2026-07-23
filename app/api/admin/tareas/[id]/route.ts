import { NextRequest, NextResponse } from "next/server";
import { getAllTareas } from "@/lib/portfolio/tareasData";
import { setColumnOverride, getExternalTareaById, upsertExternalTarea } from "@/lib/portfolio/tareasStore";
import { TareaSchema } from "@/lib/portfolio/portfolioSchemas";

const ColumnaKanbanSchema = TareaSchema.shape.columna_kanban;

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

  const parsed = ColumnaKanbanSchema.safeParse((body as { columna_kanban?: unknown })?.columna_kanban);
  if (!parsed.success) {
    return NextResponse.json({ message: "columna_kanban inválida" }, { status: 400 });
  }

  // MOOV-native tareas (from tareas-data.json) only persist the column as
  // an override; externally-ingested tareas have no base JSON record, so
  // the whole stored object gets rewritten instead.
  const isNative = getAllTareas().some((t) => t.id === id);

  try {
    if (isNative) {
      await setColumnOverride(id, parsed.data);
    } else {
      const external = await getExternalTareaById(id);
      if (!external) {
        return NextResponse.json({ message: "Tarea no encontrada" }, { status: 404 });
      }
      await upsertExternalTarea({
        ...external,
        columna_kanban: parsed.data,
        fecha_actualizacion: new Date().toISOString().slice(0, 10),
      });
    }
  } catch (err) {
    console.error("[admin/tareas/:id] failed to persist column change:", err);
    return NextResponse.json({ message: "No se pudo guardar el cambio" }, { status: 503 });
  }

  return NextResponse.json({ id, columna_kanban: parsed.data });
}
