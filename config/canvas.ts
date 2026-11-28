import type { StickerCategory } from "trazo/core";
import { findStickerMeta } from "trazo/meta";

export const CANVAS_WORLD = {
  width: 3456,
  height: 2880,
  halfWidth: 1728,
  halfHeight: 1440,
} as const;

/**
 * Radial spread applied to the authored coordinates. Keeps the hand-placed
 * sheet readable while giving the hero and each sticker cluster room to breathe.
 */
const CANVAS_SPREAD = 1.2;

export interface ZoneAnchor {
  id: StickerCategory;
  label: string;
  x: number;
  y: number;
}

const zoneAnchors: readonly ZoneAnchor[] = [
  {
    id: "ocean",
    label: "Ocean & sea life",
    x: 0,
    y: -255,
  },
  {
    id: "arrows",
    label: "Arrows & flow",
    x: -980,
    y: -60,
  },
  {
    id: "nature",
    label: "Nature & weather",
    x: 0,
    y: -690,
  },
  {
    id: "hearts",
    label: "Hearts & sparks",
    x: 980,
    y: -60,
  },
  {
    id: "symbols",
    label: "Symbols & marks",
    x: 0,
    y: 690,
  },
  {
    id: "cats",
    label: "Cats & kitties",
    x: 1065,
    y: 685,
  },
  {
    id: "characters",
    label: "Characters",
    x: -1065,
    y: 685,
  },
  {
    id: "school",
    label: "School & desk",
    x: 1050,
    y: -685,
  },
  {
    id: "food",
    label: "Food & snacks",
    x: -1020,
    y: -740,
  },
  {
    id: "games",
    label: "Games",
    x: 0,
    y: 985,
  },
  {
    id: "music",
    label: "Music",
    x: 0,
    y: -950,
  },
] as const;

export const canvasZones: readonly ZoneAnchor[] = zoneAnchors.map((zone) => ({
  ...zone,
  x: Math.round(zone.x * CANVAS_SPREAD),
  y: Math.round(zone.y * CANVAS_SPREAD),
}));

export interface CanvasStickerPlacement {
  id: string;
  /** World X coordinate relative to (0, 0) center. */
  x: number;
  /** World Y coordinate relative to (0, 0) center. */
  y: number;
  /** Rendered sticker pixel size on canvas. */
  size: number;
  /** Subtle rotation in degrees for a hand-placed sticker sheet feel. */
  rotate: number;
  /** Optional handwritten margin note displayed near edge-peeking items. */
  marginNote?: string;
  /** Optional placement of the handwritten margin note. */
  noteSide?: "top" | "bottom" | "left" | "right";
}

