import type { MetadataRoute } from "next";
import { trazoCatalogMeta } from "trazo/meta";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/library`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/library/skill`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...trazoCatalogMeta.map((sticker) => ({
      url: `${siteConfig.url}/library/${sticker.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
