import type { StickerCategory, StickerMeta } from "trazo/core";
import { trazoCatalogMeta } from "trazo/meta";

import { findCanvasPlacement } from "@/config/canvas";

const TASTE_STORAGE_KEY = "trazo:taste:v1";
const STICKER_OFFSETS_STORAGE_KEY = "trazo:sticker-offsets:v1";
const MAX_TASTE_EVENTS = 18;
const MAX_SEARCH_TERMS = 5;
const CANVAS_PAIR_RADIUS = 300;

export type TasteEventKind = "view" | "locate" | "export";

interface TasteEvent {
  id: string;
  kind: TasteEventKind;
  ts: number;
}

interface StoredTaste {
  events: TasteEvent[];
  searches: string[];
}

const EMPTY_TASTE: StoredTaste = { events: [], searches: [] };

/**
 * Curated cross-category scenes representing stickers people naturally combine
 * on landing pages, decks, notes, and sticker sheets.
 */
const SCENE_CLUSTERS: Readonly<Record<string, readonly string[]>> = {
  launch: [
    "rocket",
    "party-popper",
    "paper-plane",
    "trophy",
    "checkmark",
    "sparkle-four",
    "crown",
    "lightning-bolt",
    "crown-rays",
    "solid-star",
  ],
  space: [
    "rocket",
    "earth",
    "little-green-alien",
    "six-star",
    "sparkle-four",
    "star-outline",
    "lightning-bolt",
    "game-mint-gem",
  ],
  cozyDesk: [
    "iced-coffee",
    "spiral-notebook",
    "yellow-pencil",
    "blue-crayon",
    "crayon-box",
    "highlighter",
    "open-book",
    "book-stack",
    "headphones",
    "sleepy-fox",
    "glazed-donut",
    "pastry",
  ],
  kawaii: [
    "heart-cat",
    "daisy-cat",
    "hugging-cats",
    "flower-cat",
    "bowtie-cat",
    "stacked-cats",
    "cheering-cat",
    "heart-hug",
    "baby-squid",
    "flapjack-octopus",
    "starfish",
    "pink-jellyfish",
    "heart-burst",
    "double-hearts",
    "bowtie-loop",
    "sleepy-fox",
    "pastry",
  ],
  oceanBeach: [
    "baby-squid",
    "conch-shell",
    "flapjack-octopus",
    "seahorse",
    "shrimp",
    "starfish",
    "sea-turtle",
    "red-octopus",
    "blue-minnow",
    "red-crab",
    "pearl-clam",
    "pink-jellyfish",
    "dolphin",
    "scallop-shell",
    "striped-fish",
    "sea-bubble",
    "ocean-waves",
    "sun-burst",
    "puffy-cloud",
    "scalloped-wave",
    "splash-drops",
  ],
  retroArcade: [
    "cassette",
    "vinyl-record",
    "headphones",
    "electric-guitar",
    "microphone",
    "music-notes",
    "game-coin",
    "game-coin-stack",
    "game-mint-gem",
    "game-xp-badge",
    "game-reward-chest",
    "game-coral-key",
    "lightning-bolt",
    "trophy",
    "crown",
    "diamond",
    "spider-man",
  ],
  woodlandNature: [
    "mushroom",
    "sleepy-fox",
    "flower-red",
    "flower-yellow",
    "spiky-grass",
    "sun-burst",
    "puffy-cloud",
    "earth",
    "flower-cat",
    "daisy-cat",
    "sea-turtle",
  ],
  snackParty: [
    "pizza",
    "burger",
    "french-fries",
    "sandwich",
    "pastry",
    "iced-coffee",
    "glazed-donut",
    "party-popper",
    "speech-bubble",
    "heart-burst",
    "cheering-cat",
    "shrimp",
  ],
  artCraft: [
    "yellow-pencil",
    "blue-crayon",
    "crayon-box",
    "highlighter",
    "school-eraser",
    "wooden-ruler",
    "craft-scissors",
    "pencil-sharpener",
    "spiral-notebook",
    "school-backpack",
    "zigzag-scribble",
    "wavy-underline",
    "diagonal-hatch",
    "curly-arrow",
  ],
  popCulture: [
    "spider-man",
    "stitch",
    "little-green-alien",
    "woody-wink",
    "pink-dino",
    "lightning-bolt",
    "anger-mark",
    "speech-bubble",
    "crown-rays",
    "crosshair-burst",
    "game-xp-badge",
  ],
  calloutUI: [
    "curly-arrow",
    "loop-arrow-orange",
    "down-arrow",
    "wavy-underline",
    "loop-ribbon",
    "speech-bubble",
    "checkmark",
    "question-mark",
    "exclamation-mark",
    "sparkle-four",
    "sparkle-cross",
    "crown-rays",
    "heart-chevron",
    "hashtag",
    "asterisk",
    "diamond",
  ],
};