const stickerPlacements: readonly CanvasStickerPlacement[] = [
  // ---------------------------------------------------------------------------
  // INNER SHOWCASE RING AROUND HERO: 16 Multi-Layer Pastel Ocean & Sea Life SVGs
  // ---------------------------------------------------------------------------
  {
    id: "baby-squid",
    x: -360,
    y: -245,
    size: 98,
    rotate: -7,
    marginNote: "Click a sticker to customize",
    noteSide: "top",
  },
  {
    id: "conch-shell",
    x: -175,
    y: -340,
    size: 88,
    rotate: -5,
  },
  {
    id: "flapjack-octopus",
    x: 175,
    y: -340,
    size: 92,
    rotate: 6,
  },
  {
    id: "seahorse",
    x: 370,
    y: -235,
    size: 106,
    rotate: 7,
    marginNote: "Recolor from the dock below",
    noteSide: "top",
  },
  {
    id: "sea-turtle",
    x: -440,
    y: -55,
    size: 104,
    rotate: -6,
  },
  {
    id: "shrimp",
    x: -295,
    y: -115,
    size: 86,
    rotate: 8,
  },
  {
    id: "starfish",
    x: 295,
    y: -110,
    size: 86,
    rotate: -9,
  },
  {
    id: "red-octopus",
    x: 445,
    y: -45,
    size: 102,
    rotate: 6,
  },
  {
    id: "red-crab",
    x: -415,
    y: 145,
    size: 106,
    rotate: -5,
  },
  {
    id: "blue-minnow",
    x: -275,
    y: 75,
    size: 82,
    rotate: -8,
  },
  {
    id: "sea-bubble",
    x: 280,
    y: 75,
    size: 76,
    rotate: 5,
  },
  {
    id: "pink-jellyfish",
    x: 430,
    y: 155,
    size: 104,
    rotate: 7,
  },
  {
    id: "dolphin",
    x: -285,
    y: 285,
    size: 112,
    rotate: -6,
    marginNote: "Drag paper to explore",
    noteSide: "bottom",
  },
  {
    id: "pearl-clam",
    x: -85,
    y: 270,
    size: 98,
    rotate: 5,
  },
  {
    id: "scallop-shell",
    x: 95,
    y: 275,
    size: 84,
    rotate: -7,
  },
  {
    id: "striped-fish",
    x: 295,
    y: 285,
    size: 102,
    rotate: 6,
  },

  // ---------------------------------------------------------------------------
  // NORTH QUADRANTS: Nature & weather (12 stickers)
  // ---------------------------------------------------------------------------
  {
    id: "puffy-cloud",
    x: -210,
    y: -520,
    size: 84,
    rotate: -6,
  },
  {
    id: "sun-burst",
    x: 0,
    y: -525,
    size: 86,
    rotate: 8,
  },
  {
    id: "flower-yellow",
    x: 215,
    y: -520,
    size: 78,
    rotate: 10,
  },
  {
    id: "flower-red",
    x: -520,
    y: -475,
    size: 84,
    rotate: -9,
  },
  {
    id: "ocean-waves",
    x: 525,
    y: -470,
    size: 94,
    rotate: 5,
  },
  {
    id: "splash-drops",
    x: -350,
    y: -665,
    size: 86,
    rotate: -7,
  },
  {
    id: "triple-zigzag",
    x: 355,
    y: -665,
    size: 88,
    rotate: 6,
  },
  {
    id: "scalloped-wave",
    x: -595,
    y: -690,
    size: 94,
    rotate: -4,
  },
  {
    id: "spiky-grass",
    x: 225,
    y: -815,
    size: 90,
    rotate: 4,
  },
  {
    id: "earth",
    x: 140,
    y: -650,
    size: 110,
    rotate: -5,
  },
  {
    id: "mushroom",
    x: -175,
    y: -790,
    size: 88,
    rotate: -5,
  },
  {
    id: "sleepy-fox",
    x: -365,
    y: -835,
    size: 92,
    rotate: 4,
  },

  // ---------------------------------------------------------------------------
  // WEST QUADRANTS: Arrows & flow (12 stickers)
  // ---------------------------------------------------------------------------
  {
    id: "curly-arrow",
    x: -635,
    y: -210,
    size: 92,
    rotate: 9,
  },
  {
    id: "spiral",
    x: -645,
    y: 45,
    size: 84,
    rotate: -8,
  },
  {
    id: "loop-arrow-orange",
    x: -615,
    y: 280,
    size: 88,
    rotate: -11,
  },
  {
    id: "loop-ribbon",
    x: -820,
    y: -330,
    size: 90,
    rotate: -6,
  },
  {
    id: "square-spiral",
    x: -845,
    y: 145,
    size: 86,
    rotate: 5,
  },
  {
    id: "zigzag-scribble",
    x: -790,
    y: 410,
    size: 86,
    rotate: -8,
  },
  {
    id: "down-arrow",
    x: -910,
    y: -520,
    size: 86,
    rotate: 4,
  },
  {
    id: "vertical-zigzag",
    x: -1110,
    y: -270,
    size: 88,
    rotate: -5,
  },
  {
    id: "peach-coil",
    x: -1105,
    y: 50,
    size: 86,
    rotate: 8,
  },
  {
    id: "sky-coil",
    x: -1050,
    y: 330,
    size: 88,
    rotate: -6,
  },
  {
    id: "paper-plane",
    x: -850,
    y: -155,
    size: 86,
    rotate: -6,
  },
  {
    id: "wavy-underline",
    x: -1275,
    y: -115,
    size: 82,
    rotate: -3,
  },

  // ---------------------------------------------------------------------------
  // EAST QUADRANTS: Hearts & sparks (14 stickers)
  // ---------------------------------------------------------------------------
  {
    id: "heart-burst",
    x: 635,
    y: -205,
    size: 92,
    rotate: -8,
  },
  {
    id: "sparkle-four",
    x: 645,
    y: 50,
    size: 84,
    rotate: 7,
  },
  {
    id: "double-hearts",
    x: 615,
    y: 285,
    size: 88,
    rotate: 10,
  },
  {
    id: "crown-rays",
    x: 825,
    y: -325,
    size: 88,
    rotate: 9,
  },
  {
    id: "six-star",
    x: 850,
    y: 140,
    size: 88,
    rotate: -6,
  },
  {
    id: "bowtie-loop",
    x: 795,
    y: 410,
    size: 86,
    rotate: -7,
  },
  {
    id: "solid-star",
    x: 780,
    y: -545,
    size: 84,
    rotate: 12,
  },
  {
    id: "heart-chevron",
    x: 1065,
    y: -335,
    size: 86,
    rotate: -8,
  },
  {
    id: "sparkle-cross",
    x: 1110,
    y: -80,
    size: 86,
    rotate: 6,
  },
  {
    id: "triple-heart-swirl",
    x: 1085,
    y: 175,
    size: 94,
    rotate: -5,
  },
  {
    id: "star-outline",
    x: 1035,
    y: 425,
    size: 88,
    rotate: 8,
  },
  {
    id: "crosshair-burst",
    x: 1255,
    y: 55,
    size: 86,
    rotate: -6,
  },
  {
    id: "party-popper",
    x: 840,
    y: -150,
    size: 88,
    rotate: -5,
  },
  {
    id: "crown",
    x: 1245,
    y: -225,
    size: 84,
    rotate: 6,
  },

  // ---------------------------------------------------------------------------
  // SOUTH QUADRANTS: Symbols & marks (14 stickers)
  // ---------------------------------------------------------------------------
  {
    id: "lightning-bolt",
    x: -205,
    y: 485,
    size: 80,
    rotate: -9,
  },
  {
    id: "asterisk",
    x: 0,
    y: 495,
    size: 76,
    rotate: 11,
  },
  {
    id: "diamond",
    x: 205,
    y: 485,
    size: 78,
    rotate: 7,
  },
  {
    id: "question-mark",
    x: -435,
    y: 535,
    size: 86,
    rotate: -8,
  },
  {
    id: "exclamation-mark",
    x: 440,
    y: 535,
    size: 86,
    rotate: 9,
  },
  {
    id: "anger-mark",
    x: -330,
    y: 715,
    size: 86,
    rotate: -6,
  },
  {
    id: "circle-ring",
    x: 335,
    y: 715,
    size: 82,
    rotate: -7,
  },
  {
    id: "hashtag",
    x: 0,
    y: 825,
    size: 86,
    rotate: 5,
  },
  {
    id: "triangle",
    x: -630,
    y: 675,
    size: 84,
    rotate: 8,
  },
  {
    id: "diagonal-hatch",
    x: 635,
    y: 675,
    size: 86,
    rotate: -5,
  },
  {
    id: "trophy",
    x: -175,
    y: 625,
    size: 82,
    rotate: -4,
  },
  {
    id: "rocket",
    x: -215,
    y: 850,
    size: 84,
    rotate: 4,
  },
  {
    id: "speech-bubble",
    x: 225,
    y: 850,
    size: 82,
    rotate: -4,
  },
  {
    id: "checkmark",
    x: 525,
    y: 835,
    size: 76,
    rotate: 5,
  },

  // ---------------------------------------------------------------------------
  // SOUTH-EAST QUADRANT: Cats & kitties (8 stickers)
  // ---------------------------------------------------------------------------
  {
    id: "heart-cat",
    x: 845,
    y: 595,
    size: 100,
    rotate: -6,
    marginNote: "Cute hand-drawn cats",
    noteSide: "top",
  },
  {
    id: "daisy-cat",
    x: 1060,
    y: 585,
    size: 98,
    rotate: 5,
  },
  {
    id: "hugging-cats",
    x: 1275,
    y: 575,
    size: 104,
    rotate: -5,
  },
  {
    id: "flower-cat",
    x: 795,
    y: 785,
    size: 98,
    rotate: 6,
  },
  {
    id: "bowtie-cat",
    x: 960,
    y: 750,
    size: 94,
    rotate: -4,
  },
  {
    id: "stacked-cats",
    x: 1180,
    y: 745,
    size: 106,
    rotate: 5,
  },
  {
    id: "cheering-cat",
    x: 1320,
    y: 805,
    size: 98,
    rotate: -6,
  },
  {
    id: "heart-hug",
    x: 1065,
    y: 875,
    size: 106,
    rotate: 4,
  },

  // ---------------------------------------------------------------------------
  // SOUTH-WEST QUADRANT: Characters (5 stickers)
  // ---------------------------------------------------------------------------
  {
    id: "spider-man",
    x: -1250,
    y: 775,
    size: 112,
    rotate: -5,
  },
  {
    id: "pink-dino",
    x: -1065,
    y: 760,
    size: 110,
    rotate: 6,
  },
  {
    id: "stitch",
    x: -880,
    y: 780,
    size: 120,
    rotate: -4,
  },
  {
    id: "little-green-alien",
    x: -1264,
    y: 579,
    size: 126,
    rotate: 5,
  },
  {
    id: "woody-wink",
    x: -860,
    y: 576,
    size: 118,
    rotate: -5,
  },

  // ---------------------------------------------------------------------------
  // NORTH-EAST QUADRANT: School & desk accessories (12 stickers)
  // ---------------------------------------------------------------------------
  {
    id: "pencil-sharpener",
    x: 560,
    y: -855,
    size: 98,
    rotate: -6,
  },
  {
    id: "crayon-box",
    x: 755,
    y: -865,
    size: 108,
    rotate: 5,
  },
  {
    id: "yellow-pencil",
    x: 960,
    y: -865,
    size: 104,
    rotate: -6,
  },
  {
    id: "blue-crayon",
    x: 1155,
    y: -860,
    size: 104,
    rotate: 6,
  },
  {
    id: "highlighter",
    x: 1335,
    y: -835,
    size: 102,
    rotate: -5,
  },
  {
    id: "spiral-notebook",
    x: 680,
    y: -690,
    size: 104,
    rotate: -5,
    marginNote: "School & desk kit",
    noteSide: "left",
  },
  {
    id: "book-stack",
    x: 865,
    y: -715,
    size: 108,
    rotate: 4,
  },
  {
    id: "open-book",
    x: 1215,
    y: -700,
    size: 108,
    rotate: -4,
  },
  {
    id: "school-backpack",
    x: 1355,
    y: -645,
    size: 108,
    rotate: 5,
  },
  {
    id: "school-eraser",
    x: 945,
    y: -555,
    size: 98,
    rotate: 6,
  },
  {
    id: "wooden-ruler",
    x: 1125,
    y: -545,
    size: 104,
    rotate: -5,
  },
  {
    id: "craft-scissors",
    x: 1315,
    y: -475,
    size: 104,
    rotate: 6,
  },

  // ---------------------------------------------------------------------------
  // NORTH-WEST QUADRANT: Food & snacks (7 stickers)
  // ---------------------------------------------------------------------------
  {
    id: "pizza",
    x: -1235,
    y: -835,
    size: 106,
    rotate: -6,
  },
  {
    id: "iced-coffee",
    x: -1025,
    y: -860,
    size: 98,
    rotate: -4,
  },
  {
    id: "burger",
    x: -825,
    y: -845,
    size: 104,
    rotate: 5,
    marginNote: "Fresh food & snacks",
    noteSide: "top",
  },
  {
    id: "french-fries",
    x: -1275,
    y: -645,
    size: 102,
    rotate: 4,
  },
  {
    id: "sandwich",
    x: -1055,
    y: -635,
    size: 100,
    rotate: -4,
  },
  {
    id: "pastry",
    x: -795,
    y: -650,
    size: 100,
    rotate: 6,
  },
  {
    id: "glazed-donut",
    x: -1185,
    y: -480,
    size: 94,
    rotate: 6,
  },
  // ---------------------------------------------------------------------------
  // FAR SOUTH QUADRANT: Games (6 stickers)
  // ---------------------------------------------------------------------------
  {
    id: "game-coin",
    x: -355,
    y: 995,
    size: 76,
    rotate: -7,
  },
  {
    id: "game-coral-key",
    x: 340,
    y: 985,
    size: 82,
    rotate: 8,
  },
  {
    id: "game-coin-stack",
    x: -485,
    y: 1140,
    size: 80,
    rotate: 4,
  },
  {
    id: "game-mint-gem",
    x: -165,
    y: 1110,
    size: 78,
    rotate: -5,
  },
  {
    id: "game-xp-badge",
    x: 135,
    y: 1145,
    size: 76,
    rotate: 5,
  },
  {
    id: "game-reward-chest",
    x: 445,
    y: 1125,
    size: 84,
    rotate: -4,
  },
  // FAR NORTH QUADRANT: Music (6 stickers)
  {
    id: "headphones",
    x: -170,
    y: -1080,
    size: 96,
    rotate: -7,
  },
  {
    id: "cassette",
    x: -35,
    y: -1140,
    size: 90,
    rotate: 5,
  },
  {
    id: "vinyl-record",
    x: 158,
    y: -1110,
    size: 100,
    rotate: 6,
  },
  {
    id: "electric-guitar",
    x: -162,
    y: -952,
    size: 102,
    rotate: -7,
  },
  {
    id: "microphone",
    x: 172,
    y: -965,
    size: 91,
    rotate: 6,
  },
  {
    id: "music-notes",
    x: 0,
    y: -1033,
    size: 82,
    rotate: -8,
  },
] as const;

export interface ResolvedCanvasStickerPlacement extends CanvasStickerPlacement {
  category: StickerCategory;
}

export const canvasPlacements: readonly ResolvedCanvasStickerPlacement[] =
  stickerPlacements.map((placement) => ({
    ...placement,
    x: Math.round(placement.x * CANVAS_SPREAD),
    y: Math.round(placement.y * CANVAS_SPREAD),
    category: findStickerMeta(placement.id)?.category ?? "ocean",
  }));

const canvasPlacementById = new Map<string, ResolvedCanvasStickerPlacement>(
  canvasPlacements.map((item) => [item.id, item]),
);

export function findCanvasPlacement(
  id: string,
): ResolvedCanvasStickerPlacement | undefined {
  return canvasPlacementById.get(id);
}
