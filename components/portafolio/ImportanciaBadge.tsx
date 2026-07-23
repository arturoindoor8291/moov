import type { TareaSchema } from "@/lib/portfolio/portfolioSchemas";
import type { z } from "zod";

type NivelImportancia = z.infer<typeof TareaSchema>["nivel_importancia"];

const CONFIG: Record<NivelImportancia, { emoji: string; label: string; bg: string; color: string; border: string }> = {
  alta: {
    emoji: "🔴",
    label: "Alta",
    bg: "rgba(255,90,90,0.12)",
    color: "#ff5a5a",
    border: "rgba(255,90,90,0.25)",
  },
  media: {
    emoji: "🟡",
    label: "Media",
    bg: "rgba(255,195,0,0.12)",
    color: "#ffc300",
    border: "rgba(255,195,0,0.25)",
  },
  baja: {
    emoji: "⚪",
    label: "Baja",
    bg: "rgba(238,241,246,0.08)",
    color: "rgba(238,241,246,0.55)",
    border: "rgba(238,241,246,0.18)",
  },
};

export default function ImportanciaBadge({ nivel }: { nivel: NivelImportancia }) {
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
