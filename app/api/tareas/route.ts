import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyTareasToken } from "@/lib/tareasAuth";
import { getTareasUltimaActualizacion } from "@/lib/portfolio/tareasData";
import { getMergedTareas, resolveTarea, upsertExternalTarea } from "@/lib/portfolio/tareasStore";
import { canonicalProyecto } from "@/lib/portfolio/proyectos";
import { TareaSchema, type Tarea } from "@/lib/portfolio/portfolioSchemas";

async function requireUser(req: NextRequest) {
  const token = req.cookies.get("tareas_token")?.value;
  return token ? await verifyTareasToken(token) : null;
}

function visibleFor(tareas: Tarea[], user: { role: string; proyectos: string[] }): Tarea[] {
  const scoped =
    user.role === "admin"
      ? tareas
      : tareas.filter((t) => user.proyectos.includes(canonicalProyecto(t.proyecto)));
  // Las tareas confidenciales nunca se exponen fuera de /admin/tareas.
  return scoped.filter((t) => !t.confidencial);
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const all = await getMergedTareas();
  const tareas = visibleFor(all, user);
  const ultimaActualizacion = [
    getTareasUltimaActualizacion(),
    ...tareas.map((t) => t.fecha_actualizacion),
  ].reduce((max, d) => (d > max ? d : max), "");

  return NextResponse.json({ ultimaActualizacion, tareas });
}

const CreateTareaSchema = z.object({
  proyecto: z.string().min(1, "proyecto es requerido"),
  startup: z.string().default(""),
  tipo_tarea: TareaSchema.shape.tipo_tarea,
  tarea: z.string().min(1, "tarea es requerida"),
  descripcion: z.string().default(""),
  proxima_accion: z.string().default(""),
  nivel_importancia: TareaSchema.shape.nivel_importancia,
  nivel_urgencia: TareaSchema.shape.nivel_urgencia,
  columna_kanban: TareaSchema.shape.columna_kanban.default("pendiente"),
  responsable: z.string().default(""),
  fecha_limite: z.string().nullable().default(null),
  etiquetas: z.array(z.string()).default([]),
  parent_id: z.string().nullable().default(null),
});

/**
 * Creación de tareas desde /tareas (usuarios externos con acceso limitado
 * a sus proyectos asignados) — separado de POST /api/admin/tareas, que
 * requiere sesión de admin y permite cualquier proyecto. Confidencial
 * siempre queda en false: un usuario externo no puede marcar una tarea
 * como sensible desde aquí.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const parsed = CreateTareaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const allowed = user.role === "admin" || user.proyectos.includes(canonicalProyecto(parsed.data.proyecto));
  if (!allowed) {
    return NextResponse.json({ message: "No puedes crear tareas fuera de tus proyectos" }, { status: 403 });
  }

  if (parsed.data.parent_id) {
    const parent = await resolveTarea(parsed.data.parent_id);
    if (!parent || parent.confidencial || canonicalProyecto(parent.proyecto) !== canonicalProyecto(parsed.data.proyecto)) {
      return NextResponse.json(
        { message: "La actividad principal debe existir y ser del mismo proyecto" },
        { status: 400 }
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const id = `EXT-T-${Date.now().toString(36).toUpperCase()}`;

  const tarea: Tarea = {
    id,
    ...parsed.data,
    estado: "creada desde /tareas",
    fecha_origen: today,
    fecha_actualizacion: today,
    fecha_completado: null,
    confidencial: false,
    fuente: { tipo: "manual", referencia: `Creado desde /tareas por ${user.email}`, fecha: today, link: null },
    enlaces: [],
    depende_de: [],
    checklist: [],
    historial: [{ fecha: today, nota: `Tarea creada desde /tareas por ${user.email}.` }],
  };

  const validated = TareaSchema.safeParse(tarea);
  if (!validated.success) {
    console.error("[tareas] built tarea failed schema validation:", validated.error.issues);
    return NextResponse.json({ message: "No se pudo crear la tarea" }, { status: 500 });
  }

  try {
    await upsertExternalTarea(validated.data);
  } catch (err) {
    console.error("[tareas] failed to persist new tarea:", err);
    return NextResponse.json({ message: "No se pudo guardar la tarea" }, { status: 503 });
  }

  return NextResponse.json(validated.data, { status: 201 });
}
