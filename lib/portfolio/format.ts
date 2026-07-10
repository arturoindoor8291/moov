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
