import { z } from "zod";

/**
 * Shape of portfolio-data.json as produced by Cowork (Claude + Google
 * Drive) — this is the real, natural shape of the research, not a shape
 * we imposed. Spanish field names, free text where the source documents
 * are free text (legal.instrumento, financiero.metrica_principal), and
 * loose/optional fields where different startups report different things
 * (financiero carries a few extra numeric fields — arr, ebitda, etc. —
 * only on the startups that report them).
 */
export const StartupEstadoSchema = z.enum(["sano", "vigilar", "critico"]);

export const StartupLegalSchema = z
  .object({
    instrumento: z.string().nullable(),
    monto_usd: z.number().nullable(),
    fecha_inversion: z.string().nullable(),
    cap_usd: z.number().nullable(),
    vencimiento: z.string().nullable(),
    entidad: z.string().nullable(),
    notas: z.string(),
    pre_money_usd: z.number().optional(),
  })
  .passthrough();

export const StartupFinancieroSchema = z
  .object({
    metrica_principal: z.string().nullable(),
    valor: z.number().nullable(),
    // Usually a currency code (EUR/USD/MXN), but Autolab reports a %
    // instead of an absolute figure — never assume it's a real currency.
    moneda: z.string().nullable(),
    fecha_dato: z.string().nullable(),
    tendencia: z.string(),
    // Present only on some startups, depending on what they report.
    arr: z.number().optional(),
    ebitda: z.number().optional(),
    margen_ebitda_pct: z.number().optional(),
    arr_objetivo: z.number().optional(),
  })
  .passthrough();

export const StartupDataSchema = z.object({
  nombre: z.string(),
  estado: StartupEstadoSchema,
  sector: z.string(),
  paises: z.array(z.string()),
  modelo_negocio: z.string(),
  legal: StartupLegalSchema,
  financiero: StartupFinancieroSchema,
  situacion_actual: z.string(),
  proximos_pasos: z.array(z.string()),
  alertas: z.array(z.string()),
});

export type StartupData = z.infer<typeof StartupDataSchema>;

/** Startup + derived routing slug (not present in the source JSON). */
export type StartupWithId = StartupData & { id: string };

export const PortfolioFondoSchema = z.object({
  nombre: z.string(),
  entidad: z.string(),
  total_invertido_confirmado_usd: z.number(),
  startups_total: z.number(),
  startups_sanas: z.number(),
  startups_vigilar: z.number(),
  startups_criticas: z.number(),
  startups_sin_monto_confirmado: z.array(z.string()),
  moic_a_costo: z.number(),
  crecimiento_pct_a_costo: z.number(),
  nota_crecimiento: z.string(),
  distribucion_instrumento: z.record(z.string(), z.number()),
});

export type PortfolioFondo = z.infer<typeof PortfolioFondoSchema>;

export const PortfolioDataSchema = z.object({
  ultima_actualizacion: z.string(),
  fondo: PortfolioFondoSchema,
  startups: z.array(StartupDataSchema),
});

export type PortfolioData = z.infer<typeof PortfolioDataSchema>;

/**
 * Shape of tareas-data.json — 16 tareas/compromisos extraídas de llamadas
 * con startups del portafolio y research de oportunidades. Independiente
 * de PortfolioDataSchema, no modifica el shape de las startups existentes.
 * `estado` se deja como texto libre (no enum cerrado): valores conocidos
 * hoy son "pendiente", "completado", "hallazgo_de_riesgo" y
 * "completado_con_preguntas_abiertas", pero la realidad de los datos no
 * encaja en un enum rígido — ver la misma nota de diseño en
 * PortfolioDataSchema.
 */
export const TareaSchema = z.object({
  id: z.string(),
  startup: z.string(),
  tarea: z.string(),
  descripcion: z.string(),
  nivel_importancia: z.enum(["alta", "media", "baja"]),
  responsable: z.string(),
  fecha_origen: z.string(),
  estado: z.string(),
  fecha_limite: z.string().nullable(),
});

export type Tarea = z.infer<typeof TareaSchema>;

export const TareasDataSchema = z.object({
  ultima_actualizacion: z.string(),
  tareas: z.array(TareaSchema),
});

export type TareasData = z.infer<typeof TareasDataSchema>;
