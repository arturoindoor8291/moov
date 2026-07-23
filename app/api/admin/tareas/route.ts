import { NextResponse } from "next/server";
import { getAllTareas, getTareasUltimaActualizacion } from "@/lib/portfolio/tareasData";
import { getColumnOverrides, getExternalTareas } from "@/lib/portfolio/tareasStore";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";

export async function GET() {
  const [overrides, externalTareas] = await Promise.all([getColumnOverrides(), getExternalTareas()]);

  const moovTareas: Tarea[] = getAllTareas().map((t) => {
    const override = overrides[t.id];
    return override ? { ...t, columna_kanban: override as Tarea["columna_kanban"] } : t;
  });

  const tareas = [...moovTareas, ...externalTareas];
  const ultimaActualizacion = [getTareasUltimaActualizacion(), ...tareas.map((t) => t.fecha_actualizacion)].reduce(
    (max, d) => (d > max ? d : max)
  );

  return NextResponse.json({ ultimaActualizacion, tareas });
}
