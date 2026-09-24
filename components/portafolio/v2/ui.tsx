import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { FUENTE_LABEL, fechaCorta } from "@/lib/portfolio/formatV2";
import type { DatoNum } from "@/lib/portfolio/schemaV2";
import type { Lente } from "@/lib/portfolio/fondoV2";

export const C = {
  bg: "#050506", card: "#07080d", line: "rgba(255,255,255,0.08)", text: "#eef1f6", muted: "rgba(238,241,246,0.55)",
  tenue: "rgba(238,241,246,0.5)", sano: "#28c850", vigilar: "#ffc300", critico: "#ff5a5a", azul: "#3987e5", gris: "#8b93a3",
};
export const CAT = ["#3987e5", "#199e70", "#c98500", "#9085e9", "#e66767", "#d55181", "#5fb8c9", "#8b93a3"];

const FUENTE_COLOR: Record<string, string> = { documento: C.sano, reporte_startup: C.azul, excel_bluebox: C.gris, estimado: C.gris, no_disponible: "transparent" };

export function Punto({ fuente, fecha, nota, referencia }: { fuente: string; fecha?: string | null; nota?: string; referencia?: string }) {
  const tip = [`Fuente: ${FUENTE_LABEL[fuente] ?? fuente}`, fecha ? `Dato al ${fechaCorta(fecha)}` : null, referencia ? `Ref: ${referencia}` : null, nota].filter(Boolean).join(" · ");
  return (
    <span title={tip} role="img" aria-label={tip} style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", marginLeft: 6, verticalAlign: "middle", background: FUENTE_COLOR[fuente], border: fuente === "no_disponible" ? `1px solid ${C.tenue}` : "none", flex: "none" }} />
  );
}

export const NoRep = ({ texto = "No reportado" }: { texto?: string }) => <span style={{ color: C.tenue, fontStyle: "italic", fontWeight: 400 }}>{texto}</span>;

/** Celda con valor + punto de procedencia, o "No reportado". */
export function Valor({ dato, fmt, sufijo, vacio }: { dato: DatoNum | null | undefined; fmt: (n: number) => string | null; sufijo?: string; vacio?: string }) {
  if (!dato || dato.valor == null) return <NoRep texto={vacio} />;
  return (
    <span>
      {fmt(dato.valor)}
      {sufijo ? <span style={{ color: C.muted }}> {sufijo}</span> : null}
      {dato.en_duda ? <span title={dato.nota} aria-label="Dato en duda" style={{ color: C.vigilar, marginLeft: 4 }}>⚠</span> : null}
      <Punto fuente={dato.fuente} fecha={dato.fecha_dato} nota={dato.nota} referencia={dato.referencia} />
    </span>
  );
}

const ESTADO = { sano: { c: C.sano, t: "Sano", i: "✓" }, vigilar: { c: C.vigilar, t: "Vigilar", i: "!" }, critico: { c: C.critico, t: "Crítico", i: "✕" } } as const;
export function EstadoBadge({ estado, titulo }: { estado: keyof typeof ESTADO; titulo?: string }) {
  const e = ESTADO[estado];
  return (
    <span title={titulo} style={{ display: "inline-flex", gap: 5, alignItems: "center", color: e.c, border: `1px solid ${e.c}55`, background: `${e.c}14`, borderRadius: 999, padding: "2px 9px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span aria-hidden>{e.i}</span>
      {e.t}
    </span>
  );
}

export const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 20, ...style }}>{children}</section>
);
export const H2 = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{children}</h2>
    {sub ? <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0", lineHeight: 1.5 }}>{sub}</p> : null}
  </div>
);

export function href(base: string, params: Record<string, string | undefined | null>) {
  const q = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
  return q ? `${base}?${q}` : base;
}

export function LenteToggle({ lente, base, extra = {} }: { lente: Lente; base: string; extra?: Record<string, string | undefined> }) {
  const opts: [Lente, string][] = [["valor_justo", "A valor justo (marcas del fondo)"], ["costo", "A costo (confirmado con documento)"]];
  return (
    <div role="group" aria-label="Lente de valuación" style={{ display: "inline-flex", border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
      {opts.map(([k, t]) => (
        <Link key={k} href={href(base, { ...extra, lente: k === "valor_justo" ? undefined : k })} aria-current={lente === k ? "true" : undefined}
          style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none", color: lente === k ? "#050506" : C.text, background: lente === k ? C.text : "transparent", fontWeight: lente === k ? 700 : 400 }}>
          {t}
        </Link>
      ))}
    </div>
  );
}

export const page: CSSProperties = { minHeight: "100vh", background: C.bg, color: C.text };
export const main: CSSProperties = { maxWidth: 1280, margin: "0 auto", padding: "28px 16px 64px" };
export const h1: CSSProperties = { fontSize: 26, fontWeight: 700, margin: "0 0 4px" };
export const sub: CSSProperties = { fontSize: 13, color: C.muted, margin: 0 };
export const numStyle: CSSProperties = { fontVariantNumeric: "tabular-nums" };
