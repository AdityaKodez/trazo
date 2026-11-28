import type { Metadata } from "next";
import Link from "next/link";
import { STICKER_COUNT, trazoCatalogMeta } from "trazo/meta";

import { LibraryJsonLd } from "@/components/seo/json-ld";
import { LibraryRoutePreview } from "@/components/trazo/library-route-preview";
import { siteConfig } from "@/config/site";

const title = `${STICKER_COUNT} Free Hand-Drawn Crayon SVG Stickers | ${siteConfig.name}`;
const description = `Browse and recolor ${STICKER_COUNT} free hand-drawn crayon stickers. Download SVG or PNG, or copy code for React, Vue, and Svelte.`;
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
  return (
    <>
      <LibraryJsonLd />
      <LibraryRoutePreview view="grid" title={`${STICKER_COUNT} Free Crayon SVG Stickers`}>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <ul className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {trazoCatalogMeta.map((sticker) => (
            <li key={sticker.id}>
              <a
                href={`/library/${sticker.id}`}
                className="flex min-h-10 items-center rounded-lg bg-muted/60 px-2.5 py-2 text-sm hover:bg-muted"
              >
                {sticker.name}
              </a>
            </li>
          ))}
        </ul>
        <Link href="/library/skill" prefetch={false} className="mt-4 inline-block text-sm underline underline-offset-4">
          Trazo illustration skill
        </Link>
      </LibraryRoutePreview>
    </>
  );
}
