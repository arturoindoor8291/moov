/* eslint-disable @typescript-eslint/no-explicit-any -- el seed del Excel es JSON externo sin tipo fijo */
/**
 * Migración v1 (portfolio-data.json de Cowork) + seed del Excel de Bluebox
 * -> schema v2. Función pura: el script scripts/migrar-portafolio-v2.ts solo
 * lee archivos y escribe el resultado. Regla: nada se inventa; lo que no
 * existe queda null con fuente "no_disponible". El Excel entra siempre con
 * fuente "excel_bluebox".
 */
import type { PortafolioV2, StartupV2, PuntoSerie, DatoNum, FuenteDato, Discrepancia } from "./schemaV2.ts";

type V1 = {
  ultima_actualizacion: string;
  startups: {
    nombre: string; estado: "sano" | "vigilar" | "critico"; sector: string; paises: string[];
    modelo_negocio: string; legal: Record<string, unknown>; financiero: Record<string, unknown>;
    situacion_actual: string; proximos_pasos: string[]; alertas: string[];
  }[];
};
type Seed = Record<string, any>;

export const MESES_TRIM: Record<string, string> = { "1Q": "03", "2Q": "06", "3Q": "09", "4Q": "12" };

/** "4Q 2025" -> "2025-12"; "2026-08" -> "2026-08"; "2025-Q3" -> "2025-09"; "2024" -> "2024-12". */
export function periodoAMes(p: string | null | undefined): string | null {
  if (!p) return null;
  let m = /^([1-4]Q) (\d{4})$/.exec(p);
  if (m) return `${m[2]}-${MESES_TRIM[m[1]]}`;
  m = /^(\d{4})-Q([1-4])$/.exec(p);
  if (m) return `${m[1]}-${MESES_TRIM[`${m[2]}Q`]}`;
  if (/^\d{4}-\d{2}$/.test(p)) return p;
  if (/^\d{4}$/.test(p)) return `${p}-12`;
  return null;
}

/** Fecha estimada (mitad del trimestre) para XIRR cuando solo hay periodo. */
export function fechaDePeriodo(p: string): string {
  const m = /^([1-4])Q (\d{4})$/.exec(p)!;
  return `${m[2]}-${["02", "05", "08", "11"][Number(m[1]) - 1]}-15`;
}

const nd = (): DatoNum => ({ valor: null, fuente: "no_disponible", fecha_dato: null });
const dato = (valor: number | null, fuente: FuenteDato, fecha_dato: string | null, extra: Partial<DatoNum> = {}): DatoNum =>
  valor == null ? nd() : { valor, fuente, fecha_dato, ...extra };

