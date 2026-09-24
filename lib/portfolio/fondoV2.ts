/**
 * Motor de cálculo del fondo sobre el schema v2. Funciones puras: todo lo
 * que ve el dueño del fondo (KPIs, concentración, semáforo sugerido,
 * completitud, lectura del comité) sale de aquí y de startups[].
 */
import {
  capitalDesplegado, concentracion, dryPowder, mesesDesdeDato, moicBruto, moicPosicion, nav, rvpi, tvpi, xirr,
  type Flujo, type PosicionCalculo,
} from "./calculos.ts";
import { fechaDePeriodo, periodoAMes } from "./migracion.ts";
import type { Discrepancia, ParametrosFondo, PortafolioV2, PuntoSerie, StartupV2 } from "./schemaV2.ts";

export type Lente = "valor_justo" | "costo";

// ---------- posiciones por lente ----------

export function posicion(s: StartupV2, lente: Lente): PosicionCalculo & { id: string; base_marca: StartupV2["inversion"]["base_marca"] } {
  const inv = s.inversion;
  if (lente === "costo") {
    const m = inv.monto_documento_usd;
    return { id: s.id, nombre: s.nombre, monto_usd: m, valor_posicion_usd: m, base_marca: "a_costo" };
  }
  const monto = inv.monto_usd.valor;
  const part = inv.participacion_actual_pct.valor;
  const fmv = inv.valuacion_actual_usd.valor;
  const valor = part != null && fmv != null ? (part / 100) * fmv : monto;
  return { id: s.id, nombre: s.nombre, monto_usd: monto, valor_posicion_usd: valor, base_marca: inv.base_marca };
}

export function posiciones(ss: StartupV2[], lente: Lente) {
  return ss.map((s) => posicion(s, lente));
}

// ---------- series ----------

const ORDEN = (p: PuntoSerie) => periodoAMes(p.periodo) ?? "";

/** Último valor no nulo de un campo, buscando en series mensual y trimestral. */
export function ultimoValor(s: StartupV2, campo: "revenue_usd" | "gtv_usd" | "ebitda_usd" | "burn_usd" | "caja_usd" | "runway_meses" | "clientes" | "usuarios_activos", opts: { sinDuda?: boolean } = {}) {
  const todos = [...s.serie_mensual, ...s.serie_trimestral]
    .filter((p) => p[campo].valor != null && !(opts.sinDuda && p[campo].en_duda))
    .sort((a, b) => ORDEN(b).localeCompare(ORDEN(a)));
  const p = todos[0];
  return p ? { dato: p[campo], periodo: p.periodo, punto: p } : null;
}

/** Crecimiento QoQ entre los dos últimos trimestres consecutivos con revenue confiable. */
export function crecimientoQoQ(s: StartupV2): { pct: number; periodo: string } | null {
  const ps = s.serie_trimestral.filter((p) => p.revenue_usd.valor != null && !p.revenue_usd.en_duda).sort((a, b) => ORDEN(a).localeCompare(ORDEN(b)));
  if (ps.length < 2) return null;
  const [a, b] = ps.slice(-2);
  const ma = ORDEN(a), mb = ORDEN(b);
  if (mesesDesdeDato(ma, mb) !== 3 || !a.revenue_usd.valor) return null;
  return { pct: (b.revenue_usd.valor! / a.revenue_usd.valor - 1) * 100, periodo: b.periodo };
}

export function revenueAgregado(ss: StartupV2[]) {
  const porTrim = new Map<string, { total: number; por: Record<string, number> }>();
  for (const s of ss) {
    for (const p of s.serie_trimestral) {
      if (p.revenue_usd.valor == null || p.revenue_usd.en_duda) continue;
      const e = porTrim.get(p.periodo) ?? { total: 0, por: {} };
      e.total += p.revenue_usd.valor;
      e.por[s.nombre] = p.revenue_usd.valor;
      porTrim.set(p.periodo, e);
    }
  }
  return [...porTrim.entries()].sort((a, b) => (periodoAMes(a[0]) ?? "").localeCompare(periodoAMes(b[0]) ?? "")).map(([periodo, v]) => ({ periodo, ...v, n: Object.keys(v.por).length }));
}

/** Solo trimestres donde reporta al menos `minPct` de las startups que más reportan: si no, la suma cae por falta de datos, no por desempeño. */
export function trimestresComparables(agg: ReturnType<typeof revenueAgregado>, minPct = 0.6) {
  const max = Math.max(...agg.map((a) => a.n), 0);
  return { max, filas: agg.filter((a) => a.n >= max * minPct) };
}

