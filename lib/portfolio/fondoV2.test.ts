import { describe, expect, it } from "vitest";
import raw from "./portfolio-v2.json";
import { PortafolioV2Schema } from "./schemaV2";
import { calcularFondo, categoriaInstrumento, completitud, crecimientoQoQ, estadoSugerido, lecturaComite, revenueAgregado } from "./fondoV2";
import { migrar, periodoAMes, severidadHeuristica } from "./migracion";
import { readFileSync } from "node:fs";

const data = PortafolioV2Schema.parse(raw);
const get = (n: string) => data.startups.find((s) => s.nombre === n)!;

describe("lente A valor justo reproduce el Excel al 4Q 2025", () => {
  const f = calcularFondo(data, "valor_justo");
  it("capital, NAV, MOIC, TVPI", () => {
    expect(f.capital).toBe(966976);
    expect(f.nav).toBeCloseTo(988920.52, 0);
    expect(f.moicBruto!).toBeCloseTo(1.0227, 4);
    // Definición estándar: NAV / (capital + gastos) = 1.0045.
    expect(f.tvpi!).toBeCloseTo(1.0045, 4);
    // El Excel usa (NAV - gastos) / capital = 1.0046; la diferencia (0.0001) es solo de fórmula.
    expect((f.nav - f.gastos) / f.capital).toBeCloseTo(1.0046, 4);
    expect(f.gananciaTotal).toBeCloseTo(21944.52, 0);
  });
  it("dry powder 15,524 (fees salen del fondo)", () => expect(f.dryPowder).toBe(15524));
  it("ganancia sale de Autolab, Bemycar, Ruedata menos Partrunner", () => {
    const d = Object.fromEntries(f.pos.map((p) => [p.nombre, Math.round(p.delta)]));
    expect(d).toMatchObject({ Autolab: 19444, Bemycar: 12514, Ruedata: 4986, Partrunner: -15000 });
  });
  it("solo 3 posiciones con ganancia; el resto es 0 exacto (sin ruido decimal)", () => {
    expect(f.pos.filter((p) => p.delta > 0).map((p) => p.nombre).sort()).toEqual(["Autolab", "Bemycar", "Ruedata"]);
    expect(f.pos.filter((p) => p.delta === 0).length).toBe(6);
  });
  it("concentración: Kigo 31.0%", () => expect(f.top1.nombre).toBe("Kigo"));
  it("IRR con fechas reales es un número razonable (no se fuerza a 1.6%)", () => {
    expect(f.irr).not.toBeNull();
    expect(Math.abs(f.irr!)).toBeLessThan(0.15);
  });
});

describe("lente A costo (solo documento)", () => {
  const f = calcularFondo(data, "costo");
  it("511,417.98 confirmado con documento", () => expect(f.capital).toBeCloseTo(511417.98, 2));
  it("MOIC a costo 1.0x", () => expect(f.moicBruto).toBe(1));
  it("la brecha contra el Excel es 455,558", () => {
    const j = calcularFondo(data, "valor_justo");
    expect(j.capital - f.capital).toBeCloseTo(455558.02, 1);
  });
  it("brecha explicada por startup: Kigo 300,000, Autolab 100,000, Ruedata 50,000, Bemycar 16,936", () => {
    const b = Object.fromEntries(f.brecha.map((x) => [x.nombre, x.diferencia]));
    expect(b).toMatchObject({ Kigo: 300000, Autolab: 100000, Ruedata: 50000, Bemycar: 16936 });
  });
});

describe("revenue agregado", () => {
  it("excluye Drivana (en duda) y Bemycar (hoja contaminada)", () => {
    const r = revenueAgregado(data.startups).find((x) => x.periodo === "4Q 2025")!;
    expect(r.por.Drivana).toBeUndefined();
    expect(r.por.Bemycar).toBeUndefined();
    expect(r.por.Kigo).toBeCloseTo(2537798.7, 0);
  });
  it("QoQ de Kigo 4Q 2025 = +20.1%", () => expect(crecimientoQoQ(get("Kigo"))!.pct).toBeCloseTo(20.12, 1));
  it("Drivana no tiene QoQ hasta verificar unidad", () => expect(crecimientoQoQ(get("Drivana"))).toBeNull());
});

