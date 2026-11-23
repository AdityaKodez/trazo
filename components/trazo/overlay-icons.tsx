"use client";

import {
  ArrowLeft as ArrowLeftGlyph,
  Code as CodeGlyph,
  Compass as CompassGlyph,
  Download as DownloadGlyph,
  ImageDown as ImageDownGlyph,
  Moon as MoonGlyph,
  Palette as PaletteGlyph,
  Plus as PlusGlyph,
  RotateCcw as RotateCcwGlyph,
  RotateCw as RotateCwGlyph,
  Ruler as RulerGlyph,
  Search as SearchGlyph,
  Sun as SunGlyph,
  type IconProps,
} from "scribbles-icons";
import type { ComponentType, SVGProps } from "react";

type SiteIconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function createSiteIcon(
  Icon: ComponentType<IconProps>,
  weight: IconProps["weight"] = "fill",
) {
  return function SiteIcon(props: SiteIconProps) {
    return <Icon size={24} aria-hidden="true" {...props} weight={weight} />;
  };
}

export const ArrowLeft = /*#__PURE__*/ createSiteIcon(ArrowLeftGlyph);
export const Code = /*#__PURE__*/ createSiteIcon(CodeGlyph, "bold");
export const Compass = /*#__PURE__*/ createSiteIcon(CompassGlyph);
export const Download = /*#__PURE__*/ createSiteIcon(DownloadGlyph);
export const ImageDown = /*#__PURE__*/ createSiteIcon(ImageDownGlyph);
export const Moon = /*#__PURE__*/ createSiteIcon(MoonGlyph);
export const Palette = /*#__PURE__*/ createSiteIcon(PaletteGlyph);
export const Plus = /*#__PURE__*/ createSiteIcon(PlusGlyph, "bold");
export const RotateCcw = /*#__PURE__*/ createSiteIcon(RotateCcwGlyph);
export const RotateCw = /*#__PURE__*/ createSiteIcon(RotateCwGlyph);
export const Ruler = /*#__PURE__*/ createSiteIcon(RulerGlyph);
export const Search = /*#__PURE__*/ createSiteIcon(SearchGlyph, "bold");
export const Sun = /*#__PURE__*/ createSiteIcon(SunGlyph);
