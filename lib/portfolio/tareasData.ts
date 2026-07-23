import rawData from "./tareas-data.json";
import { TareasDataSchema, type Tarea } from "./portfolioSchemas";

/**
 * tareas-data.json is a copy of /cowork/tareas-compromisos.json — same
 * update flow as portfolio-data.json (see app/portafolio/README.md):
 * Cowork updates the /cowork/ draft first, this repo copy is what the
 * deployed site reads, and it's only reachable through routes behind
 * proxy.ts's /portafolio auth gate.
 */
const TAREAS_DATA = TareasDataSchema.parse(rawData);

export function getAllTareas(): Tarea[] {
  return TAREAS_DATA.tareas;
}

export function getTareasUltimaActualizacion(): string {
  return TAREAS_DATA.ultima_actualizacion;
}
