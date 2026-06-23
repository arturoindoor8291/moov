import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/apply",
        disallow: "/apply/success",
      },
      { userAgent: "GPTBot", allow: "/apply" },
      { userAgent: "ClaudeBot", allow: "/apply" },
      { userAgent: "Google-Extended", allow: "/apply" },
      { userAgent: "PerplexityBot", allow: "/apply" },
      { userAgent: "anthropic-ai", allow: "/apply" },
      { userAgent: "cohere-ai", allow: "/apply" },
    ],
    sitemap: "https://apply.moov.vc/sitemap.xml",
  };
}
