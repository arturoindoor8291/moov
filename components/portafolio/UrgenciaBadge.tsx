import type { Tarea } from "@/lib/portfolio/portfolioSchemas";

type NivelUrgencia = Tarea["nivel_urgencia"];

const CONFIG: Record<NivelUrgencia, { emoji: string; label: string; bg: string; color: string; border: string }> = {
  inmediata: {
    emoji: "🔺",
    label: "Inmediata",
    bg: "rgba(255,90,90,0.12)",
    color: "#ff5a5a",
    border: "rgba(255,90,90,0.25)",
  },
  esta_semana: {
    emoji: "🟠",
    label: "Esta semana",
    bg: "rgba(255,150,0,0.12)",
    color: "#ff9600",
    border: "rgba(255,150,0,0.25)",
  },
  este_mes: {
    emoji: "🔵",
    label: "Este mes",
    bg: "rgba(57,135,229,0.12)",
    color: "#3987e5",
    border: "rgba(57,135,229,0.25)",
  },
  sin_urgencia_definida: {
    emoji: "⚪",
    label: "Sin urgencia definida",
    bg: "rgba(238,241,246,0.08)",
    color: "rgba(238,241,246,0.55)",
    border: "rgba(238,241,246,0.18)",
  },
};

export default function UrgenciaBadge({ nivel }: { nivel: NivelUrgencia }) {
  const c = CONFIG[nivel];
  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "20px",
        whiteSpace: "nowrap",
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {c.emoji} {c.label}
    </span>
  );
}