/**
 * Decorative / callout marks that pair naturally alongside subject stickers.
 */
const ACCENT_STICKER_IDS = new Set<string>([
  "sparkle-four",
  "sparkle-cross",
  "six-star",
  "star-outline",
  "crown-rays",
  "heart-burst",
  "heart-chevron",
  "bowtie-loop",
  "curly-arrow",
  "loop-arrow-orange",
  "wavy-underline",
  "loop-ribbon",
  "speech-bubble",
  "exclamation-mark",
  "question-mark",
  "anger-mark",
  "asterisk",
  "diagonal-hatch",
  "music-notes",
  "splash-drops",
  "sea-bubble",
]);

interface HslColor {
  h: number;
  s: number;
  l: number;
}

interface CatalogIndex {
  byId: Map<string, StickerMeta>;
  tagIdf: Map<string, number>;
  hslById: Map<string, HslColor>;
  scenesById: Map<string, readonly string[]>;
}

let cachedIndex: CatalogIndex | null = null;
let cachedTaste: StoredTaste | null = null;

function parseHexToHsl(hex: string): HslColor {
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  if (clean.length !== 6) {
    return { h: 0, s: 0, l: 0.5 };
  }
  const num = Number.parseInt(clean, 16);
  if (!Number.isFinite(num)) {
    return { h: 0, s: 0, l: 0.5 };
  }
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, l };
}

function colorSimilarity(a: HslColor, b: HslColor): number {
  const dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180;
  const ds = Math.abs(a.s - b.s);
  const dl = Math.abs(a.l - b.l);
  const dist = Math.sqrt(dh * dh * 1.4 + ds * ds * 0.4 + dl * dl * 0.4);
  return Math.max(0, 1 - dist * 1.35);
}

/**
 * Lazily builds lookup tables on first use so importing this module costs 0ms.
 */
function ensureIndex(): CatalogIndex {
  if (cachedIndex) return cachedIndex;

  const byId = new Map<string, StickerMeta>();
  const docFreq = new Map<string, number>();
  const hslById = new Map<string, HslColor>();
  const scenesMap = new Map<string, string[]>();

  for (const item of trazoCatalogMeta) {
    byId.set(item.id, item);
    hslById.set(item.id, parseHexToHsl(item.mixColor));
    for (const tag of item.tags) {
      const normalized = tag.toLowerCase();
      docFreq.set(normalized, (docFreq.get(normalized) ?? 0) + 1);
    }
  }

  const totalDocs = trazoCatalogMeta.length;
  const tagIdf = new Map<string, number>();
  for (const [tag, freq] of docFreq) {
    tagIdf.set(tag, Math.log((totalDocs + 1) / (freq + 0.5)));
  }

  for (const [scene, ids] of Object.entries(SCENE_CLUSTERS)) {
    for (const id of ids) {
      const list = scenesMap.get(id);
      if (list) {
        list.push(scene);
      } else {
        scenesMap.set(id, [scene]);
      }
    }
  }

  cachedIndex = {
    byId,
    tagIdf,
    hslById,
    scenesById: scenesMap,
  };
  return cachedIndex;
}

