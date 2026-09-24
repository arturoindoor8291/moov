import { z } from "zod";

/**
 * Schema v2 del portafolio. Solo se CAPTURA lo que es dato; todo lo que se
 * puede calcular (fondo, NAV, MOIC, completitud, estado sugerido, frescura)
 * se deriva en lib/portfolio/calculos.ts para que las vistas no se
 * contradigan. Campos en español, igual que v1.
 */

export const FuenteDatoSchema = z.enum([
  "documento", // contrato, SAFE, comprobante, cap table firmado
  "reporte_startup", // reporte o dossier de la propia startup
  "excel_bluebox", // Excel del gestor anterior (sin respaldo documental)
  "estimado", // calculado por nosotros
  "no_disponible",
]);
export type FuenteDato = z.infer<typeof FuenteDatoSchema>;

export const EstadoSchema = z.enum(["sano", "vigilar", "critico"]);

const datoBase = {
  fuente: FuenteDatoSchema,
  fecha_dato: z.string().nullable(),
  referencia: z.string().optional(),
  nota: z.string().optional(),
  /** true = unidad o periodo dudoso: se muestra pero no entra a agregados. */
  en_duda: z.boolean().optional(),
};
export const DatoNumSchema = z.object({ valor: z.number().nullable(), ...datoBase });
export type DatoNum = z.infer<typeof DatoNumSchema>;
export const DatoTextoSchema = z.object({ valor: z.string().nullable(), ...datoBase });

export const KpiPropioSchema = z.object({ nombre: z.string(), valor: z.number().nullable(), unidad: z.string() });

export const PuntoSerieSchema = z.object({
  periodo: z.string(), // "4Q 2025" (trimestral) o "2026-08" (mensual)
  moneda_original: z.enum(["USD", "MXN", "EUR"]),
  tipo_cambio_a_usd: z.number().nullable(), // unidades de moneda original por 1 USD; null si ya es USD
  tipo_cambio_fuente: FuenteDatoSchema.nullable(),
  revenue_original: z.number().nullable(),
  revenue_usd: DatoNumSchema,
  gtv_usd: DatoNumSchema,
  gross_profit_usd: DatoNumSchema,
  ebitda_usd: DatoNumSchema,
  burn_usd: DatoNumSchema,
  caja_usd: DatoNumSchema,
  runway_meses: DatoNumSchema,
  clientes: DatoNumSchema,
  usuarios_activos: DatoNumSchema,
  equipo: DatoNumSchema,
  kpis_propios: z.array(KpiPropioSchema),
});
export type PuntoSerie = z.infer<typeof PuntoSerieSchema>;

export const RondaSchema = z.object({
  nombre: z.string(),
  fecha: z.string().nullable(),
  monto_usd: z.number().nullable(),
  valuacion_usd: z.number().nullable(),
  instrumento: z.string().nullable(),
  dilucion_pct: z.number().nullable(),
  participo_moov: z.boolean().nullable(),
  fuente: FuenteDatoSchema,
});

export const InversionSchema = z.object({
  fecha: z.string().nullable(),
  periodo: z.string().nullable(), // "3Q 2023"
  instrumento: z.string().nullable(),
  entidad: z.string().nullable(),
  monto_usd: DatoNumSchema, // principal (lente "a valor justo")
  /** Monto respaldado con documento (lente "a costo"). null = sin documento. */
  monto_documento_usd: z.number().nullable(),
  monto_comprometido_usd: DatoNumSchema,
  valuacion_entrada_usd: DatoNumSchema,
  tipo_valuacion: z.enum(["pre_money", "cap", "post_money"]).nullable(),
  descuento_pct: DatoNumSchema,
  participacion_entrada_pct: DatoNumSchema,
  valuacion_actual_usd: DatoNumSchema, // FMV
  participacion_actual_pct: DatoNumSchema, // 0-100
  base_marca: z.enum(["ronda_pricing", "cap_safe", "a_costo", "otra"]),
  base_marca_nota: z.string(),
  fecha_ultima_marca: z.string().nullable(),
  documento_localizado: z.boolean(),
});

export const AlertaSchema = z.object({
  texto: z.string(),
  severidad: z.enum(["alta", "media", "baja"]),
  /** false = severidad asignada por regla de migración, pendiente de revisión humana. */
  severidad_revisada: z.boolean(),
  fecha: z.string().nullable(),
  tarea_id: z.string().optional(),
});

export const ProximoPasoSchema = z.object({
  texto: z.string(),
  responsable: z.string().nullable(),
  fecha_objetivo: z.string().nullable().optional(),
  tarea_id: z.string().optional(),
});

