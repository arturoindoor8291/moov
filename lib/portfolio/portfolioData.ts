import rawData from "./portfolio-data.json";
import { PortfolioDataSchema, type StartupWithId, type PortfolioFondo } from "./portfolioSchemas";

/**
 * portfolio-data.json is produced by Cowork (Claude + Google Drive) in
 * /Users/.../MOOV/cowork/portfolio-data.json, then copied here manually —
 * this repo copy is the only one the deployed site ever reads. It's
 * imported directly (not fetched), so it's bundled into the server at
 * build time and never exposed as a public static asset — the only way to
 * reach it is through pages/routes that sit behind proxy.ts's /portafolio
 * auth gate. See app/portafolio/README.md for the full update flow.
 */
const PORTFOLIO_DATA = PortfolioDataSchema.parse(rawData);

/** "Vera AI" -> "vera-ai". Deterministic, no accents, URL-safe. */
function slugify(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getAllStartups(): StartupWithId[] {
  return PORTFOLIO_DATA.startups.map((s) => ({ ...s, id: slugify(s.nombre) }));
}

export function getStartupById(id: string): StartupWithId | undefined {
  return getAllStartups().find((s) => s.id === id);
}

export function getPortfolioOverview(): PortfolioFondo {
  return PORTFOLIO_DATA.fondo;
}

export function getUltimaActualizacion(): string {
  return PORTFOLIO_DATA.ultima_actualizacion;
}
