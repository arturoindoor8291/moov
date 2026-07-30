import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllTareas, getTareasUltimaActualizacion } from "@/lib/portfolio/tareasData";
import { getColumnOverrides, getExternalTareas, upsertExternalTarea } from "@/lib/portfolio/tareasStore";
import { TareaSchema, type Tarea } from "@/lib/portfolio/portfolioSchemas";

export async function GET() {
  const [overrides, storedTareas] = await Promise.all([getColumnOverrides(), getExternalTareas()]);
  const storedIds = new Set(storedTareas.map((t) => t.id));

  // A native tarea fully edited from the panel gets "forked" into Redis
  // (see resolveTarea in tareasStore.ts) — once that happens the stored
  // copy is authoritative, so it's excluded here to avoid showing both.
  const moovTareas: Tarea[] = getAllTareas()
    .filter((t) => !storedIds.has(t.id))
    .map((t) => {
      const override = overrides[t.id];
      return override ? { ...t, columna_kanban: override as Tarea["columna_kanban"] } : t;
    });

  const tareas = [...moovTareas, ...storedTareas];
  const ultimaActualizacion = [getTareasUltimaActualizacion(), ...tareas.map((t) => t.fecha_actualizacion)].reduce(
    (max, d) => (d > max ? d : max)
  );

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
  confidencial: z.boolean().default(false),
  etiquetas: z.array(z.string()).default([]),
});

/**
 * Creates a tarea directly from the /admin/tareas panel — separate from
 * POST /api/tareas-ingest, which is for other repos' "extraer-tareas"
 * skill and requires a bearer secret. This one sits behind proxy.ts's
 * admin cookie auth instead. New ids get a "UI-T-" prefix so they never
 * collide with native "T-XXX" ids or other projects' prefixes.
 */
export async function POST(req: NextRequest) {
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

  const today = new Date().toISOString().slice(0, 10);
  const id = `UI-T-${Date.now().toString(36).toUpperCase()}`;

  const tarea: Tarea = {
    id,
    ...parsed.data,
    estado: "creada desde el panel",
    fecha_origen: today,
    fecha_actualizacion: today,
    fecha_completado: null,
    fuente: { tipo: "manual", referencia: "Creado desde el panel /admin/tareas", fecha: today, link: null },
    enlaces: [],
    depende_de: [],
    checklist: [],
    historial: [{ fecha: today, nota: "Tarea creada desde el panel /admin/tareas." }],
  };

  const validated = TareaSchema.safeParse(tarea);
  if (!validated.success) {
    console.error("[admin/tareas] built tarea failed schema validation:", validated.error.issues);
    return NextResponse.json({ message: "No se pudo crear la tarea" }, { status: 500 });
  }

  try {
    await upsertExternalTarea(validated.data);
  } catch (err) {
    console.error("[admin/tareas] failed to persist new tarea:", err);
    return NextResponse.json({ message: "No se pudo guardar la tarea" }, { status: 503 });
  }

  return NextResponse.json(validated.data, { status: 201 });
}
