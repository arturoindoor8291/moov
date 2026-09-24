import Link from "next/link";
import PortafolioNav from "@/components/portafolio/PortafolioNav";
import { td, th } from "@/components/portafolio/v2/charts";
import { C, Card, EstadoBadge, LenteToggle, NoRep, Punto, Valor, h1, href, main, numStyle, page, sub } from "@/components/portafolio/v2/ui";
import { calcularFondo, completitud, crecimientoQoQ, estadoSugerido, mesesSinDato, posicion, ultimoValor, type Lente } from "@/lib/portfolio/fondoV2";
import { fechaCorta, meses, mult, num0, pct1, spct, usdK } from "@/lib/portfolio/formatV2";
import { semaforoFrescura } from "@/lib/portfolio/calculos";
import { periodoAMes } from "@/lib/portfolio/migracion";
import { getPortafolio } from "@/lib/portfolio/portafolioV2";
import type { DatoNum, StartupV2 } from "@/lib/portfolio/schemaV2";

export const dynamic = "force-dynamic";

type SP = { q?: string; estado?: string; sector?: string; tipo?: string; vehiculo?: string; altas?: string; vista?: string; orden?: string; lente?: string };

/** Entre EBITDA y burn, el dato de periodo más reciente (empate: EBITDA). */
function masReciente<T extends { punto: { periodo: string } } | null>(a: T, b: T): T {
  if (!a) return b;
  if (!b) return a;
  return (periodoAMes(b.punto.periodo) ?? "") > (periodoAMes(a.punto.periodo) ?? "") ? b : a;
}

function fila(s: StartupV2, lente: Lente, corte: string, disc: ReturnType<typeof getPortafolio>["discrepancias"]) {
  const p = posicion(s, lente);
  const inv = s.inversion;
  const monto: DatoNum = lente === "costo"
    ? { valor: inv.monto_documento_usd, fuente: inv.monto_documento_usd == null ? "no_disponible" : "documento", fecha_dato: inv.fecha }
    : inv.monto_usd;
  // Para cada cifra se prefiere el último dato confiable; solo si no hay ninguno se muestra uno en duda (con ⚠).
  const uv = (c: Parameters<typeof ultimoValor>[1]) => ultimoValor(s, c, { sinDuda: true }) ?? ultimoValor(s, c);
  const rev = uv("revenue_usd");
  const qoq = crecimientoQoQ(s);
  const m = mesesSinDato(s, corte);
  const c = completitud(s);
  const altas = s.alertas.filter((a) => a.severidad === "alta");
  const sug = estadoSugerido(s, disc, corte);
  const take = s.serie_mensual.flatMap((x) => x.kpis_propios).find((k) => k.nombre === "Take rate");
  return {
    s, p, monto, rev, qoq, m, c, altas, sug, take,
    gtv: uv("gtv_usd"), cli: uv("clientes") ?? uv("usuarios_activos"),
    ebitda: masReciente(uv("ebitda_usd"), uv("burn_usd")), caja: uv("caja_usd"), runway: uv("runway_meses"),
    moic: p.monto_usd && p.valor_posicion_usd != null ? p.valor_posicion_usd / p.monto_usd : null,
  };
}
type Fila = ReturnType<typeof fila>;

const ORDENES: Record<string, [string, (f: Fila) => number]> = {
  estado: ["Estado", (f) => ({ critico: 0, vigilar: 1, sano: 2 })[f.s.estado_asignado]],
  moic: ["MOIC", (f) => -(f.moic ?? -1)],
  revenue: ["Revenue", (f) => -(f.rev?.dato.valor ?? -1)],
  crecimiento: ["Crecimiento", (f) => -(f.qoq?.pct ?? -1e9)],
  runway: ["Runway", (f) => f.runway?.dato.valor ?? 1e9],
  frescura: ["Frescura del dato", (f) => -(f.m ?? 999)],
};

