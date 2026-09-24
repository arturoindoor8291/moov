/**
 * Genera lib/portfolio/portfolio-v2.json a partir de portfolio-data.json (v1,
 * lo que actualiza Cowork) + excel-bluebox-seed.json. Uso: npm run portafolio:migrar
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { migrar } from "../lib/portfolio/migracion.ts";
import { PortafolioV2Schema } from "../lib/portfolio/schemaV2.ts";

const dir = new URL("../lib/portfolio/", import.meta.url);
const v1 = JSON.parse(readFileSync(new URL("portfolio-data.json", dir), "utf8"));
const seed = JSON.parse(readFileSync(new URL("excel-bluebox-seed.json", dir), "utf8"));
const opsUrl = new URL("../../cowork/oportunidades-inversion.json", import.meta.url);
const ops = existsSync(opsUrl) ? JSON.parse(readFileSync(opsUrl, "utf8")) : null;
const v2 = PortafolioV2Schema.parse(migrar(v1, seed, ops));
// En Vercel no existe la carpeta cowork/: se conserva el embudo ya guardado en el JSON v2.
const destino = new URL("portfolio-v2.json", dir);
if (!ops && existsSync(destino)) v2.pipeline = JSON.parse(readFileSync(destino, "utf8")).pipeline ?? [];
writeFileSync(new URL("portfolio-v2.json", dir), JSON.stringify(v2, null, 2) + "\n");
console.log(`portfolio-v2.json generado: ${v2.startups.length} startups, ${v2.discrepancias.length} discrepancias.`);
