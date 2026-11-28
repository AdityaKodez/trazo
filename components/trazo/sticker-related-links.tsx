import Link from "next/link";
import type { StickerMeta } from "trazo/core";
import { trazoCatalogMeta } from "trazo/meta";

import { getMessages } from "@/config/i18n/messages";
import { getLocalizedStickerName } from "@/config/i18n/stickers";
import type { Locale } from "@/lib/use-locale";

export function StickerRelatedLinks({
  sticker,
  locale = "en",
}: {
  sticker: StickerMeta;
  locale?: Locale;
}) {
  const title = getMessages(locale).detail.relatedStickers;
  const related = trazoCatalogMeta
    .filter((item) => item.category === sticker.category && item.id !== sticker.id)
    .slice(0, 6);

  if (related.length === 0) return null;

  return (
    <nav aria-label={title} className="space-y-2">
      <h2 className="text-sm font-medium">{title}</h2>
      <ul className="flex flex-wrap gap-2 text-xs">
        {related.map((item) => (
          <li key={item.id}>
            <Link
              href={`/library/${item.id}`}
              prefetch={false}
              scroll={false}
              className="inline-block rounded-md bg-muted px-2 py-1 hover:underline"
            >
              {getLocalizedStickerName(item, locale)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
