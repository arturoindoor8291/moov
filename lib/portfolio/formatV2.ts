/** Formato es-MX para el dashboard v2. Montos en USD, porcentajes con un decimal. */
export const usd = (n: number | null | undefined) => (n == null ? null : `$${Math.round(n).toLocaleString("es-MX")}`);
export const usdK = (n: number | null | undefined) => {
  if (n == null) return null;
  const a = Math.abs(n);
  if (a >= 1_000_000) return `$${(n / 1_000_000).toLocaleString("es-MX", { maximumFractionDigits: 2 })} M`;
  if (a >= 10_000) return `$${(n / 1000).toLocaleString("es-MX", { maximumFractionDigits: 1 })} K`;
  return usd(n);
};
export const signed = (n: number | null | undefined) => (n == null ? null : `${n >= 0 ? "+" : "−"}${usdK(Math.abs(n))}`);
export const pct1 = (n: number | null | undefined) => (n == null ? null : `${n.toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);
export const spct = (n: number | null | undefined) => (n == null ? null : `${n >= 0 ? "+" : "−"}${Math.abs(n).toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);
export const mult = (n: number | null | undefined) => (n == null ? null : `${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`);
export const num0 = (n: number | null | undefined) => (n == null ? null : Math.round(n).toLocaleString("es-MX"));
export const meses = (n: number | null | undefined) => (n == null ? null : `${n.toLocaleString("es-MX", { maximumFractionDigits: 1 })} m`);

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/** "2026-08" -> "ago 2026"; "2025-12-31" -> "31 dic 2025". */
export function fechaCorta(f: string | null | undefined): string | null {
  if (!f) return null;
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(f);
  if (!m) return f;
  return `${m[3] ? `${Number(m[3])} ` : ""}${MESES[Number(m[2]) - 1]} ${m[1]}`;
}

export const FUENTE_LABEL: Record<string, string> = {
  documento: "Documento firmado o comprobante",
  reporte_startup: "Reporte de la startup",
  excel_bluebox: "Excel del gestor anterior (sin respaldo documental)",
  estimado: "Estimado por MOOV",
  no_disponible: "No reportado",
};
