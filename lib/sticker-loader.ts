import { useEffect, useSyncExternalStore } from "react";
import { oceanStickers } from "trazo/catalog/ocean";
import type { StickerCategory, StickerDef } from "trazo/core";
import { findStickerMeta } from "trazo/meta";

export const ALL_STICKER_CATEGORIES: readonly StickerCategory[] = [
  "music",
  "games",
  "ocean",
  "arrows",
  "nature",
  "hearts",
  "symbols",
  "cats",
  "characters",
  "school",
  "food",
] as const;

const categoryLoaders: Record<StickerCategory, () => Promise<readonly StickerDef[]>> = {
  music: () => import("trazo/catalog/music").then((m) => m.musicStickers),
  games: () => import("trazo/catalog/games").then((m) => m.gamesStickers),
  ocean: async () => oceanStickers,
  arrows: () => import("trazo/catalog/arrows").then((m) => m.arrowsStickers),
  nature: () => import("trazo/catalog/nature").then((m) => m.natureStickers),
  hearts: () => import("trazo/catalog/hearts").then((m) => m.heartsStickers),
  symbols: () => import("trazo/catalog/symbols").then((m) => m.symbolsStickers),
  cats: () => import("trazo/catalog/cats").then((m) => m.catsStickers),
  characters: () => import("trazo/catalog/characters").then((m) => m.charactersStickers),
  school: () => import("trazo/catalog/school").then((m) => m.schoolStickers),
  food: () => import("trazo/catalog/food").then((m) => m.foodStickers),
};

const oceanById = new Map<string, StickerDef>(
  oceanStickers.map((item) => [item.id, item]),
);
const loadedById = new Map<string, StickerDef>(oceanById);
const loadedCategories = new Set<StickerCategory>(["ocean"]);
const inflightCategories = new Map<StickerCategory, Promise<readonly StickerDef[]>>();
const listeners = new Set<() => void>();

let storeVersion = 0;
let notifyScheduled = false;

function flushChange() {
  notifyScheduled = false;
  storeVersion += 1;
  for (const listener of listeners) {
    listener();
  }
}

function emitChange() {
  if (notifyScheduled) return;
  notifyScheduled = true;
  queueMicrotask(flushChange);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return storeVersion;
}

function getServerSnapshot() {
  return 0;
}

export function getLoadedSticker(id: string): StickerDef | undefined {
  return loadedById.get(id);
}

export function isCategoryLoaded(category: StickerCategory): boolean {
  return loadedCategories.has(category);
}

export function loadCategory(
  category: StickerCategory,
): Promise<readonly StickerDef[]> {
  if (loadedCategories.has(category)) {
    return categoryLoaders[category]();
  }

  const existing = inflightCategories.get(category);
  if (existing) {
    return existing;
  }

  const promise = categoryLoaders[category]()
    .then((stickers) => {
      for (const item of stickers) {
        loadedById.set(item.id, item);
      }
      loadedCategories.add(category);
      inflightCategories.delete(category);
      emitChange();
      return stickers;
    })
    .catch((error) => {
      inflightCategories.delete(category);
      throw error;
    });

  inflightCategories.set(category, promise);
  return promise;
}

export function loadCategories(categories: Iterable<StickerCategory>): Promise<void> {
  const pending: Promise<readonly StickerDef[]>[] = [];
  for (const category of categories) {
    if (!loadedCategories.has(category)) {
      pending.push(loadCategory(category));
    }
  }
  return Promise.all(pending).then(() => undefined);
}

export function loadAllCategories(): Promise<void> {
  return loadCategories(ALL_STICKER_CATEGORIES);
}

export function loadStickerById(id: string): Promise<StickerDef | undefined> {
  const existing = loadedById.get(id);
  if (existing) {
    return Promise.resolve(existing);
  }
  const meta = findStickerMeta(id);
  if (!meta) {
    return Promise.resolve(undefined);
  }
  return loadCategory(meta.category).then(() => loadedById.get(id));
}

export function useStickerLoaderVersion(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useStickerDef(id: string | null | undefined): StickerDef | undefined {
  const def = useSyncExternalStore(
    subscribe,
    () => (id ? loadedById.get(id) : undefined),
    () => (id ? oceanById.get(id) : undefined),
  );

  useEffect(() => {
    if (!id || loadedById.has(id)) return;
    void loadStickerById(id);
  }, [id]);

  return def;
}