const slug = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Posición según el Excel (Inversion directa, 4Q 2025). Datos que dio el director en el brief, verificables en la hoja. */
const POS: Record<string, {
  hoja: string; tipo: StartupV2["tipo_portafolio"]; vehiculo: "directa" | "spv"; spv?: string; periodo: string;
  monto: number; entrada: number; fmv: number; part: number; part_entrada: number | null;
  base: StartupV2["inversion"]["base_marca"]; base_nota: string; ultima_marca: string | null;
  sector_grupo: string; etapa: string; responsable: string | null; doc: boolean; monto_doc: number | null;
}> = {
  Kigo: { hoja: "Kigo", tipo: "transformacional", vehiculo: "directa", periodo: "1Q 2023", monto: 300000, entrada: 15000000, fmv: 15000000, part: 2.0, part_entrada: 2.0, base: "cap_safe", base_nota: "SAFE a cap de 15M (Excel). Sin ronda con precio; marca sin cambio en 12 trimestres.", ultima_marca: "2023-08-15", sector_grupo: "Smart cities", etapa: "Serie A (SAFE)", responsable: "Andrea", doc: false, monto_doc: null },
  Partrunner: { hoja: "Partrunner", tipo: "adyacente", vehiculo: "directa", periodo: "3Q 2023", monto: 100000, entrada: 10000000, fmv: 10000000, part: 0.85, part_entrada: 1.0, base: "otra", base_nota: "Marca por dilución (1.0% a 0.85%) con valuación sin cambio; una dilución no es una pérdida.", ultima_marca: null, sector_grupo: "Logística", etapa: "Serie A (lanzada may-2025)", responsable: "Alex Gar", doc: true, monto_doc: 100000 },
  Bemycar: { hoja: "Bemycar", tipo: "core", vehiculo: "directa", periodo: "3Q 2023", monto: 16936, entrada: 1376910, fmv: 2600000, part: 1.132678, part_entrada: 1.23, base: "cap_safe", base_nota: "Subida a 2.6M por un SAFE de 205,723 USD a cap de 2.6M (3Q 2025). Un cap de SAFE no es una ronda con precio.", ultima_marca: "2025-08-15", sector_grupo: "SaaS automotriz", etapa: "Seed", responsable: null, doc: false, monto_doc: null },
  Ruedata: { hoja: "Ruedata", tipo: "core", vehiculo: "directa", periodo: "2Q 2024", monto: 50000, entrada: 10152944, fmv: 13165488, part: 0.417656, part_entrada: null, base: "cap_safe", base_nota: "Nota convertible de 2M a cap de 13.17M (2Q 2025). No es ronda con precio.", ultima_marca: "2025-05-15", sector_grupo: "Flotas", etapa: "Seed", responsable: "Alex Gar", doc: false, monto_doc: null },
  Autolab: { hoja: "Autolab", tipo: "adyacente", vehiculo: "directa", periodo: "3Q 2024", monto: 100000, entrada: 9000000, fmv: 12000000, part: 0.99537, part_entrada: 1.1, base: "ronda_pricing", base_nota: "Bridge Serie A a pre-money de 12M (equity directo, 4Q 2025) según Excel; sin documento ni inversionista institucional verificado.", ultima_marca: "2025-11-15", sector_grupo: "Mantenimiento", etapa: "Bridge Serie A", responsable: "Andrea", doc: false, monto_doc: null },
  Drivana: { hoja: "Drivana", tipo: "adyacente", vehiculo: "directa", periodo: "3Q 2025", monto: 50000, entrada: 5000000, fmv: 5000000, part: 1.0, part_entrada: 1.0, base: "a_costo", base_nota: "SAFE a cap de 5M; sin marca posterior.", ultima_marca: null, sector_grupo: "Car sharing", etapa: "Seed (ronda en curso)", responsable: "Luis Ángel", doc: true, monto_doc: 50000 },
  Ualabee: { hoja: "SPV Ualabee", tipo: "transformacional", vehiculo: "spv", spv: "Blue Mobility Ventures", periodo: "3Q 2025", monto: 75035, entrada: 7500000, fmv: 7500000, part: 1.000467, part_entrada: 1.0005, base: "a_costo", base_nota: "SAFE a cap de 7.5M; sin marca posterior.", ultima_marca: null, sector_grupo: "Datos urbanos", etapa: "Seed", responsable: null, doc: false, monto_doc: 80000 },
  Mobi: { hoja: "SPV Mobi", tipo: "adyacente", vehiculo: "spv", spv: "Blue Mobility Ventures", periodo: "3Q 2025", monto: 75005, entrada: 7500000, fmv: 7500000, part: 1.000067, part_entrada: 1.0001, base: "a_costo", base_nota: "Sin marca; solo existe el comprobante de transferencia.", ultima_marca: null, sector_grupo: "Movilidad", etapa: "Seed", responsable: null, doc: false, monto_doc: 75035 },
  "Vera AI": { hoja: "Vera AI", tipo: "core", vehiculo: "directa", periodo: "4Q 2025", monto: 100000, entrada: 6000000, fmv: 6000000, part: 1.666667, part_entrada: 1.67, base: "a_costo", base_nota: "SAFE a cap de 6M; sin marca posterior.", ultima_marca: null, sector_grupo: "Retail-tech", etapa: "Piloto", responsable: null, doc: true, monto_doc: 100000 },
  Leasy: { hoja: "SPV Leasy", tipo: "adyacente", vehiculo: "spv", spv: "Mobility VC", periodo: "4Q 2025", monto: 100000, entrada: 35000000, fmv: 35000000, part: 0.285714, part_entrada: 0.286, base: "a_costo", base_nota: "Entrada a 35M (Excel); el JSON de Cowork dice pre-money 53M (ver D-03).", ultima_marca: null, sector_grupo: "Fintech", etapa: "Serie A", responsable: "Alex Gar", doc: false, monto_doc: 106382.98 },
};

