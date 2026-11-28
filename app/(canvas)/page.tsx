/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { STICKER_COUNT, trazoCatalogMeta } from "trazo/meta";

import { HomeJsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  alternates: {
    canonical: `${siteConfig.url}/`,
  },
};

export default function TrazoHomePage() {
  return (
    <>
      <HomeJsonLd />
      <nav aria-label="Trazo sticker catalog" className="sr-only">
        <h2>Browse all {STICKER_COUNT} hand-drawn crayon SVG stickers</h2>
        <p>
          Explore the interactive canvas or open the{" "}
          <a href="/library">full Trazo sticker library</a> to search,
          recolor, and copy React, Vue, Svelte, or standalone SVG code.
        </p>
        <ul>
          {trazoCatalogMeta.map((sticker) => (
            <li key={sticker.id}>
              <a href={`/library/${sticker.id}`}>
                {sticker.name} ({sticker.category}) — {sticker.tags.join(", ")}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
