import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findStickerMeta, trazoCatalogMeta } from "trazo/meta";
import { findSticker, toSvgString } from "trazo/svg";

import { StickerJsonLd } from "@/components/seo/json-ld";
import { DetailFirstPaint } from "@/components/trazo/detail-first-paint";
import { StickerRelatedLinks } from "@/components/trazo/sticker-related-links";
import { installCommands, siteConfig } from "@/config/site";

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

  const artwork = findSticker(id);

  return (
    <>
      <StickerJsonLd sticker={sticker} />
      {artwork ? (
        <DetailFirstPaint id={sticker.id}>
          <div aria-hidden className="fixed inset-0 z-40 bg-black/25 sm:bg-black/20" />
          <section
            aria-labelledby="initial-sticker-name"
            className="fixed inset-x-0 bottom-0 z-40 flex h-[min(37rem,90dvh)] flex-col rounded-t-[24px] bg-[color-mix(in_oklab,var(--muted)_75%,var(--background))] p-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl ring-1 ring-inset ring-foreground/10 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-[12dvh] sm:h-[min(38rem,calc(88dvh-1.25rem))] sm:w-[calc(100%-2rem)] sm:max-w-[480px] sm:-translate-x-1/2 sm:rounded-[22px] sm:pb-1.5"
          >
            <div aria-hidden className="mx-auto mb-0.5 mt-1 h-1 w-10 shrink-0 rounded-full bg-foreground/15 sm:hidden" />
            <div className="flex h-10 shrink-0 items-center gap-2 px-2">
              <Link href="/library" prefetch={false} aria-label="Back to library" className="flex size-8 items-center justify-center rounded-lg font-mono text-muted-foreground hover:bg-muted">←</Link>
              <h1 id="initial-sticker-name" className="min-w-0 flex-1 truncate font-medium tracking-tight">{sticker.name} crayon SVG sticker</h1>
              <Link href="/" prefetch={false} aria-label="Close" className="flex size-8 items-center justify-center rounded-lg font-mono text-muted-foreground hover:bg-muted">×</Link>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto rounded-[16px] bg-background p-3 ring-1 ring-inset ring-foreground/[0.07] sm:p-4">
              <div
                data-trazo-detail-preview=""
                className="paper-dot-grid flex h-40 shrink-0 items-center justify-center rounded-xl bg-[color:var(--scribble-paper)] ring-1 ring-inset ring-foreground/8 sm:h-48"
                dangerouslySetInnerHTML={{ __html: toSvgString(artwork, { size: 48, title: sticker.name }) }}
              />
              <div className="flex min-h-11 shrink-0 items-center justify-between gap-2 rounded-xl bg-muted/65 px-3 text-xs ring-1 ring-inset ring-foreground/10">
                <code className="select-all font-mono">{installCommands.npm}</code>
                <a href={siteConfig.npm} className="min-w-11 py-3 text-center font-medium text-muted-foreground underline underline-offset-2">npm</a>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Download the original crayon artwork or use <code>{sticker.componentName}</code> in React, Vue, and Svelte.
                </p>
                <a
                  href={`/library/${sticker.id}/sticker.svg`}
                  download={`${sticker.id}.svg`}
                  className="inline-flex min-h-9 items-center rounded-lg bg-muted px-3 font-medium hover:bg-muted/70"
                >
                  Download SVG
                </a>
              </div>
              <StickerRelatedLinks sticker={sticker} />
            </div>
          </section>
        </DetailFirstPaint>
      ) : null}
    </>
  );
}
