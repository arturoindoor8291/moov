import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { TareaSchema, type Tarea } from "@/lib/portfolio/portfolioSchemas";
import { getAllTareas } from "@/lib/portfolio/tareasData";
import { listarTareas } from "@/lib/portfolio/tareasQuery";
import { getMergedTareas, upsertExternalTarea } from "@/lib/portfolio/tareasStore";
import { checkIngestRateLimit } from "@/lib/ratelimit";
import { verifyAccessToken } from "@/lib/mcpOAuthStore";

export const runtime = "nodejs";

/**
 * Conector MCP "moov-tareas" — misma autenticación (Bearer OAuth o
 * MCP_TAREAS_SECRET) y mismo rate limit para todas las herramientas:
 *
 *  - crear_tarea_moov: crea una tarea en el kanban (escritura, Redis).
 *  - listar_tareas_moov: consulta el kanban (solo lectura). Filtros
 *    opcionales: proyecto, estado (pendiente | en_progreso | bloqueada |
 *    completada), responsable, actualizadas_desde (AAAA-MM-DD) y limite
 *    (50 por defecto, 200 máx). Ordena por fecha límite y luego por
 *    importancia. Excluye tareas confidenciales y sólo expone los campos de
 *    TareaResumen (ver lib/portfolio/tareasQuery.ts).
 */

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

const CreateTareaMcpSchema = {
  proyecto_prefijo: z
    .string()
    .regex(/^[A-Za-z]{2,4}$/, "2-4 letras, ej. AC para AutoCare")
    .describe("Prefijo corto del proyecto de origen, usado para namespacing del id (ej. 'AC' -> AC-T-...)."),
  proyecto: z.string().min(1).describe("Nombre del proyecto/empresa dueño de la tarea."),
  startup: z.string().default("").describe("Startup del portafolio relacionada, si aplica."),
  tipo_tarea: TareaSchema.shape.tipo_tarea,
  tarea: z.string().min(1).describe("Título corto para la tarjeta del kanban."),
  descripcion: z.string().default("").describe("Contexto completo de la tarea."),
  proxima_accion: z.string().default("").describe("Siguiente paso concreto, distinto de la descripción."),
  nivel_importancia: TareaSchema.shape.nivel_importancia,
  nivel_urgencia: TareaSchema.shape.nivel_urgencia,
  columna_kanban: TareaSchema.shape.columna_kanban.default("pendiente"),
  responsable: z.string().default(""),
  fecha_limite: z.string().nullable().default(null),
  confidencial: z.boolean().default(false),
  etiquetas: z.array(z.string()).default([]),
};

const ListTareasMcpSchema = {
  proyecto: z.string().optional().describe("Filtra por proyecto/empresa dueño (coincidencia parcial, sin acentos ni mayúsculas)."),
  estado: TareaSchema.shape.columna_kanban
    .optional()
    .describe("Columna del kanban: pendiente, en_progreso (en curso), bloqueada o completada."),
  responsable: z.string().optional().describe("Filtra por responsable (coincidencia parcial)."),
  actualizadas_desde: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato AAAA-MM-DD")
    .optional()
    .describe("Solo tareas actualizadas en o después de esta fecha (AAAA-MM-DD)."),
  limite: z.number().int().min(1).max(200).default(50).describe("Máximo de tareas a regresar (50 por defecto, 200 máximo)."),
};

/**
 * Same shape/defaults pattern as CreateTareaSchema in
 * app/api/admin/tareas/route.ts, plus proyecto_prefijo for id namespacing
 * (equivalent to the "extraer-tareas" skill's tareas-config.json prefijo_id,
 * but MCP tool calls are stateless so there's no local counter — ids use a
 * base36 timestamp instead of a sequential number).
 */