const MONITOREO: Record<string, [boolean, string | null]> = {
  Kigo: [false, "No disponible"], Partrunner: [true, "Actualizado"], Bemycar: [false, null], Ruedata: [true, "Actualizado"],
  Autolab: [false, "Están por enviarlo"], Drivana: [true, "Actualizado"], "Vera AI": [false, null], Leasy: [true, "Actualizado"],
  Ualabee: [true, "Pendiente actualizar"], Mobi: [false, null],
};

const DECISION: Record<string, string> = {
  Ualabee: "Postura del comité ante la crisis de caja (faltan 50,000 USD según el CEO) y la ronda puente.",
  Drivana: "Postura de Huerpel ante la ronda en curso (term sheet pendiente) con el escenario de breakeven a 12-13 meses.",
  Partrunner: "Firma del waiver 2026 que extiende el vencimiento de la nota y elimina el umbral mínimo de conversión.",
  Autolab: "Postura de Huerpel sobre la operación B2C-MX conjunta de Autolab y Call Mecánica.",
};

const RONDAS_EXTRA: Record<string, StartupV2["rondas"]> = {
  Ruedata: [{ nombre: "Nota convertible", fecha: "2Q 2025", monto_usd: 2000000, valuacion_usd: 13165488, instrumento: "Nota convertible", dilucion_pct: null, participo_moov: null, fuente: "excel_bluebox" }],
  Bemycar: [{ nombre: "SAFE", fecha: "3Q 2025", monto_usd: 205723, valuacion_usd: 2600000, instrumento: "SAFE", dilucion_pct: null, participo_moov: null, fuente: "excel_bluebox" }],
};

/** Regla de migración (documentada, con test): la severidad NO viene en v1. */
export function severidadHeuristica(texto: string): "alta" | "media" {
  return /crisis de caja|runway (de solo|pas[oó])|sin ning[uú]n reporte|instrumento (legal |de inversi[oó]n )?no localizado|sin instrumento|contrato legal no localizado/i.test(texto)
    ? "alta"
    : "media";
}

const EUR_USD_ESTIMADO = 1.15;

function punto(base: Partial<PuntoSerie> & { periodo: string }): PuntoSerie {
  return {
    moneda_original: "USD", tipo_cambio_a_usd: null, tipo_cambio_fuente: null, revenue_original: null,
    revenue_usd: nd(), gtv_usd: nd(), gross_profit_usd: nd(), ebitda_usd: nd(), burn_usd: nd(), caja_usd: nd(),
    runway_meses: nd(), clientes: nd(), usuarios_activos: nd(), equipo: nd(), kpis_propios: [], ...base,
  };
}

function serieTrimestral(nombre: string, seed: Seed): PuntoSerie[] {
  if (nombre === "Bemycar") return []; // hoja contaminada (D-06): no se importa su serie
  const t1 = seed._tabla1[POS[nombre].hoja]?.["Revenue trimestral"] ?? {};
  const hoja = seed[nombre];
  const tc: Record<string, number> = seed._tc;
  const out: PuntoSerie[] = [];
  const periodos = Object.keys(t1);
  for (const p of periodos) {
    const enDuda = nombre === "Drivana";
    const rev = t1[p] as number;
    const kigoMxn = nombre === "Kigo" ? hoja.serie["Total Revenue / Ingresos"]?.[p] ?? null : null;
    const gtvRow = hoja.serie["Transaccionado / GTV"]?.[p] ?? null;
    const ebitdaRow = hoja.serie["EBITDA"]?.[p] ?? hoja.serie["EBITDA (Burn)"]?.[p] ?? null;
    const conv = (x: number | null) => (x == null ? null : nombre === "Kigo" ? x / tc[p] : x);
    const extra: Partial<DatoNum> = enDuda
      ? { en_duda: true, nota: `Etiquetado USD en el Excel pero probablemente MXN (D-09). Si fuera MXN: ≈ ${Math.round(rev / tc[p]).toLocaleString("en-US")} USD al TC ${tc[p]}.` }
      : nombre === "Ualabee" || nombre === "Leasy"
        ? { nota: "Unidad y periodo por verificar (D-10, D-11)." }
        : {};
    out.push(punto({
      periodo: p,
      moneda_original: nombre === "Kigo" ? "MXN" : "USD",
      tipo_cambio_a_usd: nombre === "Kigo" ? tc[p] : null,
      tipo_cambio_fuente: nombre === "Kigo" ? "excel_bluebox" : null,
      revenue_original: nombre === "Kigo" ? kigoMxn : rev,
      revenue_usd: dato(rev, "excel_bluebox", periodoAMes(p), { referencia: `Inversion directa, Tabla 1`, ...extra }),
      gtv_usd: dato(conv(gtvRow), "excel_bluebox", periodoAMes(p), nombre === "Drivana" ? { en_duda: true } : {}),
      ebitda_usd: dato(conv(ebitdaRow), "excel_bluebox", periodoAMes(p), nombre === "Drivana" ? { en_duda: true } : {}),
      equipo: dato(hoja.operativas?.["Numero de personas en el equipo Kigo"]?.[p] ?? null, "excel_bluebox", periodoAMes(p)),
    }));
  }
  return out;
}

