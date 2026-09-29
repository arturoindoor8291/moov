import { NextRequest, NextResponse } from "next/server";
import { verifyTareasToken } from "@/lib/tareasAuth";
import { resolveTarea, upsertExternalTarea } from "@/lib/portfolio/tareasStore";
import { canonicalProyecto } from "@/lib/portfolio/proyectos";
import { TareaSchema, type Tarea } from "@/lib/portfolio/portfolioSchemas";

const PatchSchema = TareaSchema.omit({ id: true }).partial();

function summarizeChanges(patch: Partial<Tarea>): string {
  const keys = Object.keys(patch) as (keyof Tarea)[];
  if (keys.length === 1 && keys[0] === "columna_kanban") {
    return `Estado cambiado a "${patch.columna_kanban}" desde /tareas.`;
  }
  return `Editado desde /tareas: ${keys.join(", ")}.`;
}

/**
 * Igual que PATCH /api/admin/tareas/:id, pero para usuarios de /tareas: la
 * tarea tiene que caer dentro de sus proyectos asignados (o ser admin de
 * tareas), nunca ser confidencial, y no puede pasarse ni sacarse a un
 * proyecto fuera de su alcance ni marcarse confidencial desde aquí.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("tareas_token")?.value;
  const user = token ? await verifyTareasToken(token) : null;
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const current = await resolveTarea(id);
  if (!current || current.confidencial) {
    return NextResponse.json({ message: "Tarea no encontrada" }, { status: 404 });
  }

  const canAccessCurrent =
    user.role === "admin" || user.proyectos.includes(canonicalProyecto(current.proyecto));
  if (!canAccessCurrent) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

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
  if (parsed.data.confidencial === true) {
    return NextResponse.json(
      { message: "No puedes marcar una tarea como confidencial desde aquí" },
      { status: 403 }
    );
  }
  if (parsed.data.proyecto !== undefined) {
    const canAccessNext =
      user.role === "admin" || user.proyectos.includes(canonicalProyecto(parsed.data.proyecto));
    if (!canAccessNext) {
      return NextResponse.json(
        { message: "No puedes mover la tarea fuera de tus proyectos" },
        { status: 403 }
      );
    }
  }
  if (parsed.data.parent_id !== undefined && parsed.data.parent_id !== null) {
    if (parsed.data.parent_id === id) {
      return NextResponse.json({ message: "Una actividad no puede ser su propia principal" }, { status: 400 });
    }
    const parent = await resolveTarea(parsed.data.parent_id);
    const proyectoFinal = parsed.data.proyecto ?? current.proyecto;
    if (!parent || parent.confidencial || canonicalProyecto(parent.proyecto) !== canonicalProyecto(proyectoFinal)) {
      return NextResponse.json(
        { message: "La actividad principal debe existir y ser del mismo proyecto" },
        { status: 400 }
      );
    }
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
    console.error("[tareas/:id] failed to persist update:", err);
    return NextResponse.json({ message: "No se pudo guardar el cambio" }, { status: 503 });
  }

  return NextResponse.json(updated);
}
