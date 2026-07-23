import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(3, "60 m"),
      analytics: false,
      prefix: "moov_apply",
    });
  }
  return ratelimit;
}

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; reset?: number }> {
  const rl = getRatelimit();
  if (!rl) return { allowed: true };

  const { success, reset } = await rl.limit(ip);
  return { allowed: success, reset };
}

// Separate limiter/prefix from the public /apply form above — otherwise a
// burst of legitimate tareas-ingest calls from the same IP could lock that
// IP out of submitting an actual application, and vice versa. The real
// gate on /api/tareas-ingest is the bearer secret; this just caps abuse.
let ingestRatelimit: Ratelimit | null = null;

function getIngestRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!ingestRatelimit) {
    ingestRatelimit = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(20, "10 m"),
      analytics: false,
      prefix: "moov_apply_tareas_ingest",
    });
  }
  return ingestRatelimit;
}

export async function checkIngestRateLimit(
  ip: string
): Promise<{ allowed: boolean; reset?: number }> {
  const rl = getIngestRatelimit();
  if (!rl) return { allowed: true };

  const { success, reset } = await rl.limit(ip);
  return { allowed: success, reset };
}