function serieMensual(nombre: string, v1: V1["startups"][number]): PuntoSerie[] {
  const f = v1.financiero as Record<string, any>;
  const mes = periodoAMes(f.fecha_dato as string);
  if (!mes && !Array.isArray(f.serie_mensual)) return [];
  const ref = "portfolio-data.json (Cowork)";
  // Series capturadas por Cowork en financiero.serie_mensual (opcional): manda sobre los escalares.
  const serie = f.serie_mensual as { periodo: string; moneda?: "USD" | "MXN" | "EUR"; revenue_usd?: number; gtv_usd?: number; ebitda_usd?: number; burn_usd?: number; caja_usd?: number; runway_meses?: number; clientes?: number }[] | undefined;
  if (Array.isArray(serie) && serie.length) {
    return serie.map((x) => punto({
      periodo: x.periodo, moneda_original: x.moneda ?? "USD",
      revenue_usd: dato(x.revenue_usd ?? null, "reporte_startup", x.periodo, { referencia: ref }),
      gtv_usd: dato(x.gtv_usd ?? null, "reporte_startup", x.periodo, { referencia: ref }),
      ebitda_usd: dato(x.ebitda_usd ?? null, "reporte_startup", x.periodo, { referencia: ref }),
      burn_usd: dato(x.burn_usd ?? null, "reporte_startup", x.periodo, { referencia: ref }),
      caja_usd: dato(x.caja_usd ?? null, "reporte_startup", x.periodo, { referencia: ref }),
      runway_meses: dato(x.runway_meses ?? null, "reporte_startup", x.periodo, { referencia: ref }),
      clientes: dato(x.clientes ?? null, "reporte_startup", x.periodo, { referencia: ref }),
    }));
  }
  if (nombre === "Drivana") {
    return [punto({
      periodo: mes!,
      revenue_usd: dato(f.net_revenue_mensual_usd, "reporte_startup", mes, { referencia: ref, nota: "Net revenue mensual." }),
      gtv_usd: dato(f.valor, "reporte_startup", mes, { referencia: ref }),
      ebitda_usd: dato(f.ebitda_mensual_usd, "reporte_startup", mes, { referencia: ref }),
      caja_usd: dato(f.caja_neta_usd, "reporte_startup", mes, { referencia: ref }),
      runway_meses: dato(f.runway_meses, "reporte_startup", mes, { referencia: ref, nota: "Bajó de ~21.8 a ~11 meses en dos meses (D-12)." }),
      kpis_propios: [{ nombre: "Take rate", valor: f.take_rate_pct, unidad: "%" }],
    })];
  }
  if (nombre === "Bemycar") {
    const usd = Math.round((f.valor as number) * EUR_USD_ESTIMADO);
    return [punto({
      periodo: mes!, moneda_original: "EUR", tipo_cambio_a_usd: 1 / EUR_USD_ESTIMADO, tipo_cambio_fuente: "estimado", revenue_original: f.valor,
      revenue_usd: dato(usd, "estimado", mes, { referencia: ref, nota: `MRR usado como proxy de ingreso mensual, convertido a ${EUR_USD_ESTIMADO} USD/EUR (TC estimado).` }),
      kpis_propios: [{ nombre: "MRR (EUR)", valor: f.valor, unidad: "EUR" }],
    })];
  }
  if (nombre === "Ruedata" || nombre === "Ualabee") {
    return [punto({
      periodo: mes!, revenue_original: f.valor,
      revenue_usd: dato(f.valor, "reporte_startup", mes, { referencia: ref, nota: `${f.metrica_principal} usado como proxy de ingreso mensual.` }),
      kpis_propios: [{ nombre: String(f.metrica_principal), valor: f.valor, unidad: "USD" }],
    })];
  }
  if (nombre === "Partrunner") {
    return [punto({ periodo: mes!, gtv_usd: dato(f.valor, "reporte_startup", mes, { referencia: ref, nota: "GMV mensual, 2025-06." }) })];
  }
  return [];
}