// ---------- calidad de datos ----------

export function mesesSinDato(s: StartupV2, corte: string): number | null {
  return mesesDesdeDato(s.reporte.ultimo_periodo_reportado, corte);
}

export function completitud(s: StartupV2): { pct: number; faltantes: string[] } {
  const inv = s.inversion;
  const checks: [string, boolean][] = [
    ["Monto invertido", inv.monto_usd.valor != null],
    ["Documento localizado", inv.documento_localizado],
    ["Fecha de inversión", inv.fecha != null],
    ["Instrumento", inv.instrumento != null],
    ["Participación actual", inv.participacion_actual_pct.valor != null],
    ["Valuación actual", inv.valuacion_actual_usd.valor != null],
    ["Revenue del último periodo", ultimoValor(s, "revenue_usd", { sinDuda: true }) != null],
    ["Crecimiento QoQ", crecimientoQoQ(s) != null],
    ["Clientes o usuarios", ultimoValor(s, "clientes") != null || ultimoValor(s, "usuarios_activos") != null],
    ["EBITDA o burn", ultimoValor(s, "ebitda_usd") != null || ultimoValor(s, "burn_usd") != null],
    ["Caja", ultimoValor(s, "caja_usd") != null],
    ["Runway", ultimoValor(s, "runway_meses") != null],
    ["Reporte al corriente", s.reporte.al_corriente === true],
  ];
  const ok = checks.filter(([, v]) => v).length;
  return { pct: (ok / checks.length) * 100, faltantes: checks.filter(([, v]) => !v).map(([k]) => k) };
}

// ---------- semáforo sugerido (sección 8.4) ----------

export function estadoSugerido(s: StartupV2, discrepancias: Discrepancia[], corte: string) {
  const criticas: string[] = [];
  const vigilar: string[] = [];
  const runway = ultimoValor(s, "runway_meses")?.dato.valor ?? null;
  const ebitda = ultimoValor(s, "ebitda_usd")?.dato.valor ?? null;
  const meses = mesesSinDato(s, corte);
  const sinReporte = s.reporte.ultimo_periodo_reportado == null;
  const mesesInvertida = s.inversion.fecha ? mesesDesdeDato(s.inversion.fecha.slice(0, 7), corte) : s.inversion.periodo ? mesesDesdeDato(periodoAMes(s.inversion.periodo), corte) : null;

  if (runway != null && runway < 4) criticas.push(`Runway de ${runway} meses (menos de 4).`);
  if (s.crisis_caja_reportada) criticas.push("Crisis de caja reportada.");
  if (sinReporte && mesesInvertida != null && mesesInvertida > 6) criticas.push(`Sin ningún reporte financiero y invertida hace ${mesesInvertida} meses (más de 2 trimestres).`);
  if (!s.inversion.documento_localizado && sinReporte) criticas.push("Sin contrato localizado y sin reportes.");

  if (meses != null && meses > 6) vigilar.push(`Último dato hace ${meses} meses (más de 6).`);
  const rev = s.serie_trimestral.filter((p) => p.revenue_usd.valor != null && !p.revenue_usd.en_duda).sort((a, b) => ORDEN(a).localeCompare(ORDEN(b)));
  if (rev.length >= 3) {
    const [a, b, c] = rev.slice(-3).map((p) => p.revenue_usd.valor!);
    if (a > b && b > c) vigilar.push("Revenue cayendo 2 periodos seguidos.");
  }
  if (ebitda != null && ebitda < 0 && runway != null && runway < 12) vigilar.push(`EBITDA negativo con runway de ${runway} meses (menos de 12).`);
  const altas = s.alertas.filter((a) => a.severidad === "alta").length;
  if (altas) vigilar.push(`${altas} alerta(s) de severidad alta abierta(s).`);
  const disc = discrepancias.filter((d) => d.startup === s.nombre && d.estado === "abierta" && d.material && (d.afecta === "monto" || d.afecta === "valuacion"));
  if (disc.length) vigilar.push(`Discrepancia abierta que afecta monto o valuación (${disc.map((d) => d.id).join(", ")}).`);

  if (criticas.length) return { valor: "critico" as const, razones: [...criticas, ...vigilar] };
  if (vigilar.length) return { valor: "vigilar" as const, razones: vigilar };
  return { valor: "sano" as const, razones: ["Ninguna regla de Vigilar o Crítico se cumple con los datos disponibles."] };
}

