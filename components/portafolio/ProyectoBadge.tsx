import { proyectoColor, proyectoTint } from "./tareasTheme";

export default function ProyectoBadge({ proyecto }: { proyecto: string }) {
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 600,
        padding: "3px 7px",
        borderRadius: "5px",
        whiteSpace: "nowrap",
        background: proyectoTint(proyecto),
        color: proyectoColor(proyecto),
      }}
    >
      {proyecto}
    </span>
  );
}