export const DiscrepanciaSchema = z.object({
  id: z.string(),
  startup: z.string().nullable(), // null = a nivel fondo
  campo: z.string(),
  valor_a: z.string(),
  fuente_a: z.string(),
  valor_b: z.string(),
  fuente_b: z.string(),
  impacto: z.string(),
  afecta: z.enum(["monto", "valuacion", "revenue", "estado", "calidad"]),
  material: z.boolean(),
  estado: z.enum(["abierta", "resuelta"]),
  accion: z.string(),
});
export type Discrepancia = z.infer<typeof DiscrepanciaSchema>;

export const StartupV2Schema = z.object({
  id: z.string(),
  nombre: z.string(),
  estado_asignado: EstadoSchema,
  override_estado: z.object({ motivo: z.string(), fecha: z.string() }).nullable(),
  sector: z.string(),
  sector_grupo: z.string(), // etiqueta corta para agrupar
  subsegmento: z.string().nullable(),
  paises: z.array(z.string()),
  hq: z.string().nullable(),
  modelo_negocio: z.string(),
  etapa: z.string().nullable(),
  tipo_portafolio: z.enum(["core", "adyacente", "transformacional"]),
  vehiculo: z.enum(["directa", "spv"]),
  spv_nombre: z.string().nullable(),
  responsable_moov: z.string().nullable(),
  relacion_con_grupo: z.string().nullable(),
  parent_engagement: z.boolean().nullable(),
  crisis_caja_reportada: z.boolean(),
  inversion: InversionSchema,
  rondas: z.array(RondaSchema),
  serie_trimestral: z.array(PuntoSerieSchema),
  serie_mensual: z.array(PuntoSerieSchema),
  kpi_principal: z.object({
    nombre: z.string().nullable(),
    valor: z.number().nullable(),
    moneda: z.string().nullable(), // moneda original o "%"
    fecha_dato: z.string().nullable(),
    definicion: z.string().nullable(),
  }),
  reporte: z.object({
    ultimo_periodo_reportado: z.string().nullable(), // "YYYY-MM"
    frecuencia: z.enum(["mensual", "trimestral", "irregular", "ninguna"]),
    al_corriente: z.boolean().nullable(),
    nota_monitoring: z.string().nullable(),
  }),
  highlights: z.array(z.string()),
  situacion_actual: z.string(),
  tendencia: z.string(),
  alertas: z.array(AlertaSchema),
  proximos_pasos: z.array(ProximoPasoSchema),
  decision_pendiente: z.string().nullable(),
  notas_legales: z.string(),
  contexto_v1: z.record(z.string(), z.unknown()), // campos financieros v1 sin mapear (arr, ebitda, ...)
});
export type StartupV2 = z.infer<typeof StartupV2Schema>;

export const ParametrosFondoSchema = z.object({
  nombre: z.string(),
  entidad: z.string(),
  tamano_usd: z.number(),
  vintage: z.number(),
  gastos_salen_del_fondo: z.boolean(),
  gastos_inversion: z.array(
    z.object({ concepto: z.string(), monto_usd: z.number(), periodo: z.string(), tag: z.string() }),
  ),
  reservas_followon_usd: z.number().nullable(), // null = sin definir
  tipo_cambio_trimestral: z.record(z.string(), z.number()), // MXN por USD, fuente excel_bluebox
  tipo_cambio_eur_usd_estimado: z.number(), // etiquetado `estimado`
  objetivos_construccion: z.object({
    core: z.number(),
    adyacente: z.number(),
    transformacional: z.number(),
    graduation_rate: z.number(),
    parent_engagement: z.number(),
    son_objetivos: z.boolean(), // false = conteos actuales, sin meta confirmada
  }),
  politica_valuacion: z.string(),
  fecha_corte_excel: z.string(), // "2025-12-31"
  fecha_corte_vista: z.string(), // "YYYY-MM" para frescura
  /** Históricos del Excel (fuente excel_bluebox) que se muestran tal cual, sin recalcular. */
  historico_excel: z.object({
    tvpi: z.record(z.string(), z.number()),
    irr_anualizada: z.record(z.string(), z.number()),
    nav: z.record(z.string(), z.number()),
    capital: z.record(z.string(), z.number()),
    gastos_acumulados: z.record(z.string(), z.number()),
  }),
  ultima_actualizacion: z.string(),
});
export type ParametrosFondo = z.infer<typeof ParametrosFondoSchema>;

export const PipelineItemSchema = z.object({
  startup: z.string(),
  etapa: z.enum(["scouteada", "first_assessment", "analisis", "compromiso", "inversion"]),
  estado_origen: z.string(),
});

export const PortafolioV2Schema = z.object({
  schema_version: z.literal(2),
  generado_de: z.object({ v1_actualizacion: z.string(), excel_periodo: z.string() }),
  parametros: ParametrosFondoSchema,
  startups: z.array(StartupV2Schema),
  discrepancias: z.array(DiscrepanciaSchema),
  /** Embudo de scouting derivado de cowork/oportunidades-inversion.json (vacío = Sin captura). */
  pipeline: z.array(PipelineItemSchema),
});
export type PortafolioV2 = z.infer<typeof PortafolioV2Schema>;