function readStoredTaste(): StoredTaste {
  if (typeof window === "undefined") return EMPTY_TASTE;
  if (cachedTaste) return cachedTaste;

  try {
    const raw = window.localStorage.getItem(TASTE_STORAGE_KEY);
    if (!raw) {
      cachedTaste = EMPTY_TASTE;
      return cachedTaste;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      cachedTaste = EMPTY_TASTE;
      return cachedTaste;
    }
    const obj = parsed as Partial<StoredTaste>;
    const events: TasteEvent[] = Array.isArray(obj.events)
      ? obj.events
          .filter(
            (e): e is TasteEvent =>
              Boolean(e) &&
              typeof e === "object" &&
              typeof e.id === "string" &&
              (e.kind === "view" || e.kind === "locate" || e.kind === "export") &&
              typeof e.ts === "number" &&
              Number.isFinite(e.ts),
          )
          .slice(-MAX_TASTE_EVENTS)
      : [];
    const searches: string[] = Array.isArray(obj.searches)
      ? obj.searches
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .slice(-MAX_SEARCH_TERMS)
      : [];

    cachedTaste = { events, searches };
    return cachedTaste;
  } catch {
    cachedTaste = EMPTY_TASTE;
    return cachedTaste;
  }
}

function writeStoredTaste(next: StoredTaste): void {
  cachedTaste = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function hasStoredPersonalization(excludeStickerId?: string): boolean {
  if (typeof window === "undefined") return false;
  const taste = readStoredTaste();
  if (taste.searches.length > 0) return true;
  if (
    taste.events.some((evt) =>
      excludeStickerId ? evt.id !== excludeStickerId : true,
    )
  ) {
    return true;
  }
  try {
    return Boolean(window.localStorage.getItem(STICKER_OFFSETS_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function recordStickerTaste(id: string, kind: TasteEventKind): void {
  if (typeof window === "undefined") return;
  const prev = readStoredTaste();
  const last = prev.events[prev.events.length - 1];
  const now = Date.now();
  // Deduplicate immediate repeats of the same action
  if (last && last.id === id && last.kind === kind && now - last.ts < 4000) {
    return;
  }
  const events = [...prev.events, { id, kind, ts: now }].slice(-MAX_TASTE_EVENTS);
  writeStoredTaste({ events, searches: prev.searches });
}

export function recordSearchTaste(query: string): void {
  if (typeof window === "undefined") return;
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 2);
  if (tokens.length === 0) return;

  const prev = readStoredTaste();
  const merged = [...prev.searches.filter((t) => !tokens.includes(t)), ...tokens].slice(
    -MAX_SEARCH_TERMS,
  );
  writeStoredTaste({ events: prev.events, searches: merged });
}

/**
 * Finds stickers the user intentionally dragged close to `currentId` on the canvas.
 * Reads directly from localStorage only when offsets exist to avoid subscribing to drag frames.
 */
function findCanvasCoPlacedIds(currentId: string): Set<string> {
  const result = new Set<string>();
  if (typeof window === "undefined") return result;

  try {
    const raw = window.localStorage.getItem(STICKER_OFFSETS_STORAGE_KEY);
    if (!raw) return result;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return result;

    const offsets = parsed as Record<string, { x?: number; y?: number }>;
    const currentOffset = offsets[currentId];
    if (
      !currentOffset ||
      typeof currentOffset.x !== "number" ||
      typeof currentOffset.y !== "number"
    ) {
      return result;
    }

    const currentPlacement = findCanvasPlacement(currentId);
    if (!currentPlacement) return result;

    const cx = currentPlacement.x + currentOffset.x;
    const cy = currentPlacement.y + currentOffset.y;

    for (const [otherId, otherOffset] of Object.entries(offsets)) {
      if (
        otherId === currentId ||
        !otherOffset ||
        typeof otherOffset.x !== "number" ||
        typeof otherOffset.y !== "number"
      ) {
        continue;
      }
      const otherPlacement = findCanvasPlacement(otherId);
      if (!otherPlacement) continue;
      const ox = otherPlacement.x + otherOffset.x;
      const oy = otherPlacement.y + otherOffset.y;
      if (Math.hypot(ox - cx, oy - cy) <= CANVAS_PAIR_RADIUS) {
        result.add(otherId);
      }
    }
  } catch {
    // Ignore invalid storage entries
  }

  return result;
}

export interface RelatedStickersOptions {
  /** Number of related stickers to return (defaults to 5). */
  count?: number;
  /** Optional concrete hex swatch currently selected (undefined for original colors or neutral ink). */
  activeColorHex?: string;
  /** Current search query in the library palette, if any. */
  activeSearchQuery?: string;
  /** Set false during SSR / initial hydration to guarantee deterministic cold-start output. */
  usePersonalization?: boolean;
}

const KIND_WEIGHT: Record<TasteEventKind, number> = {
  view: 0.45,
  locate: 1.4,
  export: 2.6,
};

/**
 * Computes cross-category, silently personalized related stickers for `currentId`.
 * Runs purely on `trazoCatalogMeta` in < 1ms with zero network or SVG overhead.
 */
export function getRelatedStickers(
  currentId: string,
  options?: RelatedStickersOptions,
): StickerMeta[] {
  const count = options?.count ?? 5;
  const index = ensureIndex();
  const current = index.byId.get(currentId);
  if (!current) return [];

  const usePersonalization = options?.usePersonalization ?? true;
  const currentTags = new Set(current.tags.map((t) => t.toLowerCase()));
  const currentScenes = index.scenesById.get(current.id) ?? [];
  const currentSceneSet = new Set(currentScenes);
  const currentIsAccent = ACCENT_STICKER_IDS.has(current.id);

  const targetHsl = options?.activeColorHex
    ? parseHexToHsl(options.activeColorHex)
    : (index.hslById.get(current.id) ?? { h: 0, s: 0, l: 0.5 });

  // Build local session taste affinities
  const tasteTagWeights = new Map<string, number>();
  const tasteSceneWeights = new Map<string, number>();
  const recentViewedOrder: string[] = [];
  const searchTerms = new Set<string>();
  let canvasCoPlaced = new Set<string>();

  if (usePersonalization) {
    const taste = readStoredTaste();
    const totalEvents = taste.events.length;

    taste.events.forEach((evt, idx) => {
      if (evt.id === current.id) return;
      const meta = index.byId.get(evt.id);
      if (!meta) return;

      // Recency factor rises smoothly from 0.45 (oldest) to 1.0 (most recent)
      const recency = totalEvents <= 1 ? 1 : 0.45 + (idx / (totalEvents - 1)) * 0.55;
      const weight = KIND_WEIGHT[evt.kind] * recency;

      for (const tag of meta.tags) {
        const lower = tag.toLowerCase();
        const idf = index.tagIdf.get(lower) ?? 1;
        tasteTagWeights.set(lower, (tasteTagWeights.get(lower) ?? 0) + weight * idf * 0.18);
      }

      const scenes = index.scenesById.get(evt.id);
      if (scenes) {
        for (const sc of scenes) {
          tasteSceneWeights.set(sc, (tasteSceneWeights.get(sc) ?? 0) + weight * 0.28);
        }
      }
    });

    // Track the last 2 stickers the user hopped away from (most recent first)
    for (let i = taste.events.length - 1; i >= 0 && recentViewedOrder.length < 2; i -= 1) {
      const evt = taste.events[i];
      if (evt.kind === "view" && evt.id !== current.id && !recentViewedOrder.includes(evt.id)) {
        recentViewedOrder.push(evt.id);
      }
    }

    for (const term of taste.searches) {
      searchTerms.add(term);
    }

    canvasCoPlaced = findCanvasCoPlacedIds(current.id);
  }

  if (options?.activeSearchQuery) {
    for (const token of options.activeSearchQuery.trim().toLowerCase().split(/\s+/)) {
      if (token.length >= 2) searchTerms.add(token);
    }
  }

  const scored: { meta: StickerMeta; score: number; isAccent: boolean }[] = [];

  for (const candidate of trazoCatalogMeta) {
    if (candidate.id === current.id) continue;

    // 1. IDF-weighted semantic tag overlap (ignoring broad category name match)
    let tagScore = 0;
    for (const tag of candidate.tags) {
      const lower = tag.toLowerCase();
      if (currentTags.has(lower) && lower !== current.category) {
        tagScore += (index.tagIdf.get(lower) ?? 1) * 0.55;
      }
    }

    // 2. Curated cross-category vibe / scene overlap
    const candScenes = index.scenesById.get(candidate.id);
    let sceneScore = 0;
    if (candScenes && currentSceneSet.size > 0) {
      for (const sc of candScenes) {
        if (currentSceneSet.has(sc)) {
          sceneScore += 1.45;
        }
      }
    }

    // 3. Color harmony (mixColor or active swatch proximity)
    const candHsl = index.hslById.get(candidate.id) ?? { h: 0, s: 0, l: 0.5 };
    const colorScore = colorSimilarity(targetHsl, candHsl) * 1.1;

    // 4. Subject <-> Accent pairing bonus
    const candIsAccent = ACCENT_STICKER_IDS.has(candidate.id);
    const accentScore = !currentIsAccent && candIsAccent ? 0.65 : 0;

    // 5. Mild same-category tiebreaker (never strong enough to flood all slots)
    const sameCatScore = candidate.category === current.category ? 0.38 : 0;

    // 6. Silent personalization layer (capped so relevance stays anchored to current sticker)
    let personalScore = 0;
    if (usePersonalization) {
      let pTag = 0;
      for (const tag of candidate.tags) {
        const lower = tag.toLowerCase();
        const w = tasteTagWeights.get(lower);
        if (w) pTag += Math.min(0.9, w);
        if (searchTerms.has(lower)) pTag += 0.85;
      }
      if (searchTerms.size > 0) {
        const lowerName = candidate.name.toLowerCase();
        for (const term of searchTerms) {
          if (lowerName.includes(term)) pTag += 0.7;
        }
      }

      let pScene = 0;
      if (candScenes) {
        for (const sc of candScenes) {
          const w = tasteSceneWeights.get(sc);
          if (w) pScene += Math.min(1.1, w);
        }
      }

      const canvasBoost = canvasCoPlaced.has(candidate.id) ? 1.5 : 0;
      personalScore = Math.min(1.45, pTag * 0.4 + pScene * 0.55 + canvasBoost);

      const recentRank = recentViewedOrder.indexOf(candidate.id);
      if (recentRank === 0) {
        // Strongly suppress immediate bounce-back (A -> B -> A)
        personalScore -= 4.0;
      } else if (recentRank === 1) {
        personalScore -= 1.8;
      }
    }

    const total =
      Math.min(3.4, tagScore + sceneScore) +
      colorScore +
      accentScore +
      sameCatScore +
      personalScore;

    scored.push({
      meta: candidate,
      score: total,
      isAccent: candIsAccent,
    });
  }

  scored.sort((a, b) => b.score - a.score || a.meta.id.localeCompare(b.meta.id));

  // MMR-style category diversity cap:
  // - Max 1 from current sticker's category
  // - Max 2 from any other single category
  // - Max 1 decorative accent slot (when viewing a non-accent subject)
  const picked: StickerMeta[] = [];
  const categoryCounts = new Map<StickerCategory, number>();
  let accentCount = 0;

  for (const entry of scored) {
    if (picked.length >= count) break;
    const cat = entry.meta.category;
    const maxForCat = cat === current.category ? 1 : 2;
    const usedForCat = categoryCounts.get(cat) ?? 0;
    if (usedForCat >= maxForCat) continue;
    if (!currentIsAccent && entry.isAccent && accentCount >= 1) continue;

    picked.push(entry.meta);
    categoryCounts.set(cat, usedForCat + 1);
    if (entry.isAccent) accentCount += 1;
  }

  // Fallback fill if catalog ever shrinks or caps were overly strict
  if (picked.length < count) {
    const pickedIds = new Set(picked.map((item) => item.id));
    for (const entry of scored) {
      if (picked.length >= count) break;
      if (pickedIds.has(entry.meta.id)) continue;
      picked.push(entry.meta);
      pickedIds.add(entry.meta.id);
    }
  }

  return picked;
}
