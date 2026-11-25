import type { SVGAttributes } from "svelte/elements";

export interface SvelteStickerProps
  extends Omit<SVGAttributes<SVGSVGElement>, "children" | "color" | "rotate"> {
  size?: number | string;
  /** Omit or use "mix" for the original multi-color crayon artwork. */
  color?: string;
  /** Rotation in degrees around the sticker center. */
  rotate?: number;
  title?: string;
}
