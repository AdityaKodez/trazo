"use client";

import { useId } from "react";

import { paletteOptions, type PaletteOption } from "@/config/palette";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const MIX_STOPS = paletteOptions
  .filter((option) => option.kind === "swatch")
  .map((option) => option.hex);

export function TrazoMark({
  option,
  className,
}: {
  option: PaletteOption;
  className?: string;
}) {
  const gradientId = useId();
  const stroke =
    option.kind === "mix"
      ? `url(#${gradientId})`
      : option.kind === "ink"
        ? "var(--scribble-ink)"
        : option.hex;
  const dotFill = option.kind === "mix" ? MIX_STOPS[MIX_STOPS.length - 1] : stroke;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      {option.kind === "mix" ? (
        <defs>
          <linearGradient
            id={gradientId}
            x1="7"
            y1="22"
            x2="25"
            y2="10"
            gradientUnits="userSpaceOnUse"
          >
            {MIX_STOPS.map((hex, index) => (
              <stop key={hex} offset={index / (MIX_STOPS.length - 1)} stopColor={hex} />
            ))}
          </linearGradient>
        </defs>
      ) : null}
      <path
        d={siteConfig.markStroke}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.4" cy="10" r="2.1" fill={dotFill} />
    </svg>
  );
}
