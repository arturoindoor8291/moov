// `proyecto` es texto libre (ver TareaSchema) — cualquier empresa nueva
// que se sume al board consolidado necesita un color visible sin tocar
// código. Los tres proyectos conocidos hoy tienen tono fijo para que se
// reconozcan de un vistazo; cualquier otro cae en un hash determinista
// (mismo texto → mismo color siempre) en vez de un gris genérico.
const KNOWN_HUES: Record<string, number> = {
  "MOOV / Portafolio": 217,
  "Multicréditos": 166,
  Mitaller: 280,
};

function hueForProyecto(proyecto: string): number {
  if (proyecto in KNOWN_HUES) return KNOWN_HUES[proyecto];
  let hash = 0;
  for (let i = 0; i < proyecto.length; i++) hash = (hash * 31 + proyecto.charCodeAt(i)) >>> 0;
  return hash % 360;
}

export default function ProyectoBadge({ proyecto }: { proyecto: string }) {
  const hue = hueForProyecto(proyecto);
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: "6px",
        whiteSpace: "nowrap",
        background: `hsla(${hue}, 75%, 60%, 0.16)`,
        color: `hsl(${hue}, 85%, 72%)`,
        border: `1px solid hsla(${hue}, 75%, 60%, 0.35)`,
      }}
    >
      {proyecto}
    </span>
  );
}
