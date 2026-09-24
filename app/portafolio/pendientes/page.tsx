import Link from "next/link";
import PortafolioNav from "@/components/portafolio/PortafolioNav";
import { td, th } from "@/components/portafolio/v2/charts";
import { C, Card, H2, NoRep, h1, main, numStyle, page, sub } from "@/components/portafolio/v2/ui";
import { completitud, mesesSinDato } from "@/lib/portfolio/fondoV2";
import { fechaCorta, usdK } from "@/lib/portfolio/formatV2";
import { getPortafolio } from "@/lib/portfolio/portafolioV2";
import { getAllTareas } from "@/lib/portfolio/tareasData";

export const dynamic = "force-dynamic";

/** Por qué importa cada hueco, a quién se le pide y qué tanto mueve las cifras del fondo (tier 0 = capital y NAV). */
const HUECO: Record<string, { porque: string; a: "startup" | "arturo"; tier: number }> = {
  "Documento localizado": { porque: "Sin contrato el capital desplegado solo se apoya en el Excel del gestor anterior.", a: "arturo", tier: 0 },
  "Monto invertido": { porque: "Mueve el capital desplegado y el NAV.", a: "arturo", tier: 0 },
  "Valuación actual": { porque: "Define el valor de la posición y el MOIC.", a: "startup", tier: 0 },
  "Participación actual": { porque: "Define el valor de la posición y el MOIC.", a: "arturo", tier: 0 },
  "Instrumento": { porque: "Define derechos, cap y descuento de la posición.", a: "arturo", tier: 0 },
  "Fecha de inversión": { porque: "Necesaria para el IRR con fechas reales.", a: "arturo", tier: 1 },
  "Revenue del último periodo": { porque: "Sin revenue no se puede comparar tracción ni calcular el semáforo.", a: "startup", tier: 1 },
  "Crecimiento QoQ": { porque: "Requiere dos trimestres consecutivos con revenue confiable.", a: "startup", tier: 1 },
  "Clientes o usuarios": { porque: "Indicador de tracción homologable.", a: "startup", tier: 2 },
  "EBITDA o burn": { porque: "Sin él no se sabe si la startup crece quemando o generando.", a: "startup", tier: 1 },
  "Caja": { porque: "Necesaria para el runway y las decisiones de follow on.", a: "startup", tier: 1 },
  "Runway": { porque: "Riesgo de caja: menos de 6 meses es alerta roja.", a: "startup", tier: 1 },
  "Reporte al corriente": { porque: "Cumplimiento de reportes (hoja Monitoring, 1Q 2026).", a: "startup", tier: 2 },
};

