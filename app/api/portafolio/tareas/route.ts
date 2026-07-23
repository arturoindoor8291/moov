import { NextResponse } from "next/server";
import { getAllTareas, getTareasUltimaActualizacion } from "@/lib/portfolio/tareasData";
import { getColumnOverrides } from "@/lib/portfolio/tareasStore";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";

export async function GET() {
  const overrides = await getColumnOverrides();
  const tareas: Tarea[] = getAllTareas().map((t) => {
    const override = overrides[t.id];
    return override ? { ...t, columna_kanban: override as Tarea["columna_kanban"] } : t;
  });

  return NextResponse.json({
    ultimaActualizacion: getTareasUltimaActualizacion(),
    tareas,
  });
}
