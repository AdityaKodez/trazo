import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { findSticker, type StickerDef } from "trazo/svg";

import { siteConfig } from "@/config/site";

export const alt = "Trazo hand-drawn crayon SVG sticker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const caveatBold = await readFile(
  join(process.cwd(), "app/_fonts/Caveat-Bold.ttf"),
);

const INK = "#1f1e1b";
const MUTED = "#6b6860";

const MIX_STOPS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#16a34a",
  "#38bdf8",
  "#2563eb",
  "#ec4899",
] as const;

function StickerArt({ def, px }: { def: StickerDef; px: number }) {
  const layers =
    def.layers && def.layers.length > 0
      ? def.layers
      : [{ d: def.d, fill: def.mixColor }];

  return (
    <svg viewBox={def.viewBox} width={px} height={px} fill="none">
      {layers.map((layer, index) => (
        <path key={index} d={layer.d} fill={layer.fill} fillRule="evenodd" />
      ))}
    </svg>
  );
}

export default async function StickerOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sticker = findSticker(id);

  if (!sticker) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            fontFamily: "Caveat",
            fontSize: "96px",
            fontWeight: 700,
            color: INK,
          }}
        >
          trazo
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: "Caveat",
            data: caveatBold,
            style: "normal",
            weight: 700,
          },
        ],
      },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          padding: "56px 76px",
          position: "relative",
        }}
      >
        {/* Left: Large Sticker Artwork */}
        <div
          style={{
            width: "410px",
            height: "410px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <StickerArt def={sticker} px={350} />
        </div>

        {/* Right: Sticker Title, Category, Component & Brand */}
        <div
          style={{
            width: "580px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "8px 18px",
                borderRadius: "999px",
                backgroundColor: "#f4f2ec",
                fontSize: "24px",
                fontWeight: 600,
                color: MUTED,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {sticker.category}
            </div>
            <div
              style={{
                display: "flex",
                padding: "8px 18px",
                borderRadius: "999px",
                backgroundColor: "#f4f2ec",
                fontSize: "24px",
                fontWeight: 600,
                color: INK,
              }}
            >
              {`<${sticker.componentName} />`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Caveat",
              fontWeight: 700,
              fontSize: "104px",
              lineHeight: 0.96,
              letterSpacing: "-0.02em",
              color: INK,
            }}
          >
            {sticker.name}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "28px",
              lineHeight: 1.35,
              color: MUTED,
            }}
          >
            Free hand-drawn crayon SVG sticker for React, Vue &amp; web.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "14px",
            }}
          >
            <svg viewBox="0 0 32 32" width="44" height="44" fill="none">
              <defs>
                <linearGradient
                  id="trazo-sticker-og-mix"
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
                stroke="url(#trazo-sticker-og-mix)"
                strokeWidth="2.8"
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
            <div
              style={{
                display: "flex",
                fontFamily: "Caveat",
                fontWeight: 700,
                fontSize: "48px",
                lineHeight: 1,
                color: INK,
                paddingBottom: "4px",
              }}
            >
              trazo
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "24px",
                color: MUTED,
                marginLeft: "8px",
              }}
            >
              · trazo.akoder.xyz
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Caveat",
          data: caveatBold,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
