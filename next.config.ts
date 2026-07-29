import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === "production" ? "https://apply.moov.vc" : undefined,
  async rewrites() {
    return [
      { source: "/.well-known/oauth-authorization-server", destination: "/api/oauth/metadata" },
      { source: "/.well-known/oauth-protected-resource", destination: "/api/oauth/protected-resource" },
      { source: "/.well-known/oauth-protected-resource/api/mcp", destination: "/api/oauth/protected-resource" },
    ];
  },
};

export default nextConfig;
