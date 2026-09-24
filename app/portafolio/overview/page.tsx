import PortafolioNav from "@/components/portafolio/PortafolioNav";
import { BarraApilada, BarrasH, EvolucionFondo, RevenueApilado, td, th } from "@/components/portafolio/v2/charts";
import { C, Card, H2, LenteToggle, NoRep, Punto, h1, main, numStyle, page, sub } from "@/components/portafolio/v2/ui";
import { calcularFondo, crecimientoQoQ, lecturaComite, mesesSinDato, trimestresComparables, ultimoValor, UMBRALES, type Lente } from "@/lib/portfolio/fondoV2";
import { fechaCorta, meses, mult, pct1, signed, spct, usd, usdK } from "@/lib/portfolio/formatV2";
import { getPortafolio } from "@/lib/portfolio/portafolioV2";
import { getAllTareas } from "@/lib/portfolio/tareasData";
import { semaforoFrescura } from "@/lib/portfolio/calculos";
import Link from "next/link";

export const dynamic = "force-dynamic";

function Kpi({ etiqueta, valor, nota, delta, fuente, fuenteNota }: { etiqueta: string; valor: string; nota?: string; delta?: { txt: string; dir: "up" | "down" | "flat" } | null; fuente: string; fuenteNota: string }) {
  const flecha = delta?.dir === "up" ? "▲" : delta?.dir === "down" ? "▼" : "▬";
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "14px 16px", minWidth: 0 }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{etiqueta}<Punto fuente={fuente} nota={fuenteNota} /></div>
      <div style={{ fontSize: 24, fontWeight: 700, ...numStyle }}>{valor}</div>
      {nota && <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>{nota}</div>}
      <div style={{ fontSize: 12, marginTop: 4, color: delta ? (delta.dir === "down" ? C.critico : delta.dir === "up" ? C.sano : C.muted) : C.tenue }}>
        {delta ? `${flecha} ${delta.txt}` : "Sin periodo anterior comparable"}
      </div>
    </div>
  );
}

