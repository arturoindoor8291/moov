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
