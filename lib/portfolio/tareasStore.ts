import { Redis } from "@upstash/redis";
import { TareaSchema, type Tarea } from "./portfolioSchemas";

const HASH_KEY = "moov_apply:portafolio:tareas:columna_overrides";
const EXTERNAL_HASH_KEY = "moov_apply:portafolio:tareas:externas";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/**
 * tareas-data.json is imported at build time (lib/portfolio/tareasData.ts)
 * and bundled into the server — a running serverless function can't
 * rewrite it. Column moves on the kanban board persist here instead, as
 * a Redis hash of {tareaId: columna_kanban}, and get merged onto the
 * base JSON on every read. Only columna_kanban is overridable this way;
 * everything else about a tarea still comes from Cowork's JSON.
 */
export async function getColumnOverrides(): Promise<Record<string, string>> {
  const client = getRedis();
  if (!client) return {};
  const overrides = await client.hgetall<Record<string, string>>(HASH_KEY);
  return overrides ?? {};
}

export async function setColumnOverride(
  id: string,
  columna: Tarea["columna_kanban"]
): Promise<void> {
  const client = getRedis();
  if (!client) {
    throw new Error("Redis no configurado — no se puede guardar el cambio de estado.");
  }
  await client.hset(HASH_KEY, { [id]: columna });
}

/**
 * Tareas that don't come from Cowork's tareas-data.json at all — submitted
 * live by the "extraer-tareas" skill running in other repos (Multicréditos,
 * Mitaller, etc.) via POST /api/tareas-ingest. Unlike columna_overrides,
 * these have no base JSON record to merge onto — the full Tarea lives in
 * Redis. Ids are expected to carry a project-specific prefix (e.g.
 * "MTC-T-001") so they never collide with MOOV's native "T-XXX" ids or
 * with each other across projects.
 */
export async function upsertExternalTarea(tarea: Tarea): Promise<void> {
  const client = getRedis();
  if (!client) {
    throw new Error("Redis no configurado — no se puede guardar la tarea.");
  }
  await client.hset(EXTERNAL_HASH_KEY, { [tarea.id]: JSON.stringify(tarea) });
}

export async function getExternalTareas(): Promise<Tarea[]> {
  const client = getRedis();
  if (!client) return [];
  const raw = await client.hgetall<Record<string, string>>(EXTERNAL_HASH_KEY);
  if (!raw) return [];

  const tareas: Tarea[] = [];
  for (const [id, value] of Object.entries(raw)) {
    // Upstash's client auto-parses JSON-looking hash values, so `value`
    // may already be an object depending on SDK version — handle both.
    const parsedJson = typeof value === "string" ? JSON.parse(value) : value;
    const result = TareaSchema.safeParse(parsedJson);
    if (result.success) {
      tareas.push(result.data);
    } else {
      console.error(`[tareasStore] tarea externa inválida en Redis, id=${id}:`, result.error.issues);
    }
  }
  return tareas;
}

export async function getExternalTareaById(id: string): Promise<Tarea | null> {
  const client = getRedis();
  if (!client) return null;
  const value = await client.hget<string>(EXTERNAL_HASH_KEY, id);
  if (!value) return null;
  const parsedJson = typeof value === "string" ? JSON.parse(value) : value;
  const result = TareaSchema.safeParse(parsedJson);
  return result.success ? result.data : null;
}