export default async function FondoPage({ searchParams }: { searchParams: Promise<{ lente?: string }> }) {
  const sp = await searchParams;
  const lente: Lente = sp.lente === "costo" ? "costo" : "valor_justo";
  const data = getPortafolio();
  const par = data.parametros;
  const f = calcularFondo(data, lente);
  const ss = data.startups;
  const h = par.historico_excel;
  const trims = Object.keys(h.capital);
  const prev = trims.at(-2)!;
  const capPrev = h.capital[prev], navPrev = h.nav[prev], tvpiPrev = h.tvpi[prev];
  const gastosPrev = h.gastos_acumulados[prev] ?? 0;
  const dryPrev = par.tamano_usd - capPrev - (par.gastos_salen_del_fondo ? gastosPrev : 0);
  const conPrev = lente === "valor_justo";
  const dPct = (a: number, b: number) => `${spct((a / b - 1) * 100)} vs ${prev}`;
  const dir = (a: number, b: number) => (a > b ? "up" : a < b ? "down" : "flat") as "up" | "down" | "flat";
  const lectura = lecturaComite(data, f);
  const { max: maxRev, filas: revAgg } = trimestresComparables(f.revenue);
  const ocultos = f.revenue.filter((r) => !revAgg.includes(r)).map((r) => r.periodo);
  const conRev = ss.filter((s) => s.serie_trimestral.some((p) => p.revenue_usd.valor != null && !p.revenue_usd.en_duda));
  const nombresRev = ss.filter((s) => revAgg.some((r) => r.por[s.nombre])).map((s) => s.nombre);
  const enDuda = ss.filter((s) => s.serie_trimestral.some((p) => p.revenue_usd.en_duda)).map((s) => s.nombre);
  const ultRev = revAgg.filter((r) => Object.keys(r.por).length >= 5).at(-1) ?? revAgg.at(-1);
  const lider = ultRev ? Object.entries(ultRev.por).sort((a, b) => b[1] - a[1])[0] : null;
  const fuenteCap = f.capitalRespaldadoPct >= 90 ? "documento" : "excel_bluebox";
  const nota = `${f.capitalRespaldadoPct.toFixed(0)}% del capital desplegado está respaldado con documento.`;

  // runway
  const runways = ss.map((s) => ({ s, r: ultimoValor(s, "runway_meses") })).sort((a, b) => (a.r?.dato.valor ?? 999) - (b.r?.dato.valor ?? 999));
  const tareas = getAllTareas().filter((t) => t.tipo_tarea === "decision_comite" && t.columna_kanban !== "completada");
  const decisiones = [
    ...ss.filter((s) => s.decision_pendiente).map((s) => {
      const t = tareas.find((x) => x.startup === s.nombre);
      return { startup: s.nombre, texto: s.decision_pendiente!, fecha: t?.fecha_limite ?? null, dueno: t?.responsable ?? null };
    }),
    ...tareas.filter((t) => !ss.some((s) => s.nombre === t.startup && s.decision_pendiente)).map((t) => ({ startup: t.startup, texto: t.tarea, fecha: t.fecha_limite, dueno: t.responsable })),
  ].slice(0, 6);
  const etapas = ["scouteada", "first_assessment", "analisis", "compromiso", "inversion"] as const;
  const etapaLabel = { scouteada: "Scouteadas", first_assessment: "First assessment", analisis: "Análisis de oportunidad", compromiso: "Compromisos", inversion: "Inversiones" };
  const sinDoc = ss.filter((s) => !s.inversion.documento_localizado);

  return (
    <div style={page}>
      <PortafolioNav active="overview" />
      <main style={main}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
          <div>
            <h1 style={h1}>Fondo</h1>
            <p style={sub}>Marcas al {fechaCorta(par.fecha_corte_excel)} (Excel del gestor anterior) · operación hasta {fechaCorta(par.fecha_corte_vista)} · actualizado {fechaCorta(par.ultima_actualizacion)}</p>
            <p style={{ ...sub, marginTop: 8, display: "flex", gap: 18, flexWrap: "wrap" }}>
              <span>Capital respaldado con documento: <strong style={{ color: C.text }}>{pct1(f.capitalRespaldadoPct)}</strong> del desplegado</span>
              <span>Startups con dato de menos de 6 meses: <strong style={{ color: C.text }}>{f.startupsFrescas} de {ss.length}</strong></span>
            </p>
          </div>
          <LenteToggle lente={lente} base="/portafolio/overview" />
        </div>
        <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>
          {lente === "costo"
            ? "Lente A costo: solo cuenta capital con documento localizado y cada posición vale lo que costó. Es la vista conservadora."
            : "Lente A valor justo: usa el capital y las marcas del Excel del gestor anterior (etiquetados, sin respaldo documental) hasta que haya documento."}
        </p>

        {/* 7.2 KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 20 }}>
          <Kpi etiqueta="Tamaño del fondo · vintage" valor={usdK(par.tamano_usd)!} nota={`Vintage ${par.vintage}`} fuente="documento" fuenteNota="Parámetro del fondo" />
          <Kpi etiqueta="Capital desplegado" valor={usdK(f.capital)!} nota={`${pct1((f.capital / par.tamano_usd) * 100)} del fondo${lente === "valor_justo" && f.capitalSinDocumento > 0 ? ` · ${usd(f.capitalSinDocumento)} USD sin contrato localizado` : ""}`} delta={conPrev ? { txt: dPct(f.capital, capPrev), dir: dir(f.capital, capPrev) } : null} fuente={fuenteCap} fuenteNota={nota} />
          <Kpi etiqueta="Valor actual del portafolio (NAV)" valor={usdK(f.nav)!} delta={conPrev ? { txt: dPct(f.nav, navPrev), dir: dir(f.nav, navPrev) } : null} fuente={fuenteCap} fuenteNota={nota} />
          <Kpi etiqueta="MOIC bruto" valor={mult(f.moicBruto)!} nota="Valor de posiciones / capital desplegado" delta={conPrev ? { txt: `${((f.moicBruto! - navPrev / capPrev)).toFixed(2)} vs ${prev}`, dir: dir(f.moicBruto!, navPrev / capPrev) } : null} fuente={fuenteCap} fuenteNota={nota} />
          <Kpi etiqueta="TVPI neto" valor={mult(f.tvpi)!} nota="Después de gastos del fondo" delta={conPrev ? { txt: `${(f.tvpi! - tvpiPrev).toFixed(2)} vs ${prev}`, dir: dir(f.tvpi!, tvpiPrev) } : null} fuente={fuenteCap} fuenteNota={nota} />
          <Kpi etiqueta="DPI · RVPI" valor={`${mult(0)} · ${mult(f.rvpi)}`} nota="Sin salidas ni distribuciones todavía" delta={{ txt: "sin cambio", dir: "flat" }} fuente="documento" fuenteNota="No hay distribuciones registradas" />
          <Kpi etiqueta="IRR no realizada" valor={f.irr == null ? "No disponible" : pct1(f.irr * 100)!} nota="Anualizada, con fechas reales (XIRR). En un fondo de 2 a 3 años con marcas casi sin movimiento no es una señal fuerte." delta={conPrev ? { txt: `Excel al ${trims.at(-1)}: ${pct1(h.irr_anualizada[trims.at(-1)!] * 100)}`, dir: "flat" } : null} fuente="estimado" fuenteNota="Calculada con fechas de inversión; las que solo tienen trimestre usan mitad de trimestre." />
          <Kpi etiqueta="Dry powder (capital disponible)" valor={usdK(f.dryPowder)!} nota={`Cubre ${f.followOnsReferencia.toLocaleString("es-MX")} tickets promedio (${usdK(f.ticketPromedio)})`} delta={conPrev ? { txt: `${signed(f.dryPowder - dryPrev)} vs ${prev}`, dir: dir(f.dryPowder, dryPrev) } : null} fuente={fuenteCap} fuenteNota="Tamaño del fondo − capital desplegado − gastos de inversión (los fees salen del fondo)." />
        </div>

        {/* 7.3 lectura */}
        <Card style={{ marginBottom: 20 }}>
          <H2 sub="Frases calculadas por reglas con umbrales en código (no las escribe una IA). Si un umbral no se cumple, la frase no aparece.">Lectura del comité</H2>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, fontSize: 14, lineHeight: 1.55 }}>{lectura.map((l) => <li key={l}>{l}</li>)}</ul>
        </Card>

        {/* 7.4 evolución */}
        <Card style={{ marginBottom: 20 }}>
          <H2 sub={lente === "costo" ? "La evolución histórica solo existe en el Excel del gestor anterior, por eso se muestra igual en ambas lentes." : undefined}>Evolución del fondo por trimestre</H2>
          <EvolucionFondo capital={h.capital} nav={h.nav} tvpi={h.tvpi} irr={h.irr_anualizada} />
        </Card>

        {/* 7.5 valor */}
        <Card style={{ marginBottom: 20 }}>
          <H2 sub="Costo contra valor actual por posición, ordenado por ganancia o pérdida no realizada. No todas las marcas valen igual: la etiqueta dice en qué se apoya cada una.">De dónde viene el valor</H2>
          <div style={{ display: "grid", gap: 10 }}>
            {f.pos.map((p) => {
              const max = Math.max(...f.pos.map((x) => Math.max(x.costo ?? 0, x.valor ?? 0)), 1);
              const base = { ronda_pricing: "Ronda con precio", cap_safe: "Cap de SAFE o nota", a_costo: "A costo", otra: "Por dilución" }[p.base_marca];
              return (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "minmax(90px,130px) 1fr minmax(170px,230px)", gap: 12, alignItems: "center", fontSize: 13 }}>
                  <Link href={`/portafolio/startups/${p.id}`} style={{ color: C.text }}>{p.nombre}</Link>
                  <div aria-hidden>
                    <div style={{ height: 8, width: `${((p.costo ?? 0) / max) * 100}%`, background: C.gris, borderRadius: 3, marginBottom: 3 }} />
                    <div style={{ height: 8, width: `${((p.valor ?? 0) / max) * 100}%`, background: p.delta < 0 ? C.critico : C.azul, borderRadius: 3 }} />
                  </div>
                  <div style={{ ...numStyle, lineHeight: 1.35 }}>
                    <span style={{ color: p.delta > 0 ? C.sano : p.delta < 0 ? C.critico : C.muted, fontWeight: 600 }}>{p.delta === 0 ? "$0" : signed(p.delta)}</span>{" "}
                    <span style={{ color: C.muted }}>· {p.moic != null ? mult(p.moic) : "sin monto"}</span>
                    <div style={{ fontSize: 11, color: C.tenue }} title={p.nota}>Costo {usdK(p.costo) ?? "n/d"} → {usdK(p.valor) ?? "n/d"} · {base}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: C.muted, margin: "14px 0 0", ...numStyle }}>
            Suma: costo {usd(f.capital)} + ganancia neta {signed(f.gananciaTotal)} = valor {usd(f.nav)}, MOIC bruto {mult(f.moicBruto)}. Barra gris: costo. Barra azul (roja si baja): valor actual.
          </p>
          {lente === "valor_justo" && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontSize: 13 }}>Brecha entre capital del Excel y capital con documento ({usd(f.capitalJusto - f.capitalDoc)} USD)</summary>
              <table style={{ borderCollapse: "collapse", marginTop: 8, fontSize: 12, width: "100%", maxWidth: 640 }}>
                <thead><tr><th style={th}>Startup</th><th style={{ ...th, textAlign: "right" }}>Excel</th><th style={{ ...th, textAlign: "right" }}>Con documento</th><th style={{ ...th, textAlign: "right" }}>Diferencia</th></tr></thead>
                <tbody>{f.brecha.map((b) => (
                  <tr key={b.nombre}><td style={td}>{b.nombre}</td><td style={{ ...td, textAlign: "right", ...numStyle }}>{usd(b.excel)}</td><td style={{ ...td, textAlign: "right", ...numStyle }}>{b.documento == null ? <NoRep texto="Sin documento" /> : usd(b.documento)}</td><td style={{ ...td, textAlign: "right", ...numStyle }}>{signed(b.diferencia)}</td></tr>
                ))}</tbody>
              </table>
              <p style={{ fontSize: 12, color: C.muted }}>Cuatro posiciones (Kigo, Autolab, Ruedata, Bemycar) solo están en el Excel; en tres SPV (Ualabee, Mobi, Leasy) los montos difieren entre fuentes. Detalle en Pendientes (D-01 y D-02).</p>
            </details>
          )}
        </Card>

        {/* 7.6 construcción */}
        <Card style={{ marginBottom: 20 }}>
          <H2 sub={par.objetivos_construccion.son_objetivos ? undefined : `Composición actual por número de empresas (Core ${par.objetivos_construccion.core}, Adyacente ${par.objetivos_construccion.adyacente}, Transformacional ${par.objetivos_construccion.transformacional}). No hay objetivos confirmados, por eso no se muestra meta.`}>Construcción de portafolio</H2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28, marginBottom: 22 }}>
            <BarrasH titulo="Por vehículo" filas={f.porVehiculo} total={f.capital} />
            <BarrasH titulo="Por tipo de portafolio" filas={f.porTipo} total={f.capital} />
            <BarrasH titulo="Por sector" filas={f.porSector} total={f.capital} />
            <BarrasH titulo="Por país donde opera (capital repartido en partes iguales)" filas={f.porPais} total={f.capital} />
            <div>
              <BarrasH titulo="Por instrumento legal" filas={f.porInstrumento} total={f.capital} />
              <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{sinDoc.length} de {ss.length} posiciones sin contrato localizado: {sinDoc.map((s) => s.nombre).join(", ")}.</p>
            </div>
          </div>
          <h3 style={{ fontSize: 13, color: C.muted, margin: "0 0 10px", fontWeight: 600 }}>Concentración del capital desplegado por startup</h3>
          <BarraApilada items={f.concentracion} alerta={UMBRALES.concentracion_pct} />
        </Card>

        {/* 7.7 desempeño */}
        <Card style={{ marginBottom: 20 }}>
          <H2 sub={`Suma del revenue trimestral en USD de las ${conRev.length} startups con dato confiable, tomado de los reportes de cada startup (el Excel solo llena lo que no tiene reporte). Excluye los datos en duda: ${enDuda.length ? enDuda.join(", ") : "ninguno"}. Los reportes en EUR (Bemycar) se convierten a 1.18 USD por EUR, un estimado. No se muestra la suma de valuaciones de las empresas porque no significa nada para el fondo.`}>Desempeño operativo agregado</H2>
          <RevenueApilado datos={revAgg} nombres={nombresRev} maxN={maxRev} />
          {ocultos.length > 0 && <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>No se grafican {ocultos.join(", ")}: reportan muy pocas startups y la suma caería por falta de datos, no por desempeño. Los reportes 2026 de Leasy, Bemycar, Ruedata y Drivana están en cada ficha.</p>}
          <p style={{ fontSize: 12, color: C.tenue, margin: "4px 0 0" }}>Comparabilidad: la composición cambia entre trimestres (por ejemplo Leasy entra a la suma desde el 2Q 2025, cuando empieza su serie); el número de startups aparece bajo cada barra.</p>
          {lider && ultRev && <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>{lider[0]} aporta {pct1((lider[1] / ultRev.total) * 100)} del revenue agregado del {ultRev.periodo} (barra azul).</p>}
          <h3 style={{ fontSize: 13, color: C.muted, margin: "20px 0 8px", fontWeight: 600 }}>Quién crece y quién quema</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
              <thead><tr><th style={th} scope="col">Startup</th><th style={{ ...th, textAlign: "right" }} scope="col">Crecimiento QoQ</th><th style={{ ...th, textAlign: "right" }} scope="col">EBITDA último periodo</th><th style={th} scope="col">Periodo</th></tr></thead>
              <tbody>
                {[...ss].sort((a, b) => (crecimientoQoQ(b)?.pct ?? -1e9) - (crecimientoQoQ(a)?.pct ?? -1e9)).map((s) => {
                  const q = crecimientoQoQ(s), e = ultimoValor(s, "ebitda_usd", { sinDuda: true }), b = ultimoValor(s, "burn_usd");
                  return (
                    <tr key={s.id}>
                      <td style={td}><Link href={`/portafolio/startups/${s.id}`} style={{ color: C.text }}>{s.nombre}</Link></td>
                      <td style={{ ...td, textAlign: "right", ...numStyle, color: q ? (q.pct >= 0 ? C.sano : C.critico) : undefined }}>{q ? spct(q.pct) : <NoRep texto="Sin dato" />}</td>
                      <td style={{ ...td, textAlign: "right", ...numStyle }}>{e?.dato.valor != null ? signed(e.dato.valor) : b?.dato.valor != null ? `${signed(b.dato.valor)} (burn)` : <NoRep texto="Sin dato" />}</td>
                      <td style={{ ...td, color: C.muted }}>{e?.periodo ?? q?.periodo ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 7.8 riesgo y caja */}
        <Card style={{ marginBottom: 20 }}>
          <H2 sub={`Menos de ${UMBRALES.runway_meses} meses de caja en rojo.`}>Riesgo y caja</H2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 28 }}>
            <div style={{ minWidth: 0, overflowX: "auto" }}>
              <h3 style={{ fontSize: 13, color: C.muted, margin: "0 0 8px" }}>Runway del portafolio</h3>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr><th style={th} scope="col">Startup</th><th style={{ ...th, textAlign: "right" }} scope="col">Meses de caja</th><th style={th} scope="col">Estado</th></tr></thead>
                <tbody>{runways.map(({ s, r }) => {
                  const v = r?.dato.valor ?? null;
                  const rojo = (v != null && v < UMBRALES.runway_meses) || s.crisis_caja_reportada;
                  return (
                    <tr key={s.id}>
                      <td style={td}>{s.nombre}</td>
                      <td style={{ ...td, textAlign: "right", ...numStyle, color: rojo ? C.critico : undefined, fontWeight: rojo ? 700 : 400 }}>{v != null ? meses(v) : s.crisis_caja_reportada ? "Crisis de caja" : <NoRep />}{r && <Punto fuente={r.dato.fuente} fecha={r.dato.fecha_dato} nota={r.dato.nota} />}</td>
                      <td style={td}>{rojo ? <span style={{ color: C.critico }}>✕ Caja corta</span> : <span style={{ color: C.muted }}>—</span>}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            <div style={{ minWidth: 0, overflowX: "auto" }}>
              <h3 style={{ fontSize: 13, color: C.muted, margin: "0 0 8px" }}>Cobertura documental y cumplimiento de reportes</h3>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr><th style={th} scope="col">Startup</th><th style={th} scope="col">Contrato</th><th style={th} scope="col">Reporte (1Q 2026)</th><th style={th} scope="col">Último dato</th></tr></thead>
                <tbody>{ss.map((s) => {
                  const m = mesesSinDato(s, par.fecha_corte_vista), fr = semaforoFrescura(m);
                  return (
                    <tr key={s.id}>
                      <td style={td}>{s.nombre}</td>
                      <td style={td}>{s.inversion.documento_localizado ? <span style={{ color: C.sano }}>✓ Localizado</span> : <span style={{ color: C.vigilar }}>Pendiente de contrato</span>}</td>
                      <td style={td}>{s.reporte.al_corriente == null ? <NoRep /> : s.reporte.al_corriente ? <span style={{ color: C.sano }}>✓ {s.reporte.nota_monitoring ?? "Al corriente"}</span> : <span style={{ color: C.vigilar }}>Pendiente{s.reporte.nota_monitoring ? ` · ${s.reporte.nota_monitoring}` : ""}</span>}</td>
                      <td style={{ ...td, color: fr === "verde" ? C.sano : fr === "amarillo" ? C.vigilar : fr === "rojo" ? C.critico : C.tenue }}>{m == null ? "Sin dato" : `${fechaCorta(s.reporte.ultimo_periodo_reportado)} (${m} m)`}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* 7.9 capital y pipeline */}
        <Card style={{ marginBottom: 20 }}>
          <H2>Capital disponible y pipeline</H2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 28 }}>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              <div>Dry powder: <strong>{usd(f.dryPowder)}</strong> USD</div>
              <div>Gastos de inversión: <strong>{usd(f.gastos)}</strong> USD (todos fees de SPV; salen del tamaño del fondo)</div>
              <div>Capacidad de follow on: {f.followOnsReferencia.toLocaleString("es-MX")} tickets promedio de {usd(f.ticketPromedio)} USD</div>
              <div>Reservas asignadas: {par.reservas_followon_usd == null ? <NoRep texto="Sin definir (pendiente de confirmar con el director)" /> : usd(par.reservas_followon_usd)}</div>
            </div>
            <div>
              <h3 style={{ fontSize: 13, color: C.muted, margin: "0 0 8px" }}>Embudo de scouting (acumulado)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 6 }}>
                {etapas.map((e) => {
                  const n = data.pipeline.filter((p) => p.etapa === e).length;
                  const derivable = e === "first_assessment" || e === "analisis";
                  return (
                    <div key={e} style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, ...numStyle }}>{derivable || n ? n : "—"}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{etapaLabel[e]}</div>
                      {!derivable && !n && <div style={{ fontSize: 10, color: C.tenue, fontStyle: "italic" }}>Sin captura</div>}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>Derivado de oportunidades-inversion.json ({data.pipeline.map((p) => p.startup).join(", ") || "sin prospectos"}). El Excel del gestor anterior tenía el embudo vacío.</p>
            </div>
          </div>
        </Card>

        {/* 7.10 decisiones */}
        <Card style={{ marginBottom: 20 }}>
          <H2>Decisiones abiertas</H2>
          {decisiones.length === 0 ? <NoRep texto="Sin decisiones abiertas" /> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
                <thead><tr><th style={th} scope="col">Startup</th><th style={th} scope="col">Decisión</th><th style={th} scope="col">Fecha límite</th><th style={th} scope="col">Dueño</th></tr></thead>
                <tbody>{decisiones.map((d) => (
                  <tr key={d.startup + d.texto}>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{d.startup}</td><td style={td}>{d.texto}</td>
                    <td style={td}>{d.fecha ? fechaCorta(d.fecha.slice(0, 10)) : <NoRep texto="Sin fecha" />}</td><td style={td}>{d.dueno ?? <NoRep texto="Sin dueño" />}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <details>
            <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Cómo se calcula</summary>
            <ul style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, paddingLeft: 18 }}>
              <li><strong>Valor de la posición</strong> = participación actual × valuación actual. <strong>MOIC</strong> = valor / monto invertido. MOIC bruto del fondo = suma de valores / capital desplegado.</li>
              <li><strong>TVPI</strong> = (NAV + distribuciones) / (capital desplegado + gastos del fondo). El Excel usa (NAV − gastos) / capital (1.0046 vs 1.0045): misma idea, diferencia de fórmula.</li>
              <li><strong>DPI</strong> = distribuciones / capital desplegado. <strong>RVPI</strong> = NAV / (capital + gastos).</li>
              <li><strong>IRR no realizada</strong>: XIRR con las fechas de inversión y el NAV como flujo final; no se ha realizado nada.</li>
              <li><strong>Dry powder</strong> = tamaño del fondo − capital desplegado − gastos de inversión.</li>
              <li><strong>Frescura</strong>: meses entre el último dato y el corte. 0 a 3 verde, 4 a 6 amarillo, más de 6 rojo.</li>
              <li><strong>Punto de color</strong>: verde = documento; azul = reporte de la startup; gris = Excel del gestor anterior o estimado; vacío = no reportado.</li>
              <li><strong>Política de valuación</strong>: {par.politica_valuacion}</li>
            </ul>
          </details>
        </Card>
      </main>
    </div>
  );
}
