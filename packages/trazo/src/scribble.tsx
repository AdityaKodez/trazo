import { memo, type FC, type SVGProps } from "react";

import {
  getViewBoxCenter,
  normalizeRotation,
  resolveConcreteColor,
  shouldUseLayers,
  toSvgString,
  type StickerCategory,
  type StickerDef,
  type StickerLayer,
  type ToSvgStringOptions,
} from "./core";

export {
  resolveConcreteColor,
  toSvgString,
  type StickerCategory,
  type StickerDef,
  type StickerLayer,
  type ToSvgStringOptions,
};

const DEFAULT_VIEWBOX = "0 0 256 256";
const DEFAULT_CENTER = { cx: 128, cy: 128 } as const;
const viewBoxCenterCache = new Map<string, { cx: number; cy: number }>([
  [DEFAULT_VIEWBOX, DEFAULT_CENTER],
]);

function getCachedViewBoxCenter(viewBox: string): { cx: number; cy: number } {
  if (viewBox === DEFAULT_VIEWBOX) {
    return DEFAULT_CENTER;
  }
  const cached = viewBoxCenterCache.get(viewBox);
  if (cached) {
    return cached;
  }
  const [cx, cy] = getViewBoxCenter(viewBox);
  const entry = { cx, cy };
  viewBoxCenterCache.set(viewBox, entry);
  return entry;
}

export interface StickerProps
  extends Omit<SVGProps<SVGSVGElement>, "children" | "rotate"> {
  def: StickerDef;
  size?: number | string;
  /** Optional single-color override. Omit for the default multi-color crayon artwork. */
  color?: string;
  /** Optional rotation angle in degrees around the sticker center. Defaults to `0`. */
  rotate?: number;
  title?: string;
}

export type NamedStickerProps = Omit<StickerProps, "def">;

function StickerBase({
  def,
  size = 48,
  color,
  rotate = 0,
  title,
  overflow,
  ...props
}: StickerProps) {
  const trimmedColor = color?.trim();
  const useLayers = shouldUseLayers(def, trimmedColor);
  const resolvedFill = trimmedColor || "currentColor";
  const normalizedRotate = normalizeRotation(rotate);
  const { cx, cy } = getCachedViewBoxCenter(def.viewBox);

  const artwork =
    useLayers && def.layers ? (
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
    );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={def.viewBox}
      width={size}
      height={size}
      fill="none"
      overflow={overflow ?? (normalizedRotate !== 0 ? "visible" : undefined)}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {normalizedRotate !== 0 ? (
        <g transform={`rotate(${normalizedRotate} ${cx} ${cy})`}>{artwork}</g>
      ) : (
        artwork
      )}
    </svg>
  );
}

export const Sticker = memo(StickerBase);
Sticker.displayName = "Sticker";

export function createStickerComponent(def: StickerDef): FC<NamedStickerProps> {
  const Component: FC<NamedStickerProps> = (props) => <Sticker def={def} {...props} />;
  Component.displayName = def.componentName;
  return Component;
}
