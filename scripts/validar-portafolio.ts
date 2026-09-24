/**
 * npm run portafolio:validar
 * 1) valida portfolio-v2.json contra el schema, 2) detecta si quedó desfasado
 * respecto a portfolio-data.json (lo que actualiza Cowork), 3) calcula
 * completitud por startup y 4) lista discrepancias abiertas.
 * Sale con código 1 si el JSON no valida o está desfasado.
 */
import { readFileSync } from "node:fs";
import { calcularFondo, completitud, estadoSugerido } from "../lib/portfolio/fondoV2.ts";
import { migrar } from "../lib/portfolio/migracion.ts";
import { PortafolioV2Schema } from "../lib/portfolio/schemaV2.ts";

const dir = new URL("../lib/portfolio/", import.meta.url);
const leer = (f: string) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));
let fallo = false;

const parsed = PortafolioV2Schema.safeParse(leer("portfolio-v2.json"));
if (!parsed.success) {
  console.error("✕ portfolio-v2.json NO valida contra schemaV2:");
  for (const i of parsed.error.issues.slice(0, 15)) console.error(`  - ${i.path.join(".")}: ${i.message}`);
  process.exit(1);
}
const v2 = parsed.data;
console.log(`✓ portfolio-v2.json valida (${v2.startups.length} startups, ${v2.discrepancias.length} discrepancias).`);

const regenerado = PortafolioV2Schema.parse(migrar(leer("portfolio-data.json"), leer("excel-bluebox-seed.json"), null));
const sinPipeline = (x: unknown) => JSON.stringify({ ...(x as object), pipeline: [] });
if (sinPipeline(regenerado) !== sinPipeline(v2)) {
  console.error("✕ portfolio-v2.json está DESFASADO de portfolio-data.json. Corre: npm run portafolio:migrar");
  fallo = true;
} else console.log("✓ portfolio-v2.json coincide con portfolio-data.json (v1) + seed del Excel.");

console.log("\nCompletitud por startup (campos clave con dato):");
for (const s of [...v2.startups].sort((a, b) => completitud(a).pct - completitud(b).pct)) {
  const c = completitud(s);
  const sug = estadoSugerido(s, v2.discrepancias, v2.parametros.fecha_corte_vista).valor;
  console.log(`  ${s.nombre.padEnd(11)} ${c.pct.toFixed(0).padStart(3)}%  asignado=${s.estado_asignado.padEnd(7)} sugerido=${sug.padEnd(7)} faltan: ${c.faltantes.join(", ") || "—"}`);
}

const j = calcularFondo(v2, "valor_justo"), c = calcularFondo(v2, "costo");
console.log(`\nFondo (valor justo): capital ${Math.round(j.capital)} · NAV ${Math.round(j.nav)} · MOIC ${j.moicBruto?.toFixed(4)} · TVPI ${j.tvpi?.toFixed(4)} · dry powder ${Math.round(j.dryPowder)}`);
console.log(`Fondo (a costo, con documento): capital ${Math.round(c.capital)} · ${j.capitalRespaldadoPct.toFixed(0)}% del capital del Excel respaldado`);

const abiertas = v2.discrepancias.filter((d) => d.estado === "abierta");
console.log(`\nDiscrepancias abiertas (${abiertas.length}):`);
for (const d of abiertas) console.log(`  ${d.id}${d.material ? " ▲" : "  "} ${(d.startup ?? "Fondo").padEnd(11)} ${d.campo} → ${d.accion}`);
process.exit(fallo ? 1 : 0);
