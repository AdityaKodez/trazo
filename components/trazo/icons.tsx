"use client";

import {
  ArrowLeft as ArrowLeftGlyph,
  ArrowUpRight as ArrowUpRightGlyph,
  Check as CheckGlyph,
  Code as CodeGlyph,
  Compass as CompassGlyph,
  Copy as CopyGlyph,
  Download as DownloadGlyph,
  ImageDown as ImageDownGlyph,
  LayoutGrid as LayoutGridGlyph,
  Moon as MoonGlyph,
  Palette as PaletteGlyph,
  Plus as PlusGlyph,
  Ruler as RulerGlyph,
  Search as SearchGlyph,
  Sun as SunGlyph,
  X as XGlyph,
  type IconProps,
} from "scribbles-icons";
import type { ComponentType, SVGProps } from "react";

type SiteIconProps = SVGProps<SVGSVGElement> & { size?: number | string };

// Scribbles icons for site controls only. Brand marks and stickers keep their own art.
function createSiteIcon(
  Icon: ComponentType<IconProps>,
  weight: IconProps["weight"] = "fill",
) {
  return function SiteIcon(props: SiteIconProps) {
    return <Icon size={24} aria-hidden="true" {...props} weight={weight} />;
  };
}

export const ArrowLeft = createSiteIcon(ArrowLeftGlyph);
export const ArrowUpRight = createSiteIcon(ArrowUpRightGlyph);
export const Check = createSiteIcon(CheckGlyph, "bold");
export const Code = createSiteIcon(CodeGlyph, "bold");
export const Compass = createSiteIcon(CompassGlyph);
export const Copy = createSiteIcon(CopyGlyph);
export const Download = createSiteIcon(DownloadGlyph);
export const ImageDown = createSiteIcon(ImageDownGlyph);
export const LayoutGrid = createSiteIcon(LayoutGridGlyph);
export const Moon = createSiteIcon(MoonGlyph);
export const Palette = createSiteIcon(PaletteGlyph);
export const Plus = createSiteIcon(PlusGlyph, "bold");
export const Ruler = createSiteIcon(RulerGlyph);
export const Search = createSiteIcon(SearchGlyph, "bold");
export const Sun = createSiteIcon(SunGlyph);
export const X = createSiteIcon(XGlyph, "bold");
