/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findStickerMeta, STICKER_COUNT, trazoCatalogMeta } from "trazo/meta";

import { StickerJsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return trazoCatalogMeta.map((sticker) => ({ id: sticker.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sticker = findStickerMeta(id);
  if (!sticker) {
    return {};
  }

  const title = `${sticker.name} — Free Crayon SVG Sticker | ${siteConfig.name}`;
  const description = `Download the ${sticker.name.toLowerCase()} crayon sticker as SVG or PNG. Recolor it online or use the ${sticker.componentName} component in React, Vue, or Svelte.`;
  const url = `${siteConfig.url}/library/${sticker.id}`;

  return {
    title,
    description,
    keywords: [
      sticker.name.toLowerCase(),
      `${sticker.name.toLowerCase()} svg`,
      `${sticker.name.toLowerCase()} sticker`,
      `${sticker.category} svg sticker`,
      ...sticker.tags,
      "crayon svg sticker",
      "hand-drawn svg",
      "react svg sticker",
      siteConfig.npmPackage,
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@AdiKodez",
      creator: "@AdiKodez",
    },
  };
}

export default async function StickerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sticker = findStickerMeta(id);
  if (!sticker) {
    notFound();
  }

  const related = trazoCatalogMeta
    .filter((item) => item.category === sticker.category && item.id !== sticker.id)
    .slice(0, 8);

  return (
    <>
      <StickerJsonLd sticker={sticker} />
      <article aria-label={`${sticker.name} crayon SVG sticker`} className="sr-only">
        <h2>{sticker.name} — Hand-Drawn Crayon SVG Sticker</h2>
        <p>
          Free MIT-licensed {sticker.name.toLowerCase()} wax-crayon vector
          sticker in the {sticker.category} collection. Customize size,
          rotation, and single-color or mix palette live, download SVG or PNG,
          or import it directly from <code>{siteConfig.npmPackage}</code>.
        </p>
        <p>Tags: {sticker.tags.join(", ")}.</p>

        <h3>Install &amp; Usage</h3>
        <pre>{`npm i ${siteConfig.npmPackage}`}</pre>
        <pre>{`import { ${sticker.componentName} } from "${siteConfig.npmPackage}";\n\n<${sticker.componentName} size={48} />`}</pre>
        <pre>{`import { ${sticker.componentName} } from "${siteConfig.npmPackage}/vue";`}</pre>
        <pre>{`import { ${sticker.componentName} } from "${siteConfig.npmPackage}/svelte";`}</pre>

        <nav aria-label={`More ${sticker.category} stickers`}>
          <h3>More {sticker.category} crayon stickers</h3>
          <ul>
            {related.map((item) => (
              <li key={item.id}>
                <a href={`/library/${item.id}`}>{item.name} SVG sticker</a>
              </li>
            ))}
          </ul>
          <p>
            <a href="/library">
              Browse all {STICKER_COUNT} Trazo crayon SVG stickers
            </a>
          </p>
        </nav>
      </article>
    </>
  );
}
