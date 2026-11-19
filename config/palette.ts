import type { StickerDef } from "trazo";

export type PaletteId =
  | "ink"
  | "mix"
  | "coral"
  | "tangerine"
  | "sunny"
  | "grass"
  | "sky"
  | "cobalt"
  | "pink";

export interface PaletteOption {
  id: PaletteId;
  label: string;
  hex: string;
  kind: "ink" | "mix" | "swatch";
}

export const INK_HEX = "#1f1e1b";

export const paletteOptions: readonly PaletteOption[] = [
  {
    id: "mix",
    label: "Crayon mix",
    hex: "#f97316",
    kind: "mix",
  },
  {
    id: "ink",
    label: "Default ink",
    hex: INK_HEX,
    kind: "ink",
  },
  {
    id: "coral",
    label: "Coral",
    hex: "#ef4444",
    kind: "swatch",
  },
  {
    id: "tangerine",
    label: "Tangerine",
    hex: "#f97316",
    kind: "swatch",
  },
  {
    id: "sunny",
    label: "Sunny",
    hex: "#eab308",
    kind: "swatch",
  },
  {
    id: "grass",
    label: "Grass",
    hex: "#16a34a",
    kind: "swatch",
  },
  {
    id: "sky",
    label: "Sky",
    hex: "#38bdf8",
    kind: "swatch",
  },
  {
    id: "cobalt",
    label: "Cobalt",
    hex: "#2563eb",
    kind: "swatch",
  },
  {
    id: "pink",
    label: "Pink",
    hex: "#ec4899",
    kind: "swatch",
  },
] as const;

export function findPaletteOption(id: PaletteId): PaletteOption {
  return paletteOptions.find((item) => item.id === id) ?? paletteOptions[0];
}

/**
 * Returns a concrete hex color for any sticker under the active palette mode.
 * Never returns a CSS variable so canvas PNG exports and copied SVG snippets always resolve.
 */
export function resolveStickerHex(
  def: StickerDef,
  paletteId: PaletteId,
): string {
  if (paletteId === "ink") {
    return INK_HEX;
  }
  if (paletteId === "mix") {
    return def.mixColor;
  }
  const swatch = paletteOptions.find((item) => item.id === paletteId);
  return swatch?.hex ?? INK_HEX;
}