describe("semáforo sugerido", () => {
  const sug = (n: string) => estadoSugerido(get(n), data.discrepancias, data.parametros.fecha_corte_vista);
  it("Ualabee crítico por crisis de caja", () => expect(sug("Ualabee").valor).toBe("critico"));
  it("Mobi crítico: sin contrato ni reportes", () => expect(sug("Mobi").valor).toBe("critico"));
  it("Kigo vigilar: dato de más de 6 meses y discrepancia material", () => {
    const s = sug("Kigo");
    expect(s.valor).toBe("vigilar");
    expect(s.razones.some((r) => /más de 6/.test(r))).toBe(true);
  });
  it("toda razón es un texto legible", () => data.startups.forEach((s) => expect(sug(s.nombre).razones.length).toBeGreaterThan(0)));
});

describe("serie mensual capturada por Cowork", () => {
  it("financiero.serie_mensual entra al v2 con fuente reporte_startup y mejora la completitud", () => {
    const v1 = JSON.parse(readFileSync(new URL("./portfolio-data.json", import.meta.url), "utf8"));
    const seed = JSON.parse(readFileSync(new URL("./excel-bluebox-seed.json", import.meta.url), "utf8"));
    v1.startups.find((s: { nombre: string }) => s.nombre === "Mobi").financiero.serie_mensual = [{ periodo: "2026-08", revenue_usd: 10000, caja_usd: 50000, runway_meses: 8 }];
    const mobi = PortafolioV2Schema.parse(migrar(v1, seed)).startups.find((s) => s.nombre === "Mobi")!;
    expect(mobi.serie_mensual[0].revenue_usd).toMatchObject({ valor: 10000, fuente: "reporte_startup" });
    expect(completitud(mobi).pct).toBeGreaterThan(completitud(get("Mobi")).pct);
  });
});

describe("completitud, migración y lectura", () => {
  it("Mobi es la menos completa", () => {
    const c = data.startups.map((s) => [s.nombre, completitud(s).pct] as const).sort((a, b) => a[1] - b[1]);
    expect(c[0][0]).toBe("Mobi");
  });
  it("periodoAMes", () => {
    expect(periodoAMes("4Q 2025")).toBe("2025-12");
    expect(periodoAMes("2025-Q3")).toBe("2025-09");
    expect(periodoAMes("2024")).toBe("2024-12");
  });
  it("severidad heurística", () => {
    expect(severidadHeuristica("Crisis de caja activa desde junio 2026")).toBe("alta");
    expect(severidadHeuristica("Descuento del SAFE requiere verificación")).toBe("media");
  });
  it("categoría de instrumento", () => {
    expect(categoriaInstrumento(null)).toBe("No confirmado");
    expect(categoriaInstrumento("SAFE (ronda Seed 2024)")).toBe("SAFE");
    expect(categoriaInstrumento("Convertible Promissory Note")).toBe("Nota convertible");
  });
  it("lectura del comité: máximo 5 frases, menciona concentración de Kigo", () => {
    const l = lecturaComite(data, calcularFondo(data, "valor_justo"));
    expect(l.length).toBeLessThanOrEqual(5);
    expect(l.join(" ")).toMatch(/Kigo concentra 31\.0%/);
  });
  it("solo las 10 startups válidas", () =>
    expect(data.startups.map((s) => s.nombre).sort()).toEqual(["Autolab", "Bemycar", "Drivana", "Kigo", "Leasy", "Mobi", "Partrunner", "Ruedata", "Ualabee", "Vera AI"]));
});
