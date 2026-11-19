import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findSticker, trazoCatalog } from "trazo";

import { siteConfig } from "@/config/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return trazoCatalog.map((sticker) => ({ id: sticker.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sticker = findSticker(id);
  if (!sticker) {
    return {};
  }

  return {
    title: `${sticker.name} · ${siteConfig.name}`,
    description: `Customize size, rotation, and color for the ${sticker.name} crayon sticker, then copy React/JS code or download SVG/PNG.`,
    alternates: {
      canonical: `${siteConfig.url}/library/${sticker.id}`,
    },
  };
}

export default async function StickerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sticker = findSticker(id);
  if (!sticker) {
    notFound();
  }

  return null;
}
