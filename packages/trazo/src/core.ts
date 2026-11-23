export type StickerCategory =
  | "ocean"
  | "arrows"
  | "nature"
  | "hearts"
  | "symbols"
  | "cats"
  | "characters"
  | "school"
  | "food";

export interface StickerLayer {
  d: string;
  fill: string;
}

export interface StickerDef {
  id: string;
  componentName: string;
  name: string;
  category: StickerCategory;
  mixColor: string;
  tags: readonly string[];
  viewBox: string;
  d: string;
  layers?: readonly StickerLayer[];
}

export interface ToSvgStringOptions {
  size?: number;
  /** Optional single-color override. Omit for the default multi-color crayon artwork. */
  color?: string;
  /** Optional rotation angle in degrees around the sticker center. Defaults to `0`. */
  rotate?: number;
  title?: string;
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function normalizeRotation(rotate?: number): number {
  if (typeof rotate !== "number" || !Number.isFinite(rotate)) {
    return 0;
  }
  const normalized = rotate % 360;
  return Object.is(normalized, -0) ? 0 : normalized;
}

export function getViewBoxCenter(viewBox: string): [number, number] {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    const [minX, minY, width, height] = parts;
    return [minX + width / 2, minY + height / 2];
  }
  return [128, 128];
}

export function shouldUseLayers(def: StickerDef, color?: string): boolean {
  if (!def.layers || def.layers.length === 0) {
    return false;
  }
  const trimmedColor = color?.trim();
  return !trimmedColor || trimmedColor.toLowerCase() === "mix";
}

/**
 * Resolves a color string for standalone SVG/PNG output.
 * Never emits CSS variables so offscreen canvas and downloaded SVGs always render concrete ink.
 */
export function resolveConcreteColor(color?: string, fallback = "currentColor"): string {
  const trimmed = color?.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("var(")) {
    return fallback === "currentColor" ? "#1f1e1b" : fallback;
  }
  return trimmed;
}

export function toSvgString(def: StickerDef, options?: ToSvgStringOptions): string {
  const size = options?.size ?? 64;
  const rawColor = options?.color?.trim();
  const useLayers = shouldUseLayers(def, rawColor);
  const normalizedRotate = normalizeRotation(options?.rotate);
  const [cx, cy] = getViewBoxCenter(def.viewBox);
  const titleTag = options?.title ? `<title>${escapeXml(options.title)}</title>` : "";
  const ariaAttr = options?.title
    ? `role="img" aria-label="${escapeXml(options.title)}"`
    : `aria-hidden="true"`;
  const overflowAttr = normalizedRotate !== 0 ? ` overflow="visible"` : "";

  const rawContent =
    useLayers && def.layers
      ? def.layers
          .map(
            (layer) =>
              `<path d="${layer.d}" fill="${escapeXml(layer.fill)}" fill-rule="evenodd"/>`,
          )
          .join("")
      : `<path d="${def.d}" fill="${escapeXml(resolveConcreteColor(rawColor, "currentColor"))}" fill-rule="evenodd"/>`;

  const content =
    normalizedRotate !== 0
      ? `<g transform="rotate(${normalizedRotate} ${cx} ${cy})">${rawContent}</g>`
      : rawContent;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${escapeXml(def.viewBox)}" width="${size}" height="${size}" fill="none"${overflowAttr} ${ariaAttr}>${titleTag}${content}</svg>`;
}
