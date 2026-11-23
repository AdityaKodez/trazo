import { ImageResponse } from "next/og";

import { paletteOptions } from "@/config/palette";
import { siteConfig } from "@/config/site";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const MIX_STOPS = paletteOptions
  .filter((option) => option.kind === "swatch")
  .map((option) => option.hex);

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="4 4 24 24" width="32" height="32" fill="none">
          <defs>
            <linearGradient
              id="trazo-mix"
              x1="7"
              y1="22"
              x2="25"
              y2="10"
              gradientUnits="userSpaceOnUse"
            >
              {MIX_STOPS.map((hex, index) => (
                <stop
                  key={hex}
                  offset={index / (MIX_STOPS.length - 1)}
                  stopColor={hex}
                />
              ))}
            </linearGradient>
          </defs>
          <path
            d={siteConfig.markStroke}
            fill="none"
            stroke="url(#trazo-mix)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="24.4"
            cy="10"
            r="2.1"
            fill={MIX_STOPS[MIX_STOPS.length - 1]}
          />
        </svg>
      </div>
    ),
    size,
  );
}
