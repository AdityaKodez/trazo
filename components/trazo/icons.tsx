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
  RotateCcw as RotateCcwGlyph,
  RotateCw as RotateCwGlyph,
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
export const RotateCcw = createSiteIcon(RotateCcwGlyph);
export const RotateCw = createSiteIcon(RotateCwGlyph);
export const Ruler = createSiteIcon(RulerGlyph);
export const Search = createSiteIcon(SearchGlyph, "bold");
export const Sun = createSiteIcon(SunGlyph);
export const X = createSiteIcon(XGlyph, "bold");

export function GitHubLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

// Pixel-art "A" brand monogram from akoder.xyz
export function AkoderMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 1 16 15"
      fill="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M9 2h1v1h-1zM10 4h1v1h-1zM11 6h1v1h-1zM12 8h1v1h-1zM7 10h1v1h-1zM13 10h1v1h-1zM7 11h1v1h-1zM6 12h1v1h-1zM7 12h1v1h-1zM14 12h1v1h-1zM6 13h1v1h-1zM5 14h1v1h-1zM6 14h1v1h-1zM15 14h1v1h-1zM1 15h1v1h-1zM2 15h1v1h-1zM3 15h1v1h-1zM4 15h1v1h-1zM5 15h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM15 15h1v1h-1z"
        fill="#133667"
      />
      <path
        d="M6 1h1v1h-1zM7 1h1v1h-1zM8 1h1v1h-1zM6 2h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM4 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM3 7h1v1h-1zM5 7h1v1h-1zM7 7h1v1h-1zM9 7h1v1h-1zM11 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM8 8h1v1h-1zM10 8h1v1h-1zM5 9h1v1h-1zM9 9h1v1h-1zM2 10h1v1h-1zM6 10h1v1h-1zM10 10h1v1h-1z"
        fill="#2370be"
      />
      <path
        d="M6 5h1v1h-1zM10 5h1v1h-1zM5 6h1v1h-1zM9 6h1v1h-1zM4 7h1v1h-1zM6 7h1v1h-1zM8 7h1v1h-1zM10 7h1v1h-1zM3 8h1v1h-1zM5 8h1v1h-1zM7 8h1v1h-1zM9 8h1v1h-1zM11 8h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM10 9h1v1h-1zM11 9h1v1h-1zM12 9h1v1h-1zM3 10h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM1 11h1v1h-1zM2 11h1v1h-1zM3 11h1v1h-1zM4 11h1v1h-1zM5 11h1v1h-1zM6 11h1v1h-1zM8 11h1v1h-1zM9 11h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM1 12h1v1h-1zM2 12h1v1h-1zM3 12h1v1h-1zM4 12h1v1h-1zM5 12h1v1h-1zM9 12h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM12 12h1v1h-1zM13 12h1v1h-1zM0 13h1v1h-1zM1 13h1v1h-1zM2 13h1v1h-1zM3 13h1v1h-1zM4 13h1v1h-1zM5 13h1v1h-1zM9 13h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM12 13h1v1h-1zM13 13h1v1h-1zM14 13h1v1h-1zM0 14h1v1h-1zM1 14h1v1h-1zM2 14h1v1h-1zM3 14h1v1h-1zM4 14h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM12 14h1v1h-1zM13 14h1v1h-1zM14 14h1v1h-1z"
        fill="#a9dcf9"
      />
    </svg>
  );
}

// Simple Icons brand glyphs for code snippet language tabs.
export function ReactLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
    </svg>
  );
}

export function JavaScriptLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z" />
    </svg>
  );
}
