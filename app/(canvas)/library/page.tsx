import type { Metadata } from "next";
import { trazoCatalog } from "trazo";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Library · ${siteConfig.name}`,
  description: `Browse and search all ${trazoCatalog.length} hand-drawn crayon sticker SVGs in Trazo.`,
  alternates: {
    canonical: `${siteConfig.url}/library`,
  },
};

export default function LibraryPage() {
  return null;
}