// ---------- agrupaciones ----------

export function categoriaInstrumento(t: string | null): string {
  if (!t) return "No confirmado";
  if (/safe/i.test(t)) return "SAFE";
  if (/convertible|nota/i.test(t)) return "Nota convertible";
  return "Equity / SPV";
}

function agrupar(ss: StartupV2[], lente: Lente, clave: (s: StartupV2) => string[]) {
  const m = new Map<string, { capital: number; n: number }>();
  for (const s of ss) {
    const monto = posicion(s, lente).monto_usd ?? 0;
    const ks = clave(s);
    for (const k of ks) {
      const e = m.get(k) ?? { capital: 0, n: 0 };
      // Capital con varias claves (p. ej. países) se reparte en partes iguales.
      e.capital += monto / ks.length;
      e.n += 1;
      m.set(k, e);
    }
  }
  return [...m.entries()].map(([k, v]) => ({ clave: k, ...v })).sort((a, b) => b.capital - a.capital);
}

// ---------- fondo ----------

/** Diferencias menores a 1 USD son ruido de participaciones redondeadas: cuentan como 0. */
export const redondearDelta = (d: number) => (Math.abs(d) < 1 ? 0 : d);

export function calcularFondo(data: PortafolioV2, lente: Lente) {
  const { startups: ss, parametros: par, discrepancias } = data;
  const ps = posiciones(ss, lente);
  const gastos = par.gastos_inversion.reduce((a, g) => a + g.monto_usd, 0);
  const pc = { tamano_fondo_usd: par.tamano_usd, gastos_usd: gastos, distribuciones_usd: 0, gastos_salen_del_fondo: par.gastos_salen_del_fondo };
  const capital = capitalDesplegado(ps);
  const valor = nav(ps);
  const dry = dryPowder(ps, pc);
  const ticketPromedio = capital / Math.max(ps.filter((p) => p.monto_usd).length, 1);

  // capital sin documento y brecha entre lentes
  const psJusto = posiciones(ss, "valor_justo");
  const capitalJusto = capitalDesplegado(psJusto);
  const capitalDoc = ss.reduce((a, s) => a + (s.inversion.monto_documento_usd ?? 0), 0);
  const capitalRespaldado = ss.reduce((a, s) => a + (s.inversion.documento_localizado ? Math.min(s.inversion.monto_documento_usd ?? 0, s.inversion.monto_usd.valor ?? 0) : 0), 0);
  const brecha = ss.map((s) => ({ nombre: s.nombre, excel: s.inversion.monto_usd.valor, documento: s.inversion.monto_documento_usd, diferencia: (s.inversion.monto_usd.valor ?? 0) - (s.inversion.monto_documento_usd ?? 0) })).filter((b) => b.diferencia !== 0);

  // IRR con fechas reales; aportes en fecha real o mitad de trimestre (estimado)
  const flujos: Flujo[] = ss
    .filter((s) => posicion(s, lente).monto_usd)
    .map((s) => ({ fecha: s.inversion.fecha && /^\d{4}-\d{2}-\d{2}$/.test(s.inversion.fecha) && lente === "costo" ? s.inversion.fecha : s.inversion.periodo ? fechaDePeriodo(s.inversion.periodo) : "2025-12-31", monto_usd: -(posicion(s, lente).monto_usd ?? 0) }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  flujos.push({ fecha: par.fecha_corte_excel, monto_usd: valor });
  const irr = xirr(flujos);

  const pos = ss.map((s) => {
    const p = posicion(s, lente);
    return { id: s.id, nombre: s.nombre, costo: p.monto_usd, valor: p.valor_posicion_usd, delta: redondearDelta((p.valor_posicion_usd ?? 0) - (p.monto_usd ?? 0)), moic: moicPosicion(p), base_marca: s.inversion.base_marca, nota: s.inversion.base_marca_nota };
  });

  const corte = par.fecha_corte_vista;
  const frescas = ss.filter((s) => { const m = mesesSinDato(s, corte); return m != null && m <= 6; }).length;
  const sugeridos = Object.fromEntries(ss.map((s) => [s.id, estadoSugerido(s, discrepancias, corte)]));

  return {
    lente, ps, capital, nav: valor, moicBruto: moicBruto(ps), tvpi: tvpi(ps, pc), rvpi: rvpi(ps, pc), dpi: 0, irr, dryPowder: dry,
    followOnsReferencia: ticketPromedio > 0 ? Math.floor(Math.max(dry, 0) / ticketPromedio * 10) / 10 : 0,
    gastos, ticketPromedio, capitalSinDocumento: capitalJusto - capitalDoc, capitalJusto, capitalDoc,
    capitalRespaldadoPct: capitalJusto > 0 ? (capitalRespaldado / capitalJusto) * 100 : 0,
    brecha, pos: pos.sort((a, b) => b.delta - a.delta),
    gananciaTotal: valor - capital,
    concentracion: concentracion(ps), top1: concentracion(ps)[0], sugeridos, startupsFrescas: frescas,
    porVehiculo: agrupar(ss, lente, (s) => [s.vehiculo === "spv" ? "SPV" : "Directas"]),
    porTipo: agrupar(ss, lente, (s) => [s.tipo_portafolio]),
    porSector: agrupar(ss, lente, (s) => [s.sector_grupo]),
    porPais: agrupar(ss, lente, (s) => s.paises),
    porInstrumento: agrupar(ss, lente, (s) => [categoriaInstrumento(s.inversion.instrumento)]),
    revenue: revenueAgregado(ss),
  };
}
export type FondoCalculado = ReturnType<typeof calcularFondo>;

// ---------- lectura del comité (reglas, no IA) ----------

export const UMBRALES = { concentracion_pct: 25, frescura_meses: 6, runway_meses: 6, respaldo_min_pct: 60 };

export function lecturaComite(data: PortafolioV2, f: FondoCalculado): string[] {
  const ss = data.startups;
  const frases: (string | null)[] = [];
  const x = (n: number | null, d = 2) => (n == null ? "n/d" : n.toFixed(d));
  frases.push(f.moicBruto != null ? `El fondo está a ${x(f.moicBruto)}x bruto y ${x(f.tvpi)}x neto${f.lente === "costo" ? " (a costo, solo con documento)" : ""}.` : null);

  const ganadoras = f.pos.filter((p) => p.delta > 0);
  const ganTotal = ganadoras.reduce((a, p) => a + p.delta, 0);
  if (ganadoras.length && ganTotal > 0) {
    const sinRonda = ganadoras.filter((p) => p.base_marca !== "ronda_pricing").map((p) => p.nombre);
    frases.push(`Toda la ganancia no realizada (${Math.round(ganTotal).toLocaleString("es-MX")} USD) viene de ${ganadoras.length} marca(s): ${ganadoras.map((p) => p.nombre).join(", ")}.${sinRonda.length ? ` ${sinRonda.join(", ")} no se apoya(n) en una ronda con precio verificada.` : ""}`);
  }
  const debil = ss.filter((s) => s.estado_asignado !== "sano");
  const runwayCorto = ss.filter((s) => { const r = ultimoValor(s, "runway_meses")?.dato.valor; return (r != null && r < UMBRALES.runway_meses) || s.crisis_caja_reportada; });
  if (debil.length) frases.push(`${debil.length} de ${ss.length} startups están en Vigilar o Crítico${runwayCorto.length ? `; con caja corta o crisis de caja: ${runwayCorto.map((s) => s.nombre).join(", ")}` : ""}.`);
  if (f.top1 && f.top1.pct > UMBRALES.concentracion_pct) frases.push(`${f.top1.nombre} concentra ${f.top1.pct.toFixed(1)}% del capital desplegado (umbral ${UMBRALES.concentracion_pct}%).`);
  if (f.capitalRespaldadoPct < UMBRALES.respaldo_min_pct) frases.push(`Solo ${f.capitalRespaldadoPct.toFixed(0)}% del capital desplegado tiene documento localizado; ${Math.round(f.capitalSinDocumento).toLocaleString("es-MX")} USD vienen solo del Excel del gestor anterior.`);
  const viejas = ss.filter((s) => { const m = mesesSinDato(s, data.parametros.fecha_corte_vista); return m == null || m > UMBRALES.frescura_meses; });
  if (viejas.length) frases.push(`${viejas.length} de ${ss.length} startups tienen dato de más de ${UMBRALES.frescura_meses} meses o ninguno.`);
  return frases.filter((x): x is string => !!x).slice(0, 5);
}

export function parametrosRef(p: ParametrosFondo) {
  return p;
}