function buildServer(): McpServer {
  const server = new McpServer({ name: "moov-tareas", version: "1.0.0" });

  server.registerTool(
    "crear_tarea_moov",
    {
      title: "Crear tarea en el board de MOOV",
      description:
        "Crea una tarea, compromiso, decisión de comité o hallazgo de riesgo en el board consolidado de " +
        "apply.moov.vc/admin/tareas, visible junto con las de MOOV/Portafolio y otros proyectos.",
      inputSchema: CreateTareaMcpSchema,
    },
    async (args) => {
      const moovIds = new Set(getAllTareas().map((t) => t.id));
      const today = new Date().toISOString().slice(0, 10);
      const id = `${args.proyecto_prefijo.toUpperCase()}-T-${Date.now().toString(36).toUpperCase()}`;

      if (moovIds.has(id)) {
        return {
          content: [{ type: "text" as const, text: `Id ${id} choca con una tarea nativa de MOOV, intenta de nuevo.` }],
          isError: true,
        };
      }

      const { proyecto_prefijo: _proyecto_prefijo, ...rest } = args;
      const tarea: Tarea = {
        id,
        ...rest,
        estado: "creada vía conector MCP",
        fecha_origen: today,
        fecha_actualizacion: today,
        fecha_completado: null,
        fuente: { tipo: "mcp", referencia: "Conector MCP claude.ai", fecha: today, link: null },
        enlaces: [],
        depende_de: [],
        checklist: [],
        historial: [{ fecha: today, nota: "Tarea creada vía conector MCP de claude.ai." }],
      };

      const validated = TareaSchema.safeParse(tarea);
      if (!validated.success) {
        return {
          content: [{ type: "text" as const, text: `No se pudo crear la tarea: ${validated.error.message}` }],
          isError: true,
        };
      }

      try {
        await upsertExternalTarea(validated.data);
      } catch (err) {
        console.error("[mcp] failed to persist tarea:", err);
        return {
          content: [{ type: "text" as const, text: "No se pudo guardar la tarea (error de almacenamiento)." }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text" as const, text: `Tarea ${id} creada en el board de MOOV: "${validated.data.tarea}".` }],
      };
    }
  );

  server.registerTool(
    "listar_tareas_moov",
    {
      title: "Listar tareas del board de MOOV",
      description:
        "Consulta (solo lectura) el kanban consolidado de apply.moov.vc/admin/tareas. Ordena por fecha límite y " +
        "luego por importancia; las tareas sin fecha límite válida van al final. Las tareas marcadas como " +
        "confidenciales nunca se incluyen.",
      inputSchema: ListTareasMcpSchema,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      let tareas;
      try {
        tareas = await getMergedTareas();
      } catch (err) {
        console.error("[mcp] failed to read tareas:", err);
        return {
          content: [{ type: "text" as const, text: "No se pudieron leer las tareas (error de almacenamiento)." }],
          isError: true,
        };
      }

      const resultado = listarTareas(tareas, args);
      const payload = { total: resultado.total, devueltas: resultado.tareas.length, tareas: resultado.tareas };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    }
  );

  return server;
}

/**
 * Fase 2 of the plan confirmed claude.ai's custom-connector flow requires
 * OAuth (it asks for a client id/secret, not a raw header). Requests now
 * carry either the static MCP_TAREAS_SECRET (kept for local/inspector
 * testing) or an OAuth access token minted by /api/mcp/token. On failure,
 * WWW-Authenticate points clients at the protected-resource metadata so
 * they can discover /api/mcp/authorize + /api/mcp/token on their own.
 */
async function isAuthorized(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length);

  const staticSecret = process.env.MCP_TAREAS_SECRET?.trim();
  if (staticSecret && token === staticSecret) return true;

  const claims = await verifyAccessToken(token);
  return claims !== null;
}

function unauthorizedResponse(req: NextRequest): NextResponse {
  const resourceMetadataUrl = `${req.nextUrl.origin}/.well-known/oauth-protected-resource`;
  return NextResponse.json(
    { message: "Unauthorized" },
    {
      status: 401,
      headers: { "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}"` },
    }
  );
}

async function handle(req: NextRequest): Promise<Response> {
  if (!(await isAuthorized(req))) {
    return unauthorizedResponse(req);
  }

  const ip = getClientIP(req);
  const { allowed, reset } = await checkIngestRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { message: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": reset ? String(Math.ceil((reset - Date.now()) / 1000)) : "600" },
      }
    );
  }

  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function DELETE(req: NextRequest) {
  return handle(req);
}
