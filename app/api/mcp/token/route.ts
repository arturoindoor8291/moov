import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  consumeAuthorizationCode,
  readRefreshToken,
  revokeRefreshToken,
  signAccessToken,
  storeRefreshToken,
} from "@/lib/mcpOAuthStore";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Client auth via HTTP Basic (preferred) or client_secret_post fallback. */
function authenticateClient(req: NextRequest, form: URLSearchParams): boolean {
  const expectedId = process.env.MCP_OAUTH_CLIENT_ID;
  const expectedSecret = process.env.MCP_OAUTH_CLIENT_SECRET;
  if (!expectedId || !expectedSecret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
      const separatorIndex = decoded.indexOf(":");
      const id = decoded.slice(0, separatorIndex);
      const secret = decoded.slice(separatorIndex + 1);
      return safeEqual(id, expectedId) && safeEqual(secret, expectedSecret);
    } catch {
      return false;
    }
  }

  const bodyId = form.get("client_id");
  const bodySecret = form.get("client_secret");
  if (!bodyId || !bodySecret) return false;
  return safeEqual(bodyId, expectedId) && safeEqual(bodySecret, expectedSecret);
}

function verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash("sha256").update(codeVerifier).digest("base64url");
  return safeEqual(computed, codeChallenge);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const form = new URLSearchParams(rawBody);

  if (!authenticateClient(req, form)) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }

  const grantType = form.get("grant_type");

  if (grantType === "authorization_code") {
    const code = form.get("code");
    const redirectUri = form.get("redirect_uri");
    const codeVerifier = form.get("code_verifier");
    if (!code || !redirectUri || !codeVerifier) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const record = await consumeAuthorizationCode(code);
    if (!record) {
      return NextResponse.json({ error: "invalid_grant", error_description: "Code expirado o inválido." }, { status: 400 });
    }
    if (record.redirectUri !== redirectUri) {
      return NextResponse.json({ error: "invalid_grant", error_description: "redirect_uri no coincide." }, { status: 400 });
    }
    if (!verifyPkce(codeVerifier, record.codeChallenge)) {
      return NextResponse.json({ error: "invalid_grant", error_description: "code_verifier inválido." }, { status: 400 });
    }

    const accessToken = await signAccessToken(record.email, record.clientId);
    const refreshToken = await storeRefreshToken({ email: record.email, clientId: record.clientId });

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refreshToken,
    });
  }

  if (grantType === "refresh_token") {
    const refreshToken = form.get("refresh_token");
    if (!refreshToken) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const record = await readRefreshToken(refreshToken);
    if (!record) {
      return NextResponse.json({ error: "invalid_grant", error_description: "refresh_token expirado o inválido." }, { status: 400 });
    }

    // Rotate: issue a new refresh token and revoke the old one, standard
    // practice so a leaked refresh token has a bounded lifetime.
    await revokeRefreshToken(refreshToken);
    const accessToken = await signAccessToken(record.email, record.clientId);
    const newRefreshToken = await storeRefreshToken(record);

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefreshToken,
    });
  }

  return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
}
