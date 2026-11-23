import type { Metadata } from "next";
import { STICKER_COUNT } from "trazo/meta";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Library · ${siteConfig.name}`,
  description: `Browse and search all ${STICKER_COUNT} hand-drawn crayon sticker SVGs in Trazo.`,
  alternates: {
    canonical: `${siteConfig.url}/library`,
  },
};

export default function LibraryPage() {
  return null;
}
