import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728), served at
 * /.well-known/oauth-protected-resource via the rewrite in next.config.ts.
 * Points the /api/mcp resource at its authorization server so clients that
 * hit /api/mcp unauthenticated can discover where to get a token.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  return NextResponse.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
  });
}
