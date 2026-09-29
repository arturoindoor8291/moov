import type { Tarea } from "@/lib/portfolio/portfolioSchemas";

// Paleta compartida del panel /admin/tareas — inspirada en el tablero R2D2
// (dark navy + acentos de estado por punto de color en vez de pastillas
// grandes) para que las tarjetas se lean de un vistazo entre los 4 proyectos.
export const theme = {
  bg: "#10131A",
  surface: "#171B23",
  surface2: "#1E232C",
  surface3: "#262C36",
  border: "#2A3038",
  borderStrong: "#3A414C",
  text: "#F2F4F3",
  textMuted: "#9AA3AC",
  textFaint: "#6B7480",
  danger: "#E5605A",
  warning: "#E0B23C",
  good: "#4CAF7D",
  info: "#8A93A0",
  accent: "#2f6dff",
} as const;

export function importanciaColor(nivel: Tarea["nivel_importancia"]): string {
  return nivel === "alta" ? theme.danger : nivel === "media" ? theme.warning : theme.good;
}

export function urgenciaColor(nivel: Tarea["nivel_urgencia"]): string {
  if (nivel === "inmediata") return theme.danger;
  if (nivel === "esta_semana") return theme.warning;
  if (nivel === "este_mes") return theme.accent;
  return theme.textFaint;
}

// Los 3 proyectos que ya conocemos tienen tono fijo para reconocerse de un
// vistazo; cualquier proyecto nuevo cae en un hash determinista (mismo
// texto → mismo color siempre) en vez de un gris genérico.
const KNOWN_HUES: Record<string, number> = {
  "MOOV / Portafolio": 217,
  "Multicréditos": 166,
  Mitaller: 280,
};

export function hueForProyecto(proyecto: string): number {
  if (proyecto in KNOWN_HUES) return KNOWN_HUES[proyecto];
  let hash = 0;
  for (let i = 0; i < proyecto.length; i++) hash = (hash * 31 + proyecto.charCodeAt(i)) >>> 0;
  return hash % 360;
}

export function proyectoColor(proyecto: string): string {
  return `hsl(${hueForProyecto(proyecto)}, 70%, 62%)`;
}

export function proyectoTint(proyecto: string): string {
  return `hsla(${hueForProyecto(proyecto)}, 70%, 62%, 0.16)`;
}

export function ownerInitial(responsable: string): string {
  const trimmed = responsable.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

/** True if fecha_limite parses to a real date that's already in the past. */
export function isVencida(fechaLimite: string | null): boolean {
  if (!fechaLimite) return false;
  const date = new Date(fechaLimite);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}