export const DISCREPANCIAS: Discrepancia[] = [
  { id: "D-01", startup: null, campo: "Capital desplegado", valor_a: "966,976 USD (directas 716,936 + SPV 250,040)", fuente_a: "Excel Bluebox", valor_b: "511,417.98 USD confirmados con documento", fuente_b: "JSON Cowork", impacto: "Brecha de 455,558 USD: Kigo 300,000 + Autolab 100,000 + Ruedata 50,000 + Bemycar 16,936 = 466,936 sin monto confirmado, menos diferencias en 3 SPV.", afecta: "monto", material: true, estado: "abierta", accion: "Localizar contratos y comprobantes de Kigo, Autolab, Ruedata y Bemycar." },
  { id: "D-02", startup: null, campo: "Montos de los 3 SPV", valor_a: "Ualabee 80,000 · Mobi 75,035 · Leasy 106,382.98", fuente_a: "JSON Cowork (comprobantes)", valor_b: "Ualabee 75,035 · Mobi 75,005 · Leasy 100,000", fuente_b: "Excel Bluebox", impacto: "El monto de Mobi en el JSON es igual al de Ualabee en el Excel: posible cruce. Las diferencias podrían ser fees de SPV (Leasy 6,000, Ualabee 4,500, Mobi 7,000) pero no coinciden exacto.", afecta: "monto", material: true, estado: "abierta", accion: "Verificar contra los comprobantes de transferencia." },
  { id: "D-03", startup: "Leasy", campo: "Valuación de entrada", valor_a: "Pre-money 53,000,000 con 20% de descuento exclusivo del SPV", fuente_a: "JSON Cowork", valor_b: "35,000,000", fuente_b: "Excel Bluebox", impacto: "Cambia la participación implícita (0.286% en el Excel) y el valor de la posición.", afecta: "valuacion", material: true, estado: "abierta", accion: "Verificar contra el documento del SPV." },
  { id: "D-04", startup: "Autolab", campo: "Ronda y monto de la posición", valor_a: "Ronda cerrada de 900K USD (ago 2026) y nota convertible de 600 a 700K (jul 2025); instrumento de MOOV no localizado", fuente_a: "JSON Cowork", valor_b: "Bridge Serie A 1.25M (950K nuevos + 300K de SAFE previo) a pre-money 12M; Serie A previa: nota convertible 1.5M a cap 16M (4Q 2024); MOOV 100,000 USD entrada a 9M", fuente_b: "Excel Bluebox", impacto: "La marca de 12M (MOIC 1.19x) depende de cuál ronda es la vigente y de que el instrumento exista.", afecta: "valuacion", material: true, estado: "abierta", accion: "Confirmar con Chava si son la misma ronda y localizar el instrumento." },
  { id: "D-05", startup: "Bemycar", campo: "Marca y monto invertido", valor_a: "Marca a 2.6M (MOIC 1.74x) y participación 1.13%", fuente_a: "Excel Bluebox (SAFE 205,723 a cap 2.6M)", valor_b: "Monto invertido no confirmado; segunda ronda de 355,738 EUR (jul 2025)", fuente_b: "JSON Cowork", impacto: "Un cap de SAFE no es ronda con precio: el MOIC depende de ello. No está claro si la ronda en EUR y el SAFE son lo mismo.", afecta: "valuacion", material: true, estado: "abierta", accion: "Verificar si es la misma ronda y con qué valuación." },
  { id: "D-06", startup: "Bemycar", campo: "Hoja contaminada en el Excel", valor_a: "Segmento last mile, KPIs de rutas y highlights de Partrunner (Decathlon, Flekk); revenue 4Q25 = 22,223 (conteo de rutas)", fuente_a: "Excel Bluebox", valor_b: "SaaS B2B automotriz con MRR en EUR; revenue 203,485.69 USD en la tabla resumen", fuente_b: "JSON Cowork / Excel (tabla resumen)", impacto: "El revenue agregado de 5.33M del Excel incluye ese 22,223: sin él el agregado es 5.52M. No se importó la serie ni los highlights de Bemycar.", afecta: "revenue", material: true, estado: "abierta", accion: "Pedir a Bemycar su reporte trimestral y reconstruir la hoja." },
  { id: "D-07", startup: "Partrunner", campo: "Marca a la baja", valor_a: "MOIC 0.85x por dilución (1.0% a 0.85%) con valuación sin cambio en 10M", fuente_a: "Excel Bluebox", valor_b: "Serie A lanzada en mayo 2025", fuente_b: "JSON Cowork", impacto: "Diluirse en una ronda suele venir con valuación mayor: 0.85x probablemente subestima.", afecta: "valuacion", material: true, estado: "abierta", accion: "Obtener valuación y resultado de la Serie A." },
  { id: "D-08", startup: "Kigo", campo: "Marca sin cambio e instrumento", valor_a: "Marca fija en 15M por 12 trimestres con revenue de 1.63M a 2.54M USD trimestrales", fuente_a: "Excel Bluebox", valor_b: "Instrumento y monto no localizados; ronda de 30M MXN en 2023", fuente_b: "JSON Cowork", impacto: "Marca posiblemente rezagada; falta confirmar entidad (Cargo Móvil S.A. de C.V. o Kigo Holdings LLC).", afecta: "monto", material: true, estado: "abierta", accion: "Localizar el instrumento y confirmar la entidad." },
  { id: "D-09", startup: "Drivana", campo: "Moneda del revenue", valor_a: "770,399 en 4Q 2025 etiquetado USD (+111.7% QoQ)", fuente_a: "Excel Bluebox", valor_b: "Cifras históricas estaban en MXN etiquetadas como USD; net revenue mensual 21,767 USD (ago 2026)", fuente_b: "JSON Cowork", impacto: "Si es MXN el QoQ cambia de significado. Los datos de Drivana del Excel se excluyen de agregados hasta verificar.", afecta: "revenue", material: false, estado: "abierta", accion: "Verificar y convertir." },
  { id: "D-10", startup: "Ualabee", campo: "Consistencia de ingresos", valor_a: "Revenue 4Q 2025 = 170,165 (~57K/mes)", fuente_a: "Excel Bluebox", valor_b: "MRR de 35,000 USD (may 2026); descuento SAFE de 80% por verificar", fuente_b: "JSON Cowork", impacto: "Puede ser ingreso no recurrente.", afecta: "revenue", material: false, estado: "abierta", accion: "Verificar y revisar el SAFE original." },
  { id: "D-11", startup: "Leasy", campo: "Escala de ingresos", valor_a: "Revenue 4Q 2025 = 319,267", fuente_a: "Excel Bluebox", valor_b: "ARR 9.4M USD (2024); margen neto 2024 con dos versiones (8.7% y 20%)", fuente_b: "JSON Cowork", impacto: "Si son trimestrales no cuadran (9.4M/4 ≈ 2.35M por trimestre).", afecta: "revenue", material: false, estado: "abierta", accion: "Verificar unidad y periodo." },
  { id: "D-12", startup: "Drivana", campo: "Caja y runway", valor_a: "Runway de ~21.8 a ~11 meses en dos meses", fuente_a: "JSON Cowork (jun vs ago 2026)", valor_b: "Quema implícita de 22.5K/mes vs EBITDA de -11.5K/mes", fuente_b: "JSON Cowork", impacto: "Parte por corrección de unidades; la quema implícita no está explicada.", afecta: "estado", material: false, estado: "abierta", accion: "Pedir a Edson el flujo de efectivo y la conciliación EBITDA-caja." },
  { id: "D-13", startup: null, campo: "Frescura del dato", valor_a: "Partrunner y Vera AI: dato financiero 2025-06 en el JSON", fuente_a: "JSON Cowork", valor_b: "Excel llega a 4Q 2025", fuente_b: "Excel Bluebox", impacto: "Se usa el más reciente y se etiqueta su fuente.", afecta: "calidad", material: false, estado: "abierta", accion: "Pedir el reporte más reciente." },
  { id: "D-14", startup: null, campo: "Errores del Excel", valor_a: "#DIV/0! en 1Q y 2Q 2026 y columnas de Ualabee; 'Fair market value acumulado' (113.8M) sin significado", fuente_a: "Excel Bluebox", valor_b: "—", fuente_b: "—", impacto: "No se replican en el dashboard. Además el dry powder del Excel se contradice: 33,024 (fila 80) vs 15,524 (C19), y su TVPI usa (NAV - gastos) / capital = 1.0046 en lugar de NAV / (capital + gastos) = 1.0045.", afecta: "calidad", material: false, estado: "abierta", accion: "Ninguna: se documentan." },
];

