import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414), served at
 * /.well-known/oauth-authorization-server via the rewrite in
 * next.config.ts. Lets claude.ai's MCP client discover the authorize/token
 * endpoints for the custom connector at /api/mcp.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  return NextResponse.json({
    issuer: origin,
    authorization_endpoint: `${origin}/api/mcp/authorize`,
    token_endpoint: `${origin}/api/mcp/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
  });
}
