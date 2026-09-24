import Link from "next/link";
import { notFound } from "next/navigation";
import PortafolioNav from "@/components/portafolio/PortafolioNav";
import { BarrasSerie, td, th } from "@/components/portafolio/v2/charts";
import { C, Card, EstadoBadge, H2, NoRep, Punto, Valor, h1, main, numStyle, page, sub } from "@/components/portafolio/v2/ui";
import { completitud, crecimientoQoQ, estadoSugerido, mesesSinDato, posicion } from "@/lib/portfolio/fondoV2";
import { fechaCorta, meses, mult, num0, pct1, spct, usd, usdK } from "@/lib/portfolio/formatV2";
import { getPortafolio, getStartupV2 } from "@/lib/portfolio/portafolioV2";
import { getAllTareas } from "@/lib/portfolio/tareasData";
import type { PuntoSerie } from "@/lib/portfolio/schemaV2";

export const dynamic = "force-dynamic";

const BASE = { ronda_pricing: "Ronda con precio", cap_safe: "Cap de SAFE o nota (no es ronda con precio)", a_costo: "A costo", otra: "Otra (dilución)" } as const;

export default async function FichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getStartupV2(id);
  if (!s) notFound();
  const data = getPortafolio();
  const corte = data.parametros.fecha_corte_vista;
  const inv = s.inversion;
  const sug = estadoSugerido(s, data.discrepancias, corte);
  const comp = completitud(s);
  const m = mesesSinDato(s, corte);
  const p = posicion(s, "valor_justo");
  const moic = p.monto_usd && p.valor_posicion_usd != null ? p.valor_posicion_usd / p.monto_usd : null;
  const discs = data.discrepancias.filter((d) => d.startup === s.nombre);
  const tareas = getAllTareas().filter((t) => t.startup === s.nombre && t.columna_kanban !== "completada");
  const qoq = crecimientoQoQ(s);
  const pts = (arr: PuntoSerie[]) => [...arr].sort((a, b) => a.periodo.localeCompare(b.periodo));
  const revTrim = s.serie_trimestral.filter((x) => x.revenue_usd.valor != null).map((x) => ({ periodo: x.periodo, valor: x.revenue_usd.valor!, duda: x.revenue_usd.en_duda }));
  const revMens = pts(s.serie_mensual).filter((x) => x.revenue_usd.valor != null).map((x) => ({ periodo: fechaCorta(x.periodo)!, valor: x.revenue_usd.valor! }));
  const kpisPropios = s.serie_mensual.flatMap((x) => x.kpis_propios.map((k) => ({ ...k, periodo: x.periodo })));
  const eficiencia = [...s.serie_trimestral, ...s.serie_mensual].filter((x) => x.ebitda_usd.valor != null || x.burn_usd.valor != null || x.caja_usd.valor != null || x.runway_meses.valor != null);
  const row = (k: string, v: React.ReactNode) => <tr><th scope="row" style={{ ...td, color: C.muted, fontWeight: 400, width: "38%", textAlign: "left" }}>{k}</th><td style={{ ...td, ...numStyle }}>{v}</td></tr>;
  const sevColor = { alta: C.critico, media: C.vigilar, baja: C.muted } as const;

  return (
    <div style={page}>
      <PortafolioNav active="dashboard" />
      <main style={main}>
        <Link href="/portafolio" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>← Startups</Link>

        {/* 1 cabecera */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, margin: "14px 0 18px" }}>
          <div>
            <h1 style={h1}>{s.nombre}</h1>
            <p style={sub}>{s.sector}</p>
            <p style={{ ...sub, marginTop: 4 }}>{s.modelo_negocio} · {s.paises.join(", ")}{s.hq ? ` · HQ ${s.hq}` : ""} · {s.etapa ?? "Etapa no reportada"} · {s.tipo_portafolio} · {s.vehiculo === "spv" ? `SPV${s.spv_nombre ? ` (${s.spv_nombre})` : ""}` : "Directa"}</p>
            <p style={{ ...sub, marginTop: 4 }}>Responsable en MOOV: {s.responsable_moov ?? <NoRep texto="Sin responsable" />} · Relación con el grupo: {s.relacion_con_grupo ?? <NoRep />} · Último dato: {m == null ? <NoRep texto="sin dato" /> : `${fechaCorta(s.reporte.ultimo_periodo_reportado)} (${m} m)`} · Completitud {pct1(comp.pct)}</p>
          </div>
          <div style={{ textAlign: "right", maxWidth: 380 }}>
            <EstadoBadge estado={s.estado_asignado} titulo="Estado asignado por Arturo" />
            {sug.valor !== s.estado_asignado && <div style={{ marginTop: 6 }}><span style={{ fontSize: 12, color: C.muted }}>Las reglas sugieren </span><EstadoBadge estado={sug.valor} /></div>}
            <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{sug.razones.map((r) => <li key={r}>{r}</li>)}</ul>
            {s.override_estado && <p style={{ fontSize: 12, color: C.muted }}>Override: {s.override_estado.motivo} ({fechaCorta(s.override_estado.fecha)})</p>}
          </div>
        </div>

        {/* 2 posición */}
        <Card style={{ marginBottom: 16 }}>
          <H2>Tu posición</H2>
          <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 760 }}>
            <tbody>
              {row("Instrumento", inv.instrumento ?? <NoRep texto="No localizado" />)}
              {row("Entidad", inv.entidad ?? <NoRep />)}
              {row("Monto invertido (USD)", <Valor dato={inv.monto_usd} fmt={(n) => usd(n)!} />)}
              {inv.monto_documento_usd != null && inv.monto_documento_usd !== inv.monto_usd.valor && row("Monto según documento o comprobante", <span>{usd(inv.monto_documento_usd)} <Punto fuente="documento" /></span>)}
              {row("Fecha", inv.fecha ? fechaCorta(inv.fecha) : inv.periodo ?? <NoRep />)}
              {row(`Valuación de entrada${inv.tipo_valuacion ? ` (${inv.tipo_valuacion.replace("_", "-")})` : ""}`, <Valor dato={inv.valuacion_entrada_usd} fmt={(n) => usdK(n)!} />)}
              {row("Participación actual", <Valor dato={inv.participacion_actual_pct} fmt={(n) => `${n.toLocaleString("es-MX", { maximumFractionDigits: 3 })}%`} />)}
              {row("Valuación actual (FMV)", <Valor dato={inv.valuacion_actual_usd} fmt={(n) => usdK(n)!} />)}
              {row("Valor de la posición · MOIC", p.valor_posicion_usd == null ? <NoRep /> : `${usd(p.valor_posicion_usd)} · ${mult(moic)}`)}
              {row("Base de la marca", <span>{BASE[inv.base_marca]}<div style={{ fontSize: 12, color: C.muted }}>{inv.base_marca_nota}</div></span>)}
              {row("Documento localizado", inv.documento_localizado ? <span style={{ color: C.sano }}>✓ Sí</span> : <span style={{ color: C.vigilar }}>Pendiente de contrato</span>)}
            </tbody>
          </table>
          {s.notas_legales && <p style={{ fontSize: 13, color: C.muted, margin: "12px 0 0", lineHeight: 1.5 }}><strong style={{ color: C.text }}>Notas legales:</strong> {s.notas_legales}</p>}
        </Card>

        {/* 3 tracción */}
        <Card style={{ marginBottom: 16 }}>
          <H2 sub={s.kpi_principal.nombre ? `Dato propio de la startup: ${s.kpi_principal.nombre} = ${s.kpi_principal.valor == null ? "sin dato" : s.kpi_principal.moneda === "%" ? pct1(s.kpi_principal.valor * 100) : `${num0(s.kpi_principal.valor)} ${s.kpi_principal.moneda ?? ""}`} (${s.kpi_principal.fecha_dato ?? "sin fecha"})` : undefined}>Tracción</H2>
          {revTrim.length > 0 ? (
            <>
              <p style={{ fontSize: 12, color: C.muted, margin: "0 0 6px" }}>Revenue trimestral en USD{qoq ? ` · último crecimiento QoQ ${spct(qoq.pct)} (${qoq.periodo})` : ""}{revTrim.some((x) => x.duda) ? " · barras punteadas: dato en duda (unidad por verificar)" : ""}.</p>
              <BarrasSerie puntos={revTrim} etiqueta={`Revenue trimestral de ${s.nombre} (USD)`} />
            </>
          ) : <p style={{ fontSize: 13 }}><NoRep texto="No hay serie trimestral de revenue confiable." /></p>}
          {revMens.length > 0 && <p style={{ fontSize: 13, margin: "12px 0 0" }}>Último dato mensual: {revMens.map((x) => `${x.periodo}: ${usdK(x.valor)}`).join(" · ")}</p>}
          {kpisPropios.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              {kpisPropios.map((k) => <div key={k.nombre + k.periodo} style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 12px" }}><div style={{ fontSize: 11, color: C.muted }}>{k.nombre} · {fechaCorta(k.periodo)}</div><div style={{ fontSize: 18, fontWeight: 700, ...numStyle }}>{k.valor == null ? "—" : num0(k.valor)} <span style={{ fontSize: 12, color: C.muted }}>{k.unidad}</span></div></div>)}
            </div>
          )}
          {s.tendencia && <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: "14px 0 0" }}>{s.tendencia}</p>}
        </Card>

        {/* 4 eficiencia */}
        <Card style={{ marginBottom: 16 }}>
          <H2>Eficiencia y caja</H2>
          {eficiencia.length === 0 ? <p style={{ fontSize: 13, margin: 0 }}><NoRep texto="No reporta EBITDA, burn, caja ni runway." />{s.crisis_caja_reportada ? " Hay una crisis de caja reportada (ver alertas)." : ""}</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 480 }}>
                <thead><tr><th style={th} scope="col">Periodo</th><th style={{ ...th, textAlign: "right" }} scope="col">EBITDA</th><th style={{ ...th, textAlign: "right" }} scope="col">Burn</th><th style={{ ...th, textAlign: "right" }} scope="col">Caja</th><th style={{ ...th, textAlign: "right" }} scope="col">Runway</th></tr></thead>
                <tbody>{eficiencia.map((x) => (
                  <tr key={x.periodo}>
                    <td style={td}>{x.periodo.includes("Q") ? x.periodo : fechaCorta(x.periodo)}</td>
                    <td style={{ ...td, textAlign: "right", ...numStyle }}><Valor dato={x.ebitda_usd} fmt={(n) => `${n < 0 ? "−" : ""}${usdK(Math.abs(n))}`} /></td>
                    <td style={{ ...td, textAlign: "right", ...numStyle }}><Valor dato={x.burn_usd} fmt={(n) => `${n < 0 ? "−" : ""}${usdK(Math.abs(n))}`} /></td>
                    <td style={{ ...td, textAlign: "right", ...numStyle }}><Valor dato={x.caja_usd} fmt={(n) => usdK(n)!} /></td>
                    <td style={{ ...td, textAlign: "right", ...numStyle }}><Valor dato={x.runway_meses} fmt={(n) => meses(n)!} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 5 rondas */}
        <Card style={{ marginBottom: 16 }}>
          <H2>Rondas y capitalización</H2>
          {s.rondas.length === 0 ? <p style={{ fontSize: 13, margin: 0 }}><NoRep texto="Sin rondas registradas." /></p> : (
            <ol style={{ listStyle: "none", margin: 0, padding: 0, borderLeft: `2px solid ${C.line}` }}>
              {s.rondas.map((r) => (
                <li key={r.nombre + r.fecha} style={{ padding: "0 0 14px 16px", position: "relative", fontSize: 13 }}>
                  <span style={{ position: "absolute", left: -6, top: 4, width: 10, height: 10, borderRadius: "50%", background: C.azul }} />
                  <strong>{r.nombre}</strong> · {r.fecha ?? "sin fecha"} · {r.instrumento ?? "instrumento n/d"}<Punto fuente={r.fuente} />
                  <div style={{ color: C.muted }}>Tamaño {usdK(r.monto_usd) ?? "n/d"} · valuación {usdK(r.valuacion_usd) ?? "n/d"} · dilución {r.dilucion_pct == null ? "n/d" : pct1(r.dilucion_pct)} · participó MOOV: {r.participo_moov == null ? "no confirmado" : r.participo_moov ? "sí" : "no"}</div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* 6 highlights */}
        <Card style={{ marginBottom: 16 }}>
          <H2>Lo importante del último reporte</H2>
          {s.highlights.length ? <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{s.highlights.map((h) => <li key={h}>{h}</li>)}</ul> : <p style={{ fontSize: 13, margin: "0 0 12px" }}><NoRep texto={s.nombre === "Bemycar" ? "Highlights del Excel descartados: pertenecen a otra startup (D-06)." : "No hay highlights capturados."} /></p>}
          <p style={{ fontSize: 13, lineHeight: 1.65, color: C.muted, margin: 0 }}><strong style={{ color: C.text }}>Situación actual.</strong> {s.situacion_actual}</p>
        </Card>

        {/* 7 alertas y pasos */}
        <Card style={{ marginBottom: 16 }}>
          <H2>Alertas y próximos pasos</H2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 13, color: C.muted, margin: "0 0 8px" }}>Alertas</h3>
              {s.alertas.length === 0 ? <NoRep texto="Sin alertas" /> : <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>{[...s.alertas].sort((a, b) => ["alta", "media", "baja"].indexOf(a.severidad) - ["alta", "media", "baja"].indexOf(b.severidad)).map((a) => (
                <li key={a.texto} style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <span title={a.severidad_revisada ? "Severidad revisada" : "Severidad asignada por regla de migración; pendiente de revisión"} style={{ color: sevColor[a.severidad], fontWeight: 700, marginRight: 6 }}>{a.severidad === "alta" ? "▲ Alta" : a.severidad === "media" ? "● Media" : "○ Baja"}{a.severidad_revisada ? "" : "*"}</span>{a.texto}
                </li>
              ))}</ul>}
              <p style={{ fontSize: 11, color: C.tenue }}>* Severidad asignada por regla; pendiente de revisar por Arturo.</p>
            </div>
            <div>
              <h3 style={{ fontSize: 13, color: C.muted, margin: "0 0 8px" }}>Próximos pasos</h3>
              {s.proximos_pasos.length === 0 ? <NoRep texto="Sin pasos" /> : <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13, lineHeight: 1.5 }}>{s.proximos_pasos.map((x) => <li key={x.texto}>{x.texto} <span style={{ color: C.tenue }}>· {x.responsable ?? "sin dueño asignado"}{x.fecha_objetivo ? ` · ${x.fecha_objetivo}` : ""}</span></li>)}</ul>}
              {tareas.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, color: C.muted, margin: "16px 0 8px" }}>Tareas abiertas en el tablero de tareas</h3>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>{tareas.map((t) => <li key={t.id}><span style={{ color: C.tenue }}>{t.id}</span> {t.tarea} <span style={{ color: C.tenue }}>· {t.responsable}</span></li>)}</ul>
                </>
              )}
              {s.decision_pendiente && <p style={{ fontSize: 13, marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}><strong>Decisión pendiente del fondo:</strong> {s.decision_pendiente}</p>}
            </div>
          </div>
        </Card>

        {/* 8 discrepancias y faltantes */}
        <Card>
          <H2 sub="Se muestran las dos versiones; no se elige ganador hasta verificar contra documento.">Discrepancias abiertas y campos faltantes</H2>
          {discs.length === 0 ? <p style={{ fontSize: 13, margin: "0 0 12px" }}>Sin discrepancias específicas de esta startup. Ver también las del fondo en <Link href="/portafolio/pendientes" style={{ color: C.azul }}>Pendientes</Link> (D-01, D-02).</p> : (
            <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>{discs.map((d) => (
              <div key={d.id} style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: 12, fontSize: 13 }}>
                <strong>{d.id} · {d.campo}</strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, margin: "8px 0" }}>
                  <div><div style={{ fontSize: 11, color: C.muted }}>{d.fuente_a}</div>{d.valor_a}</div>
                  <div><div style={{ fontSize: 11, color: C.muted }}>{d.fuente_b}</div>{d.valor_b}</div>
                </div>
                <div style={{ color: C.muted }}>Impacto: {d.impacto}</div>
                <div style={{ marginTop: 4 }}>Acción: {d.accion}</div>
              </div>
            ))}</div>
          )}
          <h3 style={{ fontSize: 13, color: C.muted, margin: "0 0 6px" }}>Campos faltantes ({comp.faltantes.length})</h3>
          {comp.faltantes.length === 0 ? <span style={{ fontSize: 13 }}>Ninguno.</span> : <p style={{ fontSize: 13, margin: 0 }}>{comp.faltantes.join(" · ")}</p>}
          <p style={{ fontSize: 12, color: C.tenue, marginTop: 14 }}>Historial de cambios de estado: no disponible (la carpeta de trabajo de Cowork no tiene control de versiones).</p>
        </Card>
      </main>
    </div>
  );
}
