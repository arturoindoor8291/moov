import { describe, expect, it } from "vitest";
import {
  capitalDesplegado, concentracion, dpi, dryPowder, mesesDesdeDato, moicBruto,
  moicPosicion, nav, rvpi, semaforoFrescura, topN, tvpi, xirr, type PosicionCalculo,
} from "./calculos";

// Semilla del Excel de Bluebox al 4Q 2025 (fuente excel_bluebox).
const excel: PosicionCalculo[] = [
  { nombre: "Kigo", monto_usd: 300000, valor_posicion_usd: 300000 },
  { nombre: "Partrunner", monto_usd: 100000, valor_posicion_usd: 85000 },
  { nombre: "Bemycar", monto_usd: 16936, valor_posicion_usd: 29450 },
  { nombre: "Ruedata", monto_usd: 50000, valor_posicion_usd: 54986 },
  { nombre: "Autolab", monto_usd: 100000, valor_posicion_usd: 119444 },
  { nombre: "Drivana", monto_usd: 50000, valor_posicion_usd: 50000 },
  { nombre: "Ualabee", monto_usd: 75035, valor_posicion_usd: 75035 },
  { nombre: "Mobi", monto_usd: 75005, valor_posicion_usd: 75005 },
  { nombre: "Vera AI", monto_usd: 100000, valor_posicion_usd: 100000 },
  { nombre: "Leasy", monto_usd: 100000, valor_posicion_usd: 100000 },
];
const params = { tamano_fondo_usd: 1_000_000, gastos_usd: 17500, distribuciones_usd: 0, gastos_salen_del_fondo: true };

describe("reproduce el Excel al 4Q 2025", () => {
  it("capital desplegado 966,976", () => expect(capitalDesplegado(excel)).toBe(966976));
  it("NAV ~988,920.5 (el Excel usa participaciones sin redondear)", () =>
    expect(Math.abs(nav(excel) - 988920.5)).toBeLessThan(1));
  it("MOIC bruto ~1.0227", () => expect(moicBruto(excel)!).toBeCloseTo(1.0227, 3));
  it("TVPI ~1.0046", () => expect(tvpi(excel, params)!).toBeCloseTo(1.0046, 3));
  it("DPI 0 y RVPI = TVPI sin distribuciones", () => {
    expect(dpi(excel, params)).toBe(0);
    expect(rvpi(excel, params)!).toBeCloseTo(tvpi(excel, params)!, 10);
  });
  it("dry powder: 33,024 sin fees (Excel fila 80) y 15,524 con fees (Excel C19)", () => {
    expect(dryPowder(excel, { ...params, gastos_salen_del_fondo: false })).toBe(33024);
    expect(dryPowder(excel, params)).toBe(15524);
  });
  it("MOIC por posición: Partrunner 0.85x, Bemycar ~1.74x", () => {
    expect(moicPosicion(excel[1])).toBeCloseTo(0.85, 2);
    expect(moicPosicion(excel[2])!).toBeCloseTo(1.74, 2);
  });
  it("concentración: Kigo 31.0%, top 3 ~", () => {
    const c = concentracion(excel);
    expect(c[0].nombre).toBe("Kigo");
    expect(c[0].pct).toBeCloseTo(31.02, 1);
    expect(topN(excel, 1)).toBeCloseTo(c[0].pct, 10);
  });
});

describe("posiciones sin dato no cuentan como cero", () => {
  it("moic null si falta valor", () =>
    expect(moicPosicion({ nombre: "X", monto_usd: 100, valor_posicion_usd: null })).toBeNull());
});

describe("xirr", () => {
  it("1 año, +10%", () =>
    expect(xirr([{ fecha: "2024-01-01", monto_usd: -100 }, { fecha: "2025-01-01", monto_usd: 110 }])!).toBeCloseTo(0.1, 2));
  it("null sin cambio de signo", () => expect(xirr([{ fecha: "2024-01-01", monto_usd: -100 }])).toBeNull());
});

describe("frescura", () => {
  it("meses y semáforo", () => {
    expect(mesesDesdeDato("2026-06", "2026-09")).toBe(3);
    expect(semaforoFrescura(3)).toBe("verde");
    expect(semaforoFrescura(4)).toBe("amarillo");
    expect(semaforoFrescura(7)).toBe("rojo");
    expect(semaforoFrescura(mesesDesdeDato(null, "2026-09"))).toBe("sin_dato");
  });
});
