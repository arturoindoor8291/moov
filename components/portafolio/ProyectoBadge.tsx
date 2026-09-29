import { canonicalProyecto, proyectoColor, proyectoTint } from "./tareasTheme";

export default function ProyectoBadge({ proyecto }: { proyecto: string }) {
  const nombre = canonicalProyecto(proyecto);
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 600,
        padding: "3px 7px",
        borderRadius: "5px",
        whiteSpace: "nowrap",
        background: proyectoTint(nombre),
        color: proyectoColor(nombre),
      }}
    >
      {nombre}
    </span>
  );
}
