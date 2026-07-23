import { NextResponse } from "next/server";
import { getAllTareas, getTareasUltimaActualizacion } from "@/lib/portfolio/tareasData";

export async function GET() {
  return NextResponse.json({
    ultimaActualizacion: getTareasUltimaActualizacion(),
    tareas: getAllTareas(),
  });
}
