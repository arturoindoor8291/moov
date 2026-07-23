import { Redis } from "@upstash/redis";
import type { Tarea } from "./portfolioSchemas";

const HASH_KEY = "moov_apply:portafolio:tareas:columna_overrides";

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
