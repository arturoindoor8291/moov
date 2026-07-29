import { randomBytes } from "crypto";
import { Redis } from "@upstash/redis";
import { SignJWT, jwtVerify } from "jose";

const CODE_PREFIX = "moov_apply:mcp_oauth:code:";
const REFRESH_PREFIX = "moov_apply:mcp_oauth:refresh:";
const CODE_TTL_SECONDS = 5 * 60;
const REFRESH_TTL_SECONDS = 180 * 24 * 60 * 60;
const ACCESS_TOKEN_TTL = "1h";

const JWT_SECRET = new TextEncoder().encode(
  process.env.MCP_OAUTH_JWT_SECRET ?? "moov-mcp-oauth-dev-secret-change-in-production"
);

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Redis no configurado.");
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export type AuthorizationCodeRecord = {
  email: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
};

export async function storeAuthorizationCode(record: AuthorizationCodeRecord): Promise<string> {
  const code = randomBytes(32).toString("base64url");
  await getRedis().set(`${CODE_PREFIX}${code}`, JSON.stringify(record), { ex: CODE_TTL_SECONDS });
  return code;
}

/** One-time use: deletes the code as part of the lookup. */
export async function consumeAuthorizationCode(code: string): Promise<AuthorizationCodeRecord | null> {
  const client = getRedis();
  const raw = await client.get<string>(`${CODE_PREFIX}${code}`);
  if (!raw) return null;
  await client.del(`${CODE_PREFIX}${code}`);
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export type RefreshTokenRecord = { email: string; clientId: string };

export async function storeRefreshToken(record: RefreshTokenRecord): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await getRedis().set(`${REFRESH_PREFIX}${token}`, JSON.stringify(record), { ex: REFRESH_TTL_SECONDS });
  return token;
}

export async function readRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
  const raw = await getRedis().get<string>(`${REFRESH_PREFIX}${token}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await getRedis().del(`${REFRESH_PREFIX}${token}`);
}

export async function signAccessToken(email: string, clientId: string): Promise<string> {
  return new SignJWT({ email, client_id: clientId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience("moov-mcp")
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<{ email: string; clientId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { audience: "moov-mcp" });
    return { email: payload.email as string, clientId: payload.client_id as string };
  } catch {
    return null;
  }
}
