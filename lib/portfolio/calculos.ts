/**
 * Cálculos puros del fondo (schema v2). Sin I/O: todo se deriva de las
 * posiciones por startup + parámetros del fondo, para que las vistas nunca
 * se contradigan. Definiciones en la sección 6 del brief de rediseño.
 */

export type PosicionCalculo = {
  nombre: string;
  monto_usd: number | null; // capital desplegado
  valor_posicion_usd: number | null; // participación actual x valuación actual
};

export type ParametrosCalculo = {
  tamano_fondo_usd: number;
  gastos_usd: number;
  distribuciones_usd: number;
  /** Si los fees salen del tamaño del fondo (decisión vigente: sí). */
  gastos_salen_del_fondo: boolean;
};

export type Flujo = { fecha: string; monto_usd: number }; // negativo = aporte

const suma = (xs: (number | null)[]) => xs.reduce<number>((a, x) => a + (x ?? 0), 0);

export function capitalDesplegado(ps: PosicionCalculo[]): number {
  return suma(ps.map((p) => p.monto_usd));
}

export function nav(ps: PosicionCalculo[]): number {
  return suma(ps.map((p) => p.valor_posicion_usd));
}

export function moicPosicion(p: PosicionCalculo): number | null {
  if (!p.monto_usd || p.valor_posicion_usd == null) return null;
  return p.valor_posicion_usd / p.monto_usd;
}

export function moicBruto(ps: PosicionCalculo[]): number | null {
  const c = capitalDesplegado(ps);
  return c > 0 ? nav(ps) / c : null;
}

export function tvpi(ps: PosicionCalculo[], p: ParametrosCalculo): number | null {
  const base = capitalDesplegado(ps) + p.gastos_usd;
  return base > 0 ? (nav(ps) + p.distribuciones_usd) / base : null;
}

export function dpi(ps: PosicionCalculo[], p: ParametrosCalculo): number | null {
  const c = capitalDesplegado(ps);
  return c > 0 ? p.distribuciones_usd / c : null;
}

export function rvpi(ps: PosicionCalculo[], p: ParametrosCalculo): number | null {
  const base = capitalDesplegado(ps) + p.gastos_usd;
  return base > 0 ? nav(ps) / base : null;
}

export function dryPowder(ps: PosicionCalculo[], p: ParametrosCalculo): number {
  const gastos = p.gastos_salen_del_fondo ? p.gastos_usd : 0;
  return p.tamano_fondo_usd - capitalDesplegado(ps) - gastos;
}

/** % del capital desplegado por startup, mayor a menor. */
export function concentracion(ps: PosicionCalculo[]) {
  const total = capitalDesplegado(ps);
  return ps
    .filter((p) => p.monto_usd)
    .map((p) => ({ nombre: p.nombre, pct: total > 0 ? (p.monto_usd! / total) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct);
}

export function topN(ps: PosicionCalculo[], n: number): number {
  return concentracion(ps)
    .slice(0, n)
    .reduce((a, x) => a + x.pct, 0);
}

/** XIRR con fechas reales (base 365). Devuelve null si no hay cambio de signo. */
export function xirr(flujos: Flujo[]): number | null {
  if (!flujos.some((f) => f.monto_usd < 0) || !flujos.some((f) => f.monto_usd > 0)) return null;
  const t0 = Date.parse(flujos[0].fecha);
  const f = (r: number) =>
    flujos.reduce((a, x) => a + x.monto_usd / Math.pow(1 + r, (Date.parse(x.fecha) - t0) / 31_536_000_000), 0);
  let lo = -0.99;
  let hi = 10;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Meses completos entre el último periodo con dato ("YYYY-MM") y el corte. */
export function mesesDesdeDato(ultimo: string | null, corte: string): number | null {
  if (!ultimo) return null;
  const [y1, m1] = ultimo.split("-").map(Number);
  const [y2, m2] = corte.split("-").map(Number);
  if (!y1 || !m1 || !y2 || !m2) return null;
  return (y2 - y1) * 12 + (m2 - m1);
}

export type Frescura = "verde" | "amarillo" | "rojo" | "sin_dato";

/** 0-3 meses verde, 4-6 amarillo, más de 6 rojo. */
export function semaforoFrescura(meses: number | null): Frescura {
  if (meses == null) return "sin_dato";
  return meses <= 3 ? "verde" : meses <= 6 ? "amarillo" : "rojo";
}
