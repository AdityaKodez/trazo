import type { StickerMeta } from "trazo/core";

import type { Locale } from "@/lib/use-locale";

const EMPTY_NAMES: Readonly<Record<string, string>> = {};
const loadedStickerNames = new Map<Locale, Readonly<Record<string, string>>>([
  ["en", EMPTY_NAMES],
]);
const pendingStickerLoads = new Map<
  Locale,
  Promise<Readonly<Record<string, string>>>
>();

export function hasLoadedStickerLocale(locale: Locale): boolean {
  return loadedStickerNames.has(locale);
}

export function loadStickerLocale(
  locale: Locale,
): Promise<Readonly<Record<string, string>>> {
  const cached = loadedStickerNames.get(locale);
  if (cached) return Promise.resolve(cached);

  const pending = pendingStickerLoads.get(locale);
  if (pending) return pending;

  const loader =
    locale === "zh-CN"
      ? import("./stickers/zh-CN").then((mod) => mod.default)
      : import("./stickers/ja").then((mod) => mod.default);

  const promise = loader
    .then((names) => {
      loadedStickerNames.set(locale, names);
      pendingStickerLoads.delete(locale);
      return names;
    })
    .catch((error) => {
      pendingStickerLoads.delete(locale);
      throw error;
    });

  pendingStickerLoads.set(locale, promise);
  return promise;
}

export function getStickerDisplayName(
  id: string,
  fallbackName: string,
  locale: Locale,
): string {
  if (locale === "en") return fallbackName;
  return loadedStickerNames.get(locale)?.[id] ?? fallbackName;
}

export function getLocalizedStickerName(
  item: Pick<StickerMeta, "id" | "name">,
  locale: Locale,
): string {
  return getStickerDisplayName(item.id, item.name, locale);
}
