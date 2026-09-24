import raw from "./portfolio-v2.json";
import { PortafolioV2Schema, type PortafolioV2, type StartupV2 } from "./schemaV2";

/** Se valida en build (import estático): si el JSON v2 rompe el schema, `npm run build` falla. */
const DATA: PortafolioV2 = PortafolioV2Schema.parse(raw);

export const getPortafolio = (): PortafolioV2 => DATA;
export const getStartupV2 = (id: string): StartupV2 | undefined => DATA.startups.find((s) => s.id === id);
