import { Redis } from "@upstash/redis";
import { TareaSchema, type Tarea } from "./portfolioSchemas";
import { getAllTareas } from "./tareasData";

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
 * rewrite it. This hash is a legacy leftover from when column moves were
 * the only edit the panel could persist (kept read-only for backward
 * compatibility with anything already stored); any edit made from the
 * panel today, including a plain column change, goes through
 * upsertExternalTarea instead and forks the whole record into Redis.
 */
export async function getColumnOverrides(): Promise<Record<string, string>> {
  const client = getRedis();
  if (!client) return {};
  const overrides = await client.hgetall<Record<string, string>>(HASH_KEY);
  return overrides ?? {};
}

/**
 * Full Tarea records that live entirely in Redis rather than in
 * tareas-data.json. Two ways a record ends up here:
 *  - Submitted live by the "extraer-tareas" skill running in other repos
 *    (Multicréditos, Mitaller, etc.) via POST /api/tareas-ingest — ids
 *    carry a project-specific prefix (e.g. "MTC-T-001") so they never
 *    collide with MOOV's native "T-XXX" ids or with each other.
 *  - Created or fully edited from the /admin/tareas panel itself (see
 *    app/api/admin/tareas routes) — a native tarea edited beyond just its
 *    column gets "forked" here in full, and new tareas created from the
 *    UI get an id prefixed "UI-T-".
 * Either way, once a record exists here it's the source of truth for
 * that id and wins over tareas-data.json + column overrides on read.
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

/**
 * Resolves the current full record for any tarea id, whichever store it
 * lives in: a fully-edited/created tarea in EXTERNAL_HASH_KEY takes
 * precedence (once a native tarea gets a full edit from the UI, it's
 * "forked" there and that copy wins from then on); otherwise falls back
 * to the native tareas-data.json record with its column override merged
 * in, if any. Returns null only if the id doesn't exist anywhere.
 */
export async function resolveTarea(id: string): Promise<Tarea | null> {
  const stored = await getExternalTareaById(id);
  if (stored) return stored;

  const native = getAllTareas().find((t) => t.id === id);
  if (!native) return null;

  const overrides = await getColumnOverrides();
  const override = overrides[id];
  return override ? { ...native, columna_kanban: override as Tarea["columna_kanban"] } : native;
}
