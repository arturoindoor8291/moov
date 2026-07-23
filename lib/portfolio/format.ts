/**
 * Shared display formatting for portfolio-data.json values. `moneda` is
 * usually a currency code (EUR/USD/MXN) but can be the literal string
 * "%" (Autolab reports a completion percentage, not an absolute figure)
 * — never assume it's a real currency.
 */
export function formatMetricValue(valor: number | null, moneda: string | null): string {
  if (valor == null) return "—";
  if (moneda === "%") return `${(valor * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
  const formatted = valor.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return moneda ? `${formatted} ${moneda}` : formatted;
}

export function formatUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD`;
}

export function formatPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${(n * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

/**
 * fecha_limite in tareas-data.json is usually an ISO date but can be free
 * text (e.g. "Próximas semanas, sin fecha exacta") when the source call
 * didn't give a hard deadline — never assume it parses.
 */
export function formatFechaLimite(fechaLimite: string | null): string {
  if (!fechaLimite) return "—";
  const date = new Date(fechaLimite);
  if (Number.isNaN(date.getTime())) return fechaLimite;
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

/** True if fecha_limite parses to a real date that's overdue or due within 7 days. */
export function isFechaLimiteUrgente(fechaLimite: string | null): boolean {
  if (!fechaLimite) return false;
  const date = new Date(fechaLimite);
  if (Number.isNaN(date.getTime())) return false;
  const diffDays = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays < 7;
}
