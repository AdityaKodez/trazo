import type { MetadataRoute } from "next";
import { trazoCatalog } from "trazo";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/library`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...trazoCatalog.map((sticker) => ({
      url: `${siteConfig.url}/library/${sticker.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