export default async function StartupsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const lente: Lente = sp.lente === "costo" ? "costo" : "valor_justo";
  const data = getPortafolio();
  const corte = data.parametros.fecha_corte_vista;
  const vista = sp.vista === "tarjetas" ? "tarjetas" : "tabla";
  const orden = ORDENES[sp.orden ?? ""] ? sp.orden! : "estado";
  const q = (sp.q ?? "").trim().toLowerCase();
  const todas = data.startups.map((s) => fila(s, lente, corte, data.discrepancias));
  const filas = todas
    .filter((f) => (!q || f.s.nombre.toLowerCase().includes(q))
      && (!sp.estado || f.s.estado_asignado === sp.estado) && (!sp.sector || f.s.sector_grupo === sp.sector)
      && (!sp.tipo || f.s.tipo_portafolio === sp.tipo) && (!sp.vehiculo || f.s.vehiculo === sp.vehiculo) && (sp.altas !== "1" || f.altas.length > 0))
    .sort((a, b) => ORDENES[orden][1](a) - ORDENES[orden][1](b));
  const fondo = calcularFondo(data, lente);
  const sectores = [...new Set(data.startups.map((s) => s.sector_grupo))].sort();
  const base = { q: sp.q, estado: sp.estado, sector: sp.sector, tipo: sp.tipo, vehiculo: sp.vehiculo, altas: sp.altas, vista: sp.vista, orden: sp.orden, lente: sp.lente === "costo" ? "costo" : undefined };
  const sel: React.CSSProperties = { background: "#0c0e14", border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: C.text };

  // totales y proporción "No reportado" en las columnas de la tabla
  const celdas = (f: Fila) => [f.monto.valor, f.s.inversion.fecha, f.s.inversion.instrumento, f.s.inversion.participacion_actual_pct.valor, f.p.valor_posicion_usd, f.rev?.dato.valor, f.qoq?.pct, f.gtv?.dato.valor, f.cli?.dato.valor, f.ebitda?.dato.valor, f.caja?.dato.valor, f.runway?.dato.valor];
  const totCel = filas.length * 12, vacias = filas.reduce((a, f) => a + celdas(f).filter((x) => x == null).length, 0);
  const sumMonto = filas.reduce((a, f) => a + (f.p.monto_usd ?? 0), 0), sumValor = filas.reduce((a, f) => a + (f.p.valor_posicion_usd ?? 0), 0);

  const semaf = (f: Fila) => {
    const dif = f.sug.valor !== f.s.estado_asignado;
    return (
      <div style={{ display: "grid", gap: 4 }}>
        <EstadoBadge estado={f.s.estado_asignado} titulo="Estado asignado por Arturo" />
        {dif && <span title={f.sug.razones.join("\n")} style={{ fontSize: 11, color: C.muted, borderBottom: `1px dotted ${C.tenue}`, width: "fit-content" }}>sugerido: {f.sug.valor === "critico" ? "Crítico" : f.sug.valor === "vigilar" ? "Vigilar" : "Sano"} ⓘ</span>}
        {!dif && <span title={f.sug.razones.join("\n")} style={{ fontSize: 11, color: C.tenue, width: "fit-content" }}>coincide con reglas ⓘ</span>}
      </div>
    );
  };
  const fresco = (f: Fila) => {
    const fr = semaforoFrescura(f.m);
    const col = fr === "verde" ? C.sano : fr === "amarillo" ? C.vigilar : fr === "rojo" ? C.critico : C.tenue;
    return f.m == null ? <NoRep texto="Sin dato" /> : <span style={{ color: col }}>{fr === "verde" ? "●" : fr === "amarillo" ? "▲" : "■"} {fechaCorta(f.s.reporte.ultimo_periodo_reportado)} <span style={{ color: C.muted }}>({f.m} m)</span></span>;
  };
  const comp = (f: Fila) => (
    <span title={`Faltan: ${f.c.faltantes.join(", ") || "nada"}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-block", width: 44, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}><span style={{ display: "block", width: `${f.c.pct}%`, height: 6, borderRadius: 3, background: f.c.pct >= 70 ? C.sano : f.c.pct >= 40 ? C.vigilar : C.critico }} /></span>
      <span style={numStyle}>{pct1(f.c.pct)}</span>
    </span>
  );
  const revCell = (f: Fila) => f.rev ? (
    <div><Valor dato={f.rev.dato} fmt={(n) => usdK(n)!} />
      <div style={{ fontSize: 11, color: C.tenue }}>{f.rev.periodo.includes("Q") ? f.rev.periodo : `${fechaCorta(f.rev.periodo)} · mensual`}{f.rev.punto.moneda_original !== "USD" ? ` · orig. ${f.rev.punto.moneda_original}${f.rev.punto.revenue_original ? " " + num0(f.rev.punto.revenue_original) : ""}` : ""}</div></div>
  ) : <NoRep />;

  return (
    <div style={page}>
      <PortafolioNav active="dashboard" />
      <main style={main}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
          <div><h1 style={h1}>Startups</h1><p style={sub}>{filas.length} de {data.startups.length} startups · mismos campos para todas; lo que no reportan aparece como “No reportado”.</p></div>
          <LenteToggle lente={lente} base="/portafolio" extra={{ ...base, lente: undefined }} />
        </div>

        <form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }} aria-label="Filtros">
          {lente === "costo" && <input type="hidden" name="lente" value="costo" />}
          <input type="search" name="q" defaultValue={sp.q} placeholder="Buscar por nombre..." aria-label="Buscar por nombre" style={{ ...sel, flex: "1 1 200px" }} />
          <select name="estado" defaultValue={sp.estado ?? ""} aria-label="Estado" style={sel}><option value="">Todos los estados</option><option value="sano">Sano</option><option value="vigilar">Vigilar</option><option value="critico">Crítico</option></select>
          <select name="sector" defaultValue={sp.sector ?? ""} aria-label="Sector" style={sel}><option value="">Todos los sectores</option>{sectores.map((x) => <option key={x}>{x}</option>)}</select>
          <select name="tipo" defaultValue={sp.tipo ?? ""} aria-label="Tipo de portafolio" style={sel}><option value="">Todos los tipos</option><option value="core">Core</option><option value="adyacente">Adyacente</option><option value="transformacional">Transformacional</option></select>
          <select name="vehiculo" defaultValue={sp.vehiculo ?? ""} aria-label="Vehículo" style={sel}><option value="">Directas y SPV</option><option value="directa">Directas</option><option value="spv">SPV</option></select>
          <select name="orden" defaultValue={orden} aria-label="Ordenar por" style={sel}>{Object.entries(ORDENES).map(([k, [t]]) => <option key={k} value={k}>Orden: {t}</option>)}</select>
          <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="altas" value="1" defaultChecked={sp.altas === "1"} /> Solo con alertas altas</label>
          <input type="hidden" name="vista" value={vista} />
          <button type="submit" style={{ ...sel, cursor: "pointer", fontWeight: 600 }}>Aplicar</button>
          <Link href={href("/portafolio", { lente: base.lente })} style={{ fontSize: 13, color: C.muted }}>Limpiar</Link>
        </form>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, fontSize: 13 }}>
          {(["tabla", "tarjetas"] as const).map((v) => <Link key={v} href={href("/portafolio", { ...base, vista: v })} aria-current={vista === v ? "true" : undefined} style={{ padding: "6px 12px", borderRadius: 6, textDecoration: "none", border: `1px solid ${C.line}`, background: vista === v ? C.text : "transparent", color: vista === v ? "#050506" : C.text, fontWeight: vista === v ? 700 : 400 }}>{v === "tabla" ? "Tabla" : "Tarjetas"}</Link>)}
        </div>

        {filas.length === 0 && <p style={{ color: C.muted, padding: "40px 0", textAlign: "center" }}>Ninguna startup coincide con el filtro.</p>}

        {vista === "tabla" && filas.length > 0 && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto", maxHeight: "75vh" }}>
              <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: 1900 }}>
                <caption style={{ position: "absolute", left: -9999 }}>Comparativo homologado de las startups del portafolio</caption>
                <thead>
                  <tr>
                    <th style={{ ...th, left: 0, zIndex: 3 }} scope="col" rowSpan={2}>Startup</th>
                    <th style={{ ...th, textAlign: "center" }} colSpan={6} scope="colgroup">Inversión (USD)</th>
                    <th style={{ ...th, textAlign: "center" }} colSpan={4} scope="colgroup">Tracción</th>
                    <th style={{ ...th, textAlign: "center" }} colSpan={3} scope="colgroup">Eficiencia y caja</th>
                    <th style={{ ...th, textAlign: "center" }} colSpan={5} scope="colgroup">Estado</th>
                  </tr>
                  <tr style={{ top: 34 }}>
                    {["Invertido", "Fecha", "Instrumento", "Particip. actual", "Valor posición", "MOIC", "Revenue último periodo", "Crec. QoQ", "GTV · take rate", "Clientes / usuarios", "EBITDA / burn", "Caja", "Runway", "Estado", "Dato al", "Completitud", "Alertas altas", "Decisión pendiente"].map((t) => <th key={t} style={{ ...th, top: 34 }} scope="col">{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => {
                    const inv = f.s.inversion;
                    return (
                      <tr key={f.s.id}>
                        <th scope="row" style={{ ...td, position: "sticky", left: 0, background: C.card, zIndex: 1, textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" }}>
                          <Link href={`/portafolio/startups/${f.s.id}`} style={{ color: C.text }}>{f.s.nombre}</Link>
                          <div style={{ fontSize: 11, color: C.tenue, fontWeight: 400 }}>{f.s.sector_grupo} · {f.s.vehiculo === "spv" ? "SPV" : "Directa"}</div>
                        </th>
                        <td style={{ ...td, ...numStyle, whiteSpace: "nowrap" }}>{f.monto.valor == null ? <NoRep texto="Sin documento" /> : <Valor dato={f.monto} fmt={(n) => usdK(n)!} />}</td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>{inv.fecha ? fechaCorta(inv.fecha) : inv.periodo ? <span>{inv.periodo}</span> : <NoRep />}</td>
                        <td style={{ ...td, maxWidth: 170 }}>{inv.instrumento ?? <NoRep texto="No localizado" />}</td>
                        <td style={{ ...td, ...numStyle }}><Valor dato={inv.participacion_actual_pct} fmt={(n) => `${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`} /></td>
                        <td style={{ ...td, ...numStyle }}>{f.p.valor_posicion_usd == null ? <NoRep /> : <span>{usdK(f.p.valor_posicion_usd)}<Punto fuente={lente === "costo" ? "documento" : inv.monto_usd.fuente} nota={inv.base_marca_nota} /></span>}</td>
                        <td style={{ ...td, ...numStyle, fontWeight: 600 }}>{f.moic == null ? <NoRep /> : mult(f.moic)}</td>
                        <td style={{ ...td, ...numStyle }}>{revCell(f)}</td>
                        <td style={{ ...td, ...numStyle, color: f.qoq ? (f.qoq.pct >= 0 ? C.sano : C.critico) : undefined }}>{f.qoq ? spct(f.qoq.pct) : <NoRep />}</td>
                        <td style={{ ...td, ...numStyle }}>{f.gtv ? <span>{usdK(f.gtv.dato.valor)}<Punto fuente={f.gtv.dato.fuente} fecha={f.gtv.dato.fecha_dato} />{f.take ? <span style={{ color: C.muted }}> · {f.take.valor}%</span> : null}</span> : <NoRep />}</td>
                        <td style={{ ...td, ...numStyle }}>{f.cli ? <Valor dato={f.cli.dato} fmt={(n) => num0(n)!} /> : <NoRep />}</td>
                        <td style={{ ...td, ...numStyle }}>{f.ebitda ? <span>{f.ebitda.dato.valor! < 0 ? "−" : ""}{usdK(Math.abs(f.ebitda.dato.valor!))}<Punto fuente={f.ebitda.dato.fuente} fecha={f.ebitda.dato.fecha_dato} /></span> : <NoRep />}</td>
                        <td style={{ ...td, ...numStyle }}>{f.caja ? <Valor dato={f.caja.dato} fmt={(n) => usdK(n)!} /> : <NoRep />}</td>
                        <td style={{ ...td, ...numStyle, color: f.runway && f.runway.dato.valor! < 6 ? C.critico : undefined }}>{f.runway ? <Valor dato={f.runway.dato} fmt={(n) => meses(n)!} /> : f.s.crisis_caja_reportada ? <span style={{ color: C.critico }}>Crisis de caja</span> : <NoRep />}</td>
                        <td style={td}>{semaf(f)}</td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>{fresco(f)}</td>
                        <td style={td}>{comp(f)}</td>
                        <td style={{ ...td, minWidth: 220 }}>{f.altas.length ? <span><strong style={{ color: C.critico }}>{f.altas.length}</strong> · {f.altas[0].texto}</span> : <span style={{ color: C.muted }}>0</span>}</td>
                        <td style={{ ...td, minWidth: 220 }}>{f.s.decision_pendiente ?? <span style={{ color: C.muted }}>Ninguna</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" style={{ ...td, position: "sticky", left: 0, background: C.card, textAlign: "left", fontWeight: 700 }}>Total / ponderado</th>
                    <td style={{ ...td, ...numStyle, fontWeight: 700 }}>{usdK(sumMonto)}</td><td style={td} /><td style={td} /><td style={td} />
                    <td style={{ ...td, ...numStyle, fontWeight: 700 }}>{usdK(sumValor)}</td>
                    <td style={{ ...td, ...numStyle, fontWeight: 700 }}>{sumMonto ? mult(sumValor / sumMonto) : "—"}</td>
                    <td style={{ ...td, color: C.tenue, fontSize: 11 }} colSpan={4}>Revenue no se suma: los periodos y monedas de origen son distintos.</td>
                    <td style={td} colSpan={3} />
                    <td style={{ ...td, fontWeight: 700 }} colSpan={5}>
                      <span title="Celdas sin dato entre las 12 columnas de datos de la tabla">{pct1((vacias / Math.max(totCel, 1)) * 100)} de la tabla es “No reportado”</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}

        {vista === "tarjetas" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {filas.map((f) => {
              const inv = f.s.inversion;
              const fila2 = (k: string, v: React.ReactNode) => <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "3px 0" }}><span style={{ color: C.muted }}>{k}</span><span style={{ ...numStyle, textAlign: "right" }}>{v}</span></div>;
              return (
                <Card key={f.s.id} style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div><Link href={`/portafolio/startups/${f.s.id}`} style={{ color: C.text, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>{f.s.nombre}</Link><div style={{ fontSize: 12, color: C.tenue }}>{f.s.sector_grupo} · {f.s.vehiculo === "spv" ? "SPV" : "Directa"} · {f.s.tipo_portafolio}</div></div>
                    {semaf(f)}
                  </div>
                  <h3 style={{ fontSize: 11, color: C.muted, margin: "12px 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Inversión</h3>
                  {fila2("Invertido", f.monto.valor == null ? <NoRep texto="Sin documento" /> : <Valor dato={f.monto} fmt={(n) => usdK(n)!} />)}
                  {fila2("Fecha · instrumento", `${inv.fecha ? fechaCorta(inv.fecha) : inv.periodo ?? "—"} · ${inv.instrumento ?? "No localizado"}`)}
                  {fila2("Valor posición · MOIC", f.p.valor_posicion_usd == null ? <NoRep /> : `${usdK(f.p.valor_posicion_usd)} · ${mult(f.moic)}`)}
                  <h3 style={{ fontSize: 11, color: C.muted, margin: "10px 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Tracción</h3>
                  {fila2("Revenue último periodo", revCell(f))}
                  {fila2("Crecimiento QoQ", f.qoq ? spct(f.qoq.pct) : <NoRep />)}
                  {fila2("Clientes / usuarios", f.cli ? <Valor dato={f.cli.dato} fmt={(n) => num0(n)!} /> : <NoRep />)}
                  {f.s.kpi_principal.nombre && fila2(`${f.s.kpi_principal.nombre} (dato propio)`, f.s.kpi_principal.valor == null ? <NoRep /> : f.s.kpi_principal.moneda === "%" ? pct1(f.s.kpi_principal.valor * 100) : `${num0(f.s.kpi_principal.valor)} (${f.s.kpi_principal.moneda ?? "s/m"})`)}
                  <h3 style={{ fontSize: 11, color: C.muted, margin: "10px 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Eficiencia y caja</h3>
                  {fila2("EBITDA / burn", f.ebitda ? `${usdK(f.ebitda.dato.valor)}` : <NoRep />)}
                  {fila2("Caja · runway", `${f.caja ? usdK(f.caja.dato.valor) : "No reportado"} · ${f.runway ? meses(f.runway.dato.valor) : f.s.crisis_caja_reportada ? "Crisis de caja" : "No reportado"}`)}
                  <h3 style={{ fontSize: 11, color: C.muted, margin: "10px 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Estado</h3>
                  {fila2("Dato al", fresco(f))}
                  {fila2("Completitud", comp(f))}
                  {fila2("Alertas altas", f.altas.length ? <span style={{ color: C.critico }}>{f.altas.length}</span> : "0")}
                  {f.altas[0] && <p style={{ fontSize: 12, color: C.muted, margin: "2px 0" }}>{f.altas[0].texto}</p>}
                  {f.s.decision_pendiente && <p style={{ fontSize: 12, margin: "8px 0 0", borderTop: `1px solid ${C.line}`, paddingTop: 8 }}><strong>Decisión pendiente:</strong> {f.s.decision_pendiente}</p>}
                </Card>
              );
            })}
          </div>
        )}
        <p style={{ fontSize: 12, color: C.tenue, marginTop: 14 }}>Punto de color: verde = documento · azul = reporte de la startup · gris = Excel del gestor anterior o estimado · ⚠ = dato en duda. El estado lo asigna Arturo; “sugerido” sale de reglas visibles (pasa el cursor sobre ⓘ). Cifras del fondo en {fondo.lente === "costo" ? "lente A costo" : "lente A valor justo"}.</p>
      </main>
    </div>
  );
}
