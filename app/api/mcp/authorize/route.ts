import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, signToken, verifyToken } from "@/lib/auth";
import { storeAuthorizationCode } from "@/lib/mcpOAuthStore";

export const runtime = "nodejs";

type OAuthParams = {
  responseType: string | null;
  clientId: string | null;
  redirectUri: string | null;
  state: string | null;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
};

function readOAuthParams(params: URLSearchParams): OAuthParams {
  return {
    responseType: params.get("response_type"),
    clientId: params.get("client_id"),
    redirectUri: params.get("redirect_uri"),
    state: params.get("state"),
    codeChallenge: params.get("code_challenge"),
    codeChallengeMethod: params.get("code_challenge_method"),
  };
}

function validateOAuthParams(p: OAuthParams): string | null {
  if (p.responseType !== "code") return "response_type debe ser 'code'.";
  if (!p.clientId || p.clientId !== process.env.MCP_OAUTH_CLIENT_ID) return "client_id inválido.";
  if (!p.redirectUri) return "redirect_uri es requerido.";
  try {
    const u = new URL(p.redirectUri);
    if (u.protocol !== "https:" && u.hostname !== "localhost") return "redirect_uri debe ser https.";
  } catch {
    return "redirect_uri inválido.";
  }
  if (!p.codeChallenge || p.codeChallengeMethod !== "S256") return "Se requiere PKCE (code_challenge_method=S256).";
  return null;
}

function loginPage(oauth: OAuthParams, error?: string): string {
  const hidden = [
    ["response_type", oauth.responseType],
    ["client_id", oauth.clientId],
    ["redirect_uri", oauth.redirectUri],
    ["state", oauth.state],
    ["code_challenge", oauth.codeChallenge],
    ["code_challenge_method", oauth.codeChallengeMethod],
  ]
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${(v ?? "").replace(/"/g, "&quot;")}" />`)
    .join("\n");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>MOOV — Autorizar conector</title>
<style>
  body { font-family: system-ui, sans-serif; background: #050506; color: #eef1f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 24px; }
  .card { background: #07080d; border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; padding: 40px; width: 100%; max-width: 400px; }
  h1 { font-size: 22px; margin: 0 0 6px; }
  p { font-size: 14px; color: rgba(238,241,246,0.55); margin: 0 0 24px; }
  label { display: block; font-size: 13px; margin: 14px 0 6px; color: rgba(238,241,246,0.65); }
  input[type=email], input[type=password] { width: 100%; box-sizing: border-box; background: #0c0e14; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; font-size: 14px; color: #eef1f6; }
  button { margin-top: 20px; width: 100%; background: #2f6dff; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 15px; font-weight: 600; cursor: pointer; }
  .error { margin: 0 0 16px; font-size: 13px; color: #ff5a5a; background: rgba(255,90,90,0.08); border: 1px solid rgba(255,90,90,0.2); border-radius: 8px; padding: 10px 14px; }
</style>
</head>
<body>
  <div class="card">
    <h1>MOOV</h1>
    <p>Autoriza este conector para crear tareas en tu board.</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST">
      ${hidden}
      <label for="email">Email</label>
      <input id="email" type="email" name="email" required autoComplete="email" />
      <label for="password">Password</label>
      <input id="password" type="password" name="password" required autoComplete="current-password" />
      <button type="submit">Autorizar</button>
    </form>
  </div>
</body>
</html>`;
}

async function issueCodeAndRedirect(email: string, oauth: OAuthParams): Promise<NextResponse> {
  const code = await storeAuthorizationCode({
    email,
    clientId: oauth.clientId!,
    redirectUri: oauth.redirectUri!,
    codeChallenge: oauth.codeChallenge!,
  });
  const redirect = new URL(oauth.redirectUri!);
  redirect.searchParams.set("code", code);
  if (oauth.state) redirect.searchParams.set("state", oauth.state);
  // 303, not the 307 NextResponse.redirect() defaults to — 307 preserves
  // the original request method, so the POST from the login form would
  // get replayed as a POST against claude.ai's callback URL (which only
  // accepts GET), producing a "Method Not Allowed" error on their side.
  return NextResponse.redirect(redirect, 303);
}

export async function GET(req: NextRequest) {
  const oauth = readOAuthParams(req.nextUrl.searchParams);
  const validationError = validateOAuthParams(oauth);
  if (validationError) {
    return NextResponse.json({ error: "invalid_request", error_description: validationError }, { status: 400 });
  }

  const token = req.cookies.get("admin_token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (user) {
    return issueCodeAndRedirect(user.email, oauth);
  }

  return new NextResponse(loginPage(oauth), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const formParams = new URLSearchParams();
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") formParams.set(key, value);
  }
  const oauth = readOAuthParams(formParams);
  const validationError = validateOAuthParams(oauth);
  if (validationError) {
    return NextResponse.json({ error: "invalid_request", error_description: validationError }, { status: 400 });
  }

  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const user = await verifyCredentials(email, password);
  if (!user) {
    return new NextResponse(loginPage(oauth, "Email o contraseña incorrectos."), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const jwt = await signToken({ email: user.email });
  const response = await issueCodeAndRedirect(user.email, oauth);
  response.cookies.set("admin_token", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
