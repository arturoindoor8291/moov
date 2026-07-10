import type { StartupEstadoSchema } from "@/lib/portfolio/portfolioSchemas";
import type { z } from "zod";

type Estado = z.infer<typeof StartupEstadoSchema>;

const CONFIG: Record<Estado, { emoji: string; label: string; bg: string; color: string; border: string }> = {
  sano: {
    emoji: "🟢",
    label: "Sano",
    bg: "rgba(40,200,80,0.12)",
    color: "#28c850",
    border: "rgba(40,200,80,0.25)",
  },
  vigilar: {
    emoji: "🟡",
    label: "Vigilar",
    bg: "rgba(255,195,0,0.12)",
    color: "#ffc300",
    border: "rgba(255,195,0,0.25)",
  },
  critico: {
    emoji: "🔴",
    label: "Crítico",
    bg: "rgba(255,90,90,0.12)",
    color: "#ff5a5a",
    border: "rgba(255,90,90,0.25)",
  },
};

export default function HealthBadge({ estado }: { estado: Estado }) {
  const c = CONFIG[estado];
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