export default function PendientesPage() {
  const data = getPortafolio();
  const par = data.parametros;
  const tareas = getAllTareas().filter((t) => t.columna_kanban !== "completada");
  const huecos = data.startups.flatMap((s) => {
    const c = completitud(s);
    const capital = s.inversion.monto_usd.valor ?? 0;
    return c.faltantes.filter((f) => HUECO[f]).map((f) => ({ s, campo: f, ...HUECO[f], capital }));
  }).sort((a, b) => a.tier - b.tier || b.capital - a.capital);
  const abiertas = data.discrepancias.filter((d) => d.estado === "abierta");

  return (
    <div style={page}>
      <PortafolioNav active="pendientes" />
      <main style={main}>
        <h1 style={h1}>Pendientes y calidad de datos</h1>
        <p style={sub}>La información faltante o contradictoria es el mayor freno para decidir. Esta lista se recalcula sola desde los datos: cuando se cierra un hueco, desaparece.</p>
        <p style={{ ...sub, marginTop: 6 }}>{huecos.length} huecos · {abiertas.length} discrepancias abiertas · datos generados el {fechaCorta(par.ultima_actualizacion)}. Las tareas nuevas se anotan en TABLERO.md (el kanban de MOOV ya no es lista activa); abajo se muestran las tareas abiertas que ya existen para no duplicar.</p>

        <Card style={{ margin: "20px 0" }}>
          <H2 sub="Ordenado por impacto en las cifras del fondo: primero lo que mueve el capital desplegado y el NAV, luego lo que mueve la lectura operativa.">Huecos por startup</H2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
              <thead><tr><th style={th} scope="col">Startup</th><th style={th} scope="col">Dato faltante</th><th style={th} scope="col">Por qué importa</th><th style={th} scope="col">Se pide a</th><th style={{ ...th, textAlign: "right" }} scope="col">Capital en juego</th><th style={th} scope="col">Tarea abierta</th></tr></thead>
              <tbody>{huecos.map((h) => {
                const t = tareas.filter((x) => x.startup === h.s.nombre).length;
                return (
                  <tr key={h.s.id + h.campo}>
                    <td style={{ ...td, whiteSpace: "nowrap" }}><Link href={`/portafolio/startups/${h.s.id}`} style={{ color: C.text }}>{h.s.nombre}</Link></td>
                    <td style={td}>{h.campo}{h.tier === 0 && <span style={{ color: C.vigilar }} title="Mueve capital o NAV"> ▲</span>}</td>
                    <td style={{ ...td, color: C.muted, maxWidth: 360 }}>{h.porque}</td>
                    <td style={td}>{h.a === "arturo" ? "Arturo (Drive o instrumento)" : `${h.s.nombre}${h.s.responsable_moov ? ` · vía ${h.s.responsable_moov}` : ""}`}</td>
                    <td style={{ ...td, textAlign: "right", ...numStyle }}>{usdK(h.capital) ?? <NoRep texto="n/d" />}</td>
                    <td style={{ ...td, color: C.muted }}>{t ? `${t} abierta(s) de esa startup` : "Ninguna: anotar en TABLERO.md"}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: C.tenue, margin: "10px 0 0" }}>“Desde cuándo” no se puede reconstruir: la carpeta de Cowork no guarda historial. Los huecos se muestran tal como están en el corte actual.</p>
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <H2 sub="Cada una con las dos versiones lado a lado. No se resuelven aquí: se resuelven contra documento.">Discrepancias abiertas ({abiertas.length})</H2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
              <thead><tr><th style={th} scope="col">ID</th><th style={th} scope="col">Startup · campo</th><th style={th} scope="col">Versión A</th><th style={th} scope="col">Versión B</th><th style={th} scope="col">Impacto</th><th style={th} scope="col">Acción</th></tr></thead>
              <tbody>{abiertas.map((d) => (
                <tr key={d.id}>
                  <td style={{ ...td, whiteSpace: "nowrap", fontWeight: 600 }}>{d.id}{d.material && <span title="Afecta monto o valuación" style={{ color: C.vigilar }}> ▲</span>}</td>
                  <td style={td}>{d.startup ?? "Fondo"} · {d.campo}</td>
                  <td style={td}><div style={{ fontSize: 11, color: C.muted }}>{d.fuente_a}</div>{d.valor_a}</td>
                  <td style={td}><div style={{ fontSize: 11, color: C.muted }}>{d.fuente_b}</div>{d.valor_b}</td>
                  <td style={{ ...td, color: C.muted }}>{d.impacto}</td>
                  <td style={td}>{d.accion}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>

        <Card>
          <H2 sub="Según la hoja Monitoring del Excel (1Q 2026) y el último dato conocido al corte.">Cumplimiento de reportes</H2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr><th style={th} scope="col">Startup</th><th style={th} scope="col">Monitoring</th><th style={th} scope="col">Frecuencia</th><th style={th} scope="col">Último dato</th></tr></thead>
            <tbody>{data.startups.map((s) => {
              const m = mesesSinDato(s, par.fecha_corte_vista);
              return (
                <tr key={s.id}>
                  <td style={td}>{s.nombre}</td>
                  <td style={td}>{s.reporte.al_corriente ? <span style={{ color: C.sano }}>✓ {s.reporte.nota_monitoring}</span> : <span style={{ color: C.vigilar }}>Pendiente{s.reporte.nota_monitoring ? ` · ${s.reporte.nota_monitoring}` : ""}</span>}</td>
                  <td style={td}>{s.reporte.frecuencia === "ninguna" ? <NoRep texto="Ninguna" /> : s.reporte.frecuencia}</td>
                  <td style={td}>{m == null ? <NoRep texto="Sin dato" /> : `${fechaCorta(s.reporte.ultimo_periodo_reportado)} (hace ${m} m)`}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </Card>
      </main>
    </div>
  );
}