export function pipelineDesde(ops: { startups?: { startup: string; estado: string }[] } | null): PortafolioV2["pipeline"] {
  const out: PortafolioV2["pipeline"] = [];
  for (const o of ops?.startups ?? []) {
    if (/research_inicial/.test(o.estado)) out.push({ startup: o.startup, etapa: "first_assessment", estado_origen: o.estado });
    else if (/en_analisis/.test(o.estado)) out.push({ startup: o.startup, etapa: "analisis", estado_origen: o.estado });
  }
  return out;
}

export function migrar(v1: V1, seed: Seed, oportunidades: Parameters<typeof pipelineDesde>[0] = null): PortafolioV2 {
  const startups: StartupV2[] = v1.startups.map((s) => {
    const n = s.nombre;
    const pos = POS[n];
    if (!pos) throw new Error(`Startup fuera de la lista de 10: ${n}`);
    const hoja = seed[n];
    const info = hoja?.info ?? {};
    const contaminada = n === "Bemycar";
    const legal = s.legal as Record<string, any>;
    const f = s.financiero as Record<string, any>;
    const exc = (v: number | null) => dato(v, "excel_bluebox", "2025-12", { referencia: `Inversion directa (${pos.hoja})` });
    const mesV1 = periodoAMes(f.fecha_dato as string);
    const mesExcel = n === "Mobi" ? null : periodoAMes(info["Último periodo reportado"] as string);
    const ultimo = [mesV1, mesExcel].filter(Boolean).sort().pop() ?? null;
    const crisis = /crisis de caja/i.test(s.situacion_actual) || s.alertas.some((a) => /crisis de caja/i.test(a));
    const mensual = serieMensual(n, v1.startups.find((x) => x.nombre === n)!);
    const trimestral = serieTrimestral(n, seed);
    const contexto: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(f)) if (!["metrica_principal", "valor", "moneda", "fecha_dato", "tendencia", "serie_mensual"].includes(k)) contexto[k] = v;
    const rondas: StartupV2["rondas"] = [
      ...(hoja?.rondas ?? []).map((r: any[]) => ({
        nombre: String(r[0]), fecha: r[4] ?? null, monto_usd: typeof r[1] === "number" ? r[1] : null, valuacion_usd: typeof r[2] === "number" ? r[2] : null,
        instrumento: r[3] ?? null, dilucion_pct: typeof r[5] === "number" ? Math.round(r[5] * 1000) / 10 : null, participo_moov: null, fuente: "excel_bluebox" as const,
      })),
      ...(RONDAS_EXTRA[n] ?? []),
    ];
    const documentoLocalizado = pos.doc;
    return {
      id: slug(n), nombre: n, sector_grupo: pos.sector_grupo, estado_asignado: s.estado, override_estado: null,
      sector: s.sector, subsegmento: contaminada ? null : ((info["Segmento:"] as string) ?? null),
      paises: s.paises, hq: (info["HQ:"] as string) ?? null, modelo_negocio: s.modelo_negocio, etapa: pos.etapa,
      tipo_portafolio: pos.tipo, vehiculo: pos.vehiculo, spv_nombre: pos.spv ?? null,
      responsable_moov: pos.responsable, relacion_con_grupo: contaminada ? null : (typeof info["Tipo de relación:"] === "string" && info["Tipo de relación:"] !== "-" ? info["Tipo de relación:"] : null),
      parent_engagement: n === "Mobi" ? null : false,
      crisis_caja_reportada: crisis,
      inversion: {
        fecha: (legal.fecha_inversion as string) ?? null, periodo: pos.periodo, instrumento: (legal.instrumento as string) ?? null, entidad: (legal.entidad as string) ?? null,
        monto_usd: exc(pos.monto), monto_documento_usd: legal.monto_usd ?? null,
        monto_comprometido_usd: exc(0), valuacion_entrada_usd: exc(pos.entrada),
        tipo_valuacion: legal.cap_usd != null ? "cap" : legal.pre_money_usd != null ? "pre_money" : null,
        descuento_pct: nd(), participacion_entrada_pct: pos.part_entrada == null ? nd() : exc(pos.part_entrada),
        valuacion_actual_usd: exc(pos.fmv), participacion_actual_pct: exc(pos.part),
        base_marca: pos.base, base_marca_nota: pos.base_nota, fecha_ultima_marca: pos.ultima_marca, documento_localizado: documentoLocalizado,
      },
      rondas, serie_trimestral: trimestral, serie_mensual: mensual,
      kpi_principal: { nombre: (f.metrica_principal as string) ?? null, valor: (f.valor as number) ?? null, moneda: (f.moneda as string) ?? null, fecha_dato: (f.fecha_dato as string) ?? null, definicion: null },
      reporte: {
        ultimo_periodo_reportado: ultimo,
        frecuencia: mensual.length ? "mensual" : trimestral.length ? "trimestral" : "ninguna",
        al_corriente: MONITOREO[n][0], nota_monitoring: MONITOREO[n][1],
      },
      highlights: contaminada ? [] : (hoja?.highlights ?? []).filter((h: string) => h.length > 3 && !/^Highlights/.test(h)).map((h: string) => h.replace(/^-\s*/, "")),
      situacion_actual: s.situacion_actual, tendencia: (f.tendencia as string) ?? "",
      alertas: s.alertas.map((texto) => ({ texto, severidad: severidadHeuristica(texto), severidad_revisada: false, fecha: v1.ultima_actualizacion })),
      proximos_pasos: s.proximos_pasos.map((texto) => ({ texto, responsable: null })),
      decision_pendiente: DECISION[n] ?? null,
      notas_legales: (legal.notas as string) ?? "", contexto_v1: contexto,
    };
  });
  const hist = seed._fondo_trimestral;
  const neg = (r: Record<string, number>) => Object.fromEntries(Object.entries(r).map(([k, x]) => [k, Math.abs(x)]));
  return {
    schema_version: 2,
    generado_de: { v1_actualizacion: v1.ultima_actualizacion, excel_periodo: "4Q 2025" },
    parametros: {
      nombre: "MOOV", entidad: "Grupo Huerpel", tamano_usd: 1_000_000, vintage: 2023, gastos_salen_del_fondo: true,
      gastos_inversion: [
        { concepto: "Fee SPV Leasy - Mobility VC", monto_usd: 6000, periodo: "1Q 2025", tag: "SPV Fee" },
        { concepto: "Fee SPV Ualabee - Mobility VC", monto_usd: 4500, periodo: "3Q 2025", tag: "SPV Fee" },
        { concepto: "Fee SPV Mobi - Mobility VC", monto_usd: 7000, periodo: "3Q 2025", tag: "SPV Fee" },
      ],
      reservas_followon_usd: null, tipo_cambio_trimestral: seed._tc, tipo_cambio_eur_usd_estimado: EUR_USD_ESTIMADO,
      objetivos_construccion: { core: 3, adyacente: 5, transformacional: 2, graduation_rate: 0.2, parent_engagement: 0.4, son_objetivos: false },
      politica_valuacion: "Marcar a costo por defecto. Subir solo con una ronda con precio y con participación de un inversionista institucional nuevo. Un cap de SAFE no es una ronda con precio. Una dilución no es una pérdida. Marcar a la baja ante crisis de caja, sin runway o sin reportes.",
      fecha_corte_excel: "2025-12-31", fecha_corte_vista: v1.ultima_actualizacion.slice(0, 7),
      historico_excel: { tvpi: hist["TVPI"], irr_anualizada: hist["TIR Anualizada"], nav: hist["Equity Share Value"], capital: neg(hist["Total invertido"]), gastos_acumulados: hist["Gastos acumulados"] },
      ultima_actualizacion: v1.ultima_actualizacion,
    },
    startups,
    discrepancias: DISCREPANCIAS,
    pipeline: pipelineDesde(oportunidades),
  };
}
