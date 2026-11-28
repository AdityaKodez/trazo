import type { MetadataRoute } from "next";
import { trazoCatalogMeta } from "trazo/meta";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteConfig.url}/` },
    { url: `${siteConfig.url}/library` },
    { url: `${siteConfig.url}/library/skill` },
    ...trazoCatalogMeta.map((sticker) => ({
      url: `${siteConfig.url}/library/${sticker.id}`,
      images: [`${siteConfig.url}/library/${sticker.id}/sticker.svg`],
    })),
  ];
}
