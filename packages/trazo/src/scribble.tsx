import type { FC, SVGProps } from "react";

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

export function Sticker({
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
  const [cx, cy] = getViewBoxCenter(def.viewBox);

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

export function createStickerComponent(def: StickerDef): FC<NamedStickerProps> {
  const Component: FC<NamedStickerProps> = (props) => <Sticker def={def} {...props} />;
  Component.displayName = def.componentName;
  return Component;
}
