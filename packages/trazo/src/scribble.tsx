import type { FC, SVGProps } from "react";

export type StickerCategory =
  | "ocean"
  | "arrows"
  | "nature"
  | "hearts"
  | "symbols"
  | "cats"
  | "characters";

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

export interface StickerProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  def: StickerDef;
  size?: number | string;
  color?: string;
  title?: string;
}

export type NamedStickerProps = Omit<StickerProps, "def">;

export interface ToSvgStringOptions {
  size?: number;
  color?: string;
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

export function Sticker({
  def,
  size = 48,
  color,
  title,
  ...props
}: StickerProps) {
  const trimmedColor = color?.trim();
  const useLayers =
    Boolean(def.layers && def.layers.length > 0) &&
    (!trimmedColor ||
      trimmedColor === "mix" ||
      trimmedColor.toLowerCase() === def.mixColor.toLowerCase());
  const resolvedFill = trimmedColor || "currentColor";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={def.viewBox}
      width={size}
      height={size}
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {useLayers && def.layers ? (
        def.layers.map((layer, index) => (
          <path
            key={index}
            d={layer.d}
            fill={layer.fill}
            fillRule="evenodd"
          />
        ))
      ) : (
        <path d={def.d} fill={resolvedFill} fillRule="evenodd" />
      )}
    </svg>
  );
}

export function createStickerComponent(def: StickerDef): FC<NamedStickerProps> {
  const Component: FC<NamedStickerProps> = (props) => <Sticker def={def} {...props} />;
  Component.displayName = def.componentName;
  return Component;
}

export function toSvgString(def: StickerDef, options?: ToSvgStringOptions): string {
  const size = options?.size ?? 64;
  const rawColor = options?.color?.trim();
  const useLayers =
    Boolean(def.layers && def.layers.length > 0) &&
    (!rawColor ||
      rawColor === "mix" ||
      rawColor.toLowerCase() === def.mixColor.toLowerCase());
  const titleTag = options?.title ? `<title>${escapeXml(options.title)}</title>` : "";
  const ariaAttr = options?.title
    ? `role="img" aria-label="${escapeXml(options.title)}"`
    : `aria-hidden="true"`;

  if (useLayers && def.layers) {
    const paths = def.layers
      .map(
        (layer) =>
          `<path d="${layer.d}" fill="${escapeXml(layer.fill)}" fill-rule="evenodd"/>`,
      )
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${escapeXml(def.viewBox)}" width="${size}" height="${size}" fill="none" ${ariaAttr}>${titleTag}${paths}</svg>`;
  }

  const fill = resolveConcreteColor(rawColor, "currentColor");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${escapeXml(def.viewBox)}" width="${size}" height="${size}" fill="none" ${ariaAttr}>${titleTag}<path d="${def.d}" fill="${escapeXml(fill)}" fill-rule="evenodd"/></svg>`;
}
