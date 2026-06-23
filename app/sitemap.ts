import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://apply.moov.vc",
      lastModified: new Date("2025-06-01"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
