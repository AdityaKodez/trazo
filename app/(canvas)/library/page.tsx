import type { Metadata } from "next";
import {
  STICKER_CATEGORY_COUNTS,
  STICKER_COUNT,
  trazoCatalogMeta,
} from "trazo/meta";

import { LibraryJsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";

const title = `${STICKER_COUNT} Free Hand-Drawn Crayon SVG Stickers | ${siteConfig.name}`;
const description = `Browse, search, and recolor all ${STICKER_COUNT} free hand-drawn crayon SVG stickers across 9 categories. Copy React, Vue, Svelte, or standalone SVG code.`;
const url = `${siteConfig.url}/library`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    type: "website",
    url,
    title,
    description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    site: "@AdiKodez",
    creator: "@AdiKodez",
    images: [`${siteConfig.url}/opengraph-image`],
  },
};

export default function LibraryPage() {
  const categories = Object.entries(STICKER_CATEGORY_COUNTS);

  return (
    <>
      <LibraryJsonLd />
      <section aria-label="Trazo Sticker Library" className="sr-only">
        <h2>{STICKER_COUNT} Hand-Drawn Crayon SVG Stickers</h2>
        <p>{description}</p>
        <p>
          Categories:{" "}
          {categories
            .map(([category, count]) => `${category} (${count})`)
            .join(", ")}
          .
        </p>
        <ul>
          {trazoCatalogMeta.map((sticker) => (
            <li key={sticker.id}>
              <a href={`/library/${sticker.id}`}>
                {sticker.name} crayon SVG sticker ({sticker.category}) — React{" "}
                {`<${sticker.componentName} />`} — {sticker.tags.join(", ")}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
