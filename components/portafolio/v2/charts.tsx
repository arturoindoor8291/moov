import type { CSSProperties } from "react";
import { usdK, pct1, mult } from "@/lib/portfolio/formatV2";
import { C, CAT } from "./ui";

const AX = "rgba(238,241,246,0.5)";
const GRID = "rgba(255,255,255,0.07)";

/** Curva del fondo: capital desplegado (escalón), NAV (línea) y TVPI (eje derecho). */
export function EvolucionFondo({ capital, nav, tvpi, irr }: { capital: Record<string, number>; nav: Record<string, number>; tvpi: Record<string, number>; irr: Record<string, number> }) {
  const ps = Object.keys(capital);
  const W = 900, H = 280, L = 64, R = 48, T = 16, B = 34;
  const maxY = Math.max(...Object.values(capital), ...Object.values(nav)) * 1.1;
  const tv = Object.values(tvpi);
  const tMin = Math.min(0.94, ...tv) - 0.005, tMax = Math.max(1.03, ...tv) + 0.005;
  const x = (i: number) => L + (i / (ps.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - v / maxY) * (H - T - B);
  const yt = (v: number) => T + (1 - (v - tMin) / (tMax - tMin)) * (H - T - B);
  const step = ps.map((p, i) => (i ? `H${x(i)} V${y(capital[p])}` : `M${x(i)} ${y(capital[p])}`)).join(" ");
  const nl = ps.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(nav[p])}`).join(" ");
  const tl = ps.filter((p) => tvpi[p] != null).map((p, i) => `${i ? "L" : "M"}${x(ps.indexOf(p))} ${yt(tvpi[p])}`).join(" ");
  const inv = ps.filter((p, i) => i === 0 || capital[p] !== capital[ps[i - 1]]);
  const resumen = `Capital desplegado de ${usdK(capital[ps[0]])} en ${ps[0]} a ${usdK(capital[ps.at(-1)!])} en ${ps.at(-1)}. Valor del portafolio (NAV) ${usdK(nav[ps.at(-1)!])}. TVPI de ${mult(tvpi[ps.at(-1)!])} al cierre. Trimestres con inversión: ${inv.join(", ")}.`;
  const irrs = ps.filter((p) => irr[p] != null);
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resumen} style={{ width: "100%", height: "auto", display: "block" }}>
        <title>Evolución del fondo por trimestre</title>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}><line x1={L} x2={W - R} y1={y(maxY * f / 1.1)} y2={y(maxY * f / 1.1)} stroke={GRID} /><text x={L - 8} y={y(maxY * f / 1.1) + 4} fill={AX} fontSize="11" textAnchor="end">{usdK(maxY * f / 1.1)}</text></g>
        ))}
        {inv.map((p) => <line key={p} x1={x(ps.indexOf(p))} x2={x(ps.indexOf(p))} y1={T} y2={H - B} stroke="rgba(57,135,229,0.25)" strokeDasharray="3 3" />)}
        <path d={step} fill="none" stroke={C.gris} strokeWidth="2" />
        <path d={nl} fill="none" stroke={C.azul} strokeWidth="2.5" />
        <path d={tl} fill="none" stroke={C.vigilar} strokeWidth="1.5" strokeDasharray="5 3" />
        {ps.map((p, i) => (i % 2 === 0 || i === ps.length - 1) && <text key={p} x={x(i)} y={H - 12} fill={AX} fontSize="11" textAnchor="middle">{p}</text>)}
        <text x={W - R + 6} y={yt(tvpi[ps.at(-1)!]) + 4} fill={C.vigilar} fontSize="11">{mult(tvpi[ps.at(-1)!])}</text>
        <text x={x(ps.length - 1) - 6} y={y(nav[ps.at(-1)!]) - 10} fill={C.azul} fontSize="11" textAnchor="end">NAV {usdK(nav[ps.at(-1)!])}</text>
        <text x={x(2)} y={y(capital[ps[2]]) + 16} fill={C.gris} fontSize="11">Capital desplegado</text>
        <text x={W - R + 6} y={T + 8} fill={C.vigilar} fontSize="10">TVPI</text>
      </svg>
      <figcaption style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
        Línea azul: valor del portafolio (NAV). Gris escalonada: capital desplegado. Amarilla punteada: TVPI (eje derecho). Líneas verticales: trimestres con inversión. Curva J: un valor por debajo del capital al inicio (TVPI menor a 1.00x) es normal en los primeros años.
      </figcaption>
      <div style={{ marginTop: 14 }} aria-label="IRR no realizada anualizada por trimestre">
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>IRR no realizada anualizada por trimestre (Excel del gestor anterior; con marcas casi sin movimiento no es una señal fuerte)</div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${irrs.length}, minmax(0,1fr))`, gap: 4 }}>
          {irrs.map((p) => (
            <div key={p} style={{ textAlign: "center", fontSize: 11 }}>
              <div style={{ color: irr[p] >= 0 ? C.sano : C.critico, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{pct1(irr[p] * 100)}</div>
              <div style={{ color: C.tenue }}>{p.replace(" 20", " '")}</div>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}

/** Barra apilada de una sola fila con etiquetas directas. */
export function BarraApilada({ items, alerta }: { items: { nombre: string; pct: number }[]; alerta?: number }) {
  return (
    <div>
      <div role="img" aria-label={`Concentración: ${items.slice(0, 3).map((i) => `${i.nombre} ${pct1(i.pct)}`).join(", ")}`} style={{ display: "flex", height: 26, borderRadius: 6, overflow: "hidden", gap: 1 }}>
        {items.map((i, k) => <div key={i.nombre} title={`${i.nombre}: ${pct1(i.pct)}`} style={{ width: `${i.pct}%`, background: k === 0 ? C.azul : `rgba(139,147,163,${Math.max(0.25, 0.75 - k * 0.07)})` }} />)}
      </div>
      <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 12 }}>
        {items.map((i) => {
          const sobre = alerta != null && i.pct > alerta;
          return <li key={i.nombre} style={{ color: sobre ? C.vigilar : C.muted }}>{sobre ? "▲ " : ""}<strong style={{ color: sobre ? C.vigilar : C.text }}>{i.nombre}</strong> {pct1(i.pct)}</li>;
        })}
      </ul>
      {alerta != null && items[0] && items[0].pct > alerta && <p style={{ fontSize: 12, color: C.vigilar, margin: "8px 0 0" }}>▲ {items[0].nombre} pasa del {alerta}% del capital desplegado.</p>}
    </div>
  );
}

/** Mini gráfica de barras horizontales: etiqueta, barra, capital y número de empresas. */
export function BarrasH({ titulo, filas, total }: { titulo: string; filas: { clave: string; capital: number; n: number }[]; total: number }) {
  const max = Math.max(...filas.map((f) => f.capital), 1);
  return (
    <div>
      <h3 style={{ fontSize: 13, margin: "0 0 10px", color: C.muted, fontWeight: 600 }}>{titulo}</h3>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7 }}>
        {filas.map((f, i) => (
          <li key={f.clave} style={{ display: "grid", gridTemplateColumns: "minmax(70px,110px) 1fr auto", gap: 8, alignItems: "center", fontSize: 12 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.clave}>{f.clave}</span>
            <span style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 10 }}>
              <span style={{ display: "block", width: `${(f.capital / max) * 100}%`, height: 10, borderRadius: 4, background: CAT[i % CAT.length] }} />
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: C.muted, whiteSpace: "nowrap" }}>{usdK(f.capital)} · {pct1((f.capital / total) * 100)} · {f.n} emp.</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Revenue trimestral apilado por startup; la de mayor peso se destaca, el resto en grises. */
export function RevenueApilado({ datos, nombres }: { datos: { periodo: string; total: number; por: Record<string, number> }[]; nombres: string[] }) {
  const W = 900, H = 260, L = 64, T = 14, B = 30;
  const max = Math.max(...datos.map((d) => d.total)) * 1.1;
  const bw = ((W - L - 10) / datos.length) * 0.6;
  const destacada = nombres.reduce((a, n) => (datos.at(-1)!.por[n] ?? 0) > (datos.at(-1)!.por[a] ?? 0) ? n : a, nombres[0]);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Revenue trimestral agregado de ${usdK(datos[0].total)} en ${datos[0].periodo} a ${usdK(datos.at(-1)!.total)} en ${datos.at(-1)!.periodo}. ${destacada} es la de mayor peso.`} style={{ width: "100%", height: "auto" }}>
      <title>Revenue trimestral agregado (USD)</title>
      {[0, 0.5, 1].map((f) => <g key={f}><line x1={L} x2={W - 10} y1={y((max / 1.1) * f)} y2={y((max / 1.1) * f)} stroke={GRID} /><text x={L - 8} y={y((max / 1.1) * f) + 4} fill={AX} fontSize="11" textAnchor="end">{usdK((max / 1.1) * f)}</text></g>)}
      {datos.map((d, i) => {
        const cx = L + ((i + 0.5) / datos.length) * (W - L - 10);
        let acum = 0;
        return (
          <g key={d.periodo}>
            {nombres.map((n, k) => {
              const v = d.por[n]; if (!v) return null;
              const y0 = y(acum + v), h = y(acum) - y0; acum += v;
              return <rect key={n} x={cx - bw / 2} y={y0} width={bw} height={Math.max(h - 0.5, 0)} fill={n === destacada ? C.azul : `rgba(139,147,163,${k % 2 ? 0.4 : 0.6})`}><title>{`${n} ${d.periodo}: ${usdK(v)}`}</title></rect>;
            })}
            <text x={cx} y={y(d.total) - 5} fill={C.text} fontSize="10" textAnchor="middle">{usdK(d.total)}</text>
            {(i % 2 === 0 || i === datos.length - 1) && <text x={cx} y={H - 10} fill={AX} fontSize="11" textAnchor="middle">{d.periodo.replace(" 20", " '")}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/** Barras trimestrales simples para una startup. */
export function BarrasSerie({ puntos, etiqueta }: { puntos: { periodo: string; valor: number; duda?: boolean }[]; etiqueta: string }) {
  if (!puntos.length) return null;
  const W = 720, H = 190, L = 56, T = 12, B = 28;
  const max = Math.max(...puntos.map((p) => Math.abs(p.valor))) * 1.15;
  const bw = ((W - L - 10) / puntos.length) * 0.62;
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${etiqueta}: de ${usdK(puntos[0].valor)} (${puntos[0].periodo}) a ${usdK(puntos.at(-1)!.valor)} (${puntos.at(-1)!.periodo})`} style={{ width: "100%", height: "auto", maxWidth: 720 }}>
      <title>{etiqueta}</title>
      {[0, 0.5, 1].map((f) => <g key={f}><line x1={L} x2={W - 10} y1={y((max / 1.15) * f)} y2={y((max / 1.15) * f)} stroke={GRID} /><text x={L - 6} y={y((max / 1.15) * f) + 4} fill={AX} fontSize="10" textAnchor="end">{usdK((max / 1.15) * f)}</text></g>)}
      {puntos.map((p, i) => {
        const cx = L + ((i + 0.5) / puntos.length) * (W - L - 10);
        return (
          <g key={p.periodo}>
            <rect x={cx - bw / 2} y={y(p.valor)} width={bw} height={Math.max(y(0) - y(p.valor), 0)} fill={p.duda ? "transparent" : C.azul} stroke={p.duda ? C.vigilar : "none"} strokeDasharray={p.duda ? "3 2" : undefined} rx="2"><title>{`${p.periodo}: ${usdK(p.valor)}${p.duda ? " (en duda)" : ""}`}</title></rect>
            {(i % 2 === 0 || i === puntos.length - 1) && <text x={cx} y={H - 9} fill={AX} fontSize="10" textAnchor="middle">{p.periodo.replace(" 20", " '")}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export const th: CSSProperties = { textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted, padding: "8px 10px", borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: C.card };
export const td: CSSProperties = { padding: "9px 10px", borderBottom: `1px solid ${C.line}`, fontSize: 13, verticalAlign: "top" };
