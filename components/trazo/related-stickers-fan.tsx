"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { StickerCategory } from "trazo/core";
import { Sticker } from "trazo/scribble";

import { getMessages } from "@/config/i18n/messages";
import { getLocalizedStickerName } from "@/config/i18n/stickers";
import {
  getRelatedStickers,
  hasStoredPersonalization,
} from "@/lib/related-stickers";
import {
  getLoadedSticker,
  isCategoryLoaded,
  loadCategories,
  useStickerLoaderVersion,
} from "@/lib/sticker-loader";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

const FAN_POSE_CLASSES = [
  "-rotate-[7deg] translate-y-[2px]",
  "rotate-[4deg] -translate-y-[1px]",
  "-rotate-[3deg] translate-y-[1px]",
  "rotate-[6deg] -translate-y-[1.5px]",
  "-rotate-[4deg] translate-y-[2px]",
] as const;

export interface RelatedStickersFanProps {
  stickerId: string;
  /** CSS color string passed to `<Sticker />` (undefined for original multi-layer colors). */
  displayColor: string | undefined;
  /** Concrete swatch hex when user selected a non-ink color swatch; used for color harmony. */
  activeColorHex: string | undefined;
  /** Active library search query to subtly carry user intent into related picks. */
  searchQuery: string;
  onSelect: (id: string) => void;
}

/**
 * Quiet "Peeking Fan" related-stickers strip docked in the detail overlay's outer tray.
 * Isolated and memoized so loading related category chunks or hovering stickers never
 * re-renders the preview, sliders, rotation dial, or code snippet.
 */
export const RelatedStickersFan = memo(function RelatedStickersFan({
  stickerId,
  displayColor,
  activeColorHex,
  searchQuery,
  onSelect,
}: RelatedStickersFanProps) {
  const locale = useLocale();
  const t = getMessages(locale).detail;
  const loaderVersion = useStickerLoaderVersion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [personalizationReady, setPersonalizationReady] = useState(false);

  // Enable stored local personalization after hydration without triggering an extra
  // render for first-time visitors who only have the currently open sticker.
  useEffect(() => {
    if (!personalizationReady && hasStoredPersonalization(stickerId)) {
      setPersonalizationReady(true);
    }
  }, [stickerId, personalizationReady]);

  const related = useMemo(
    () =>
      getRelatedStickers(stickerId, {
        count: 5,
        activeColorHex,
        activeSearchQuery: searchQuery,
        usePersonalization: personalizationReady,
      }),
    [stickerId, activeColorHex, searchQuery, personalizationReady],
  );

  // Lazy-load ONLY the 2–4 category chunks needed by the 5 picks.
  useEffect(() => {
    const missing = new Set<StickerCategory>();
    for (const item of related) {
      if (!isCategoryLoaded(item.category)) {
        missing.add(item.category);
      }
    }
    if (missing.size > 0) {
      void loadCategories(missing);
    }
  }, [related]);

  // Clear hover label if the hovered sticker is no longer in the current fan.
  const activeHoveredItem = hoveredId
    ? related.find((item) => item.id === hoveredId) ?? null
    : null;

  const caption = activeHoveredItem
    ? getLocalizedStickerName(activeHoveredItem, locale)
    : t.relatedLabel;

  // Keep loaderVersion referenced so memoized defs resolve as chunks arrive.
  void loaderVersion;

  if (related.length === 0) return null;

  return (
    <div
      data-trazo-related-fan={stickerId}
      className="flex shrink-0 items-center justify-between gap-3 px-2.5 pb-1 pt-2 sm:px-3"
    >
      <span
        aria-live="polite"
        className={cn(
          "min-w-0 truncate text-xs font-medium transition-colors duration-150",
          activeHoveredItem ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {caption}
      </span>

      <div
        role="group"
        aria-label={t.relatedAriaLabel}
        onPointerLeave={() => setHoveredId(null)}
        className="group/fan flex shrink-0 items-center pr-0.5"
      >
        {related.map((item, index) => {
          const def = getLoadedSticker(item.id);
          const localizedName = getLocalizedStickerName(item, locale);
          const poseClass = FAN_POSE_CLASSES[index % FAN_POSE_CLASSES.length];

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setHoveredId(null);
                onSelect(item.id);
              }}
              onPointerEnter={() => setHoveredId(item.id)}
              onFocus={() => setHoveredId(item.id)}
              onBlur={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
              aria-label={t.openRelatedAriaLabel(localizedName)}
              title={localizedName}
              className={cn(
                "relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full outline-none",
                "transition-[transform,margin] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                index > 0 && "-ml-1.5 sm:-ml-2 sm:group-hover/fan:-ml-0.5",
                poseClass,
                "hover:z-10 hover:-translate-y-1.5 hover:rotate-0 hover:scale-[1.22]",
                "focus-visible:z-10 focus-visible:-translate-y-1 focus-visible:rotate-0 focus-visible:scale-[1.16] focus-visible:ring-2 focus-visible:ring-ring",
                "active:scale-95",
              )}
            >
              {def ? (
                <Sticker
                  def={def}
                  size={28}
                  color={displayColor}
                  className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-[filter] duration-150 hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.16)]"
                />
              ) : (
                <span
                  aria-hidden
                  style={{ backgroundColor: item.mixColor }}
                  className="block size-5 animate-pulse rounded-full opacity-25"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
