function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizeKey(s: string): string {
  return stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Cada proyecto llega con su propia variante de texto libre según qué
// integración lo mandó (extraer-tareas de cada repo, el panel, etc.):
// "Multicreditos" vs "Multicréditos", "MOOV" vs "MOOV / Portafolio" vs
// "Portafolio MOOV", y "Mi Taller" vs "Mitaller" vs su nombre anterior
// "AutoCare". Sin esto, tanto el tablero como el control de acceso por
// proyecto de /tareas verían una entrada distinta por cada variante.
const CANONICAL_ALIASES: Record<string, string> = {
  multicreditos: "Multicréditos",
  "mi taller": "Mi Taller",
  mitaller: "Mi Taller",
  autocare: "Mi Taller",
  "auto care": "Mi Taller",
  moov: "MOOV",
  "moov portafolio": "MOOV",
  "portafolio moov": "MOOV",
  komenzal: "Komenzal",
};

export function canonicalProyecto(proyecto: string): string {
  return CANONICAL_ALIASES[normalizeKey(proyecto)] ?? proyecto.trim();
}

// Los 4 proyectos reales que hoy alimentan el board consolidado — la lista
// que se ofrece al asignar proyectos a un usuario de /tareas.
export const CANONICAL_PROYECTOS = ["Komenzal", "Mi Taller", "MOOV", "Multicréditos"] as const;
