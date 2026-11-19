import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import {
  babySquidDef,
  bowtieCatDef,
  cheeringCatDef,
  curlyArrowDef,
  daisyCatDef,
  dolphinDef,
  flowerCatDef,
  flowerRedDef,
  heartCatDef,
  puffyCloudDef,
  seahorseDef,
  sparkleFourDef,
  stackedCatsDef,
  sunBurstDef,
  type StickerDef,
} from "trazo";

import { akoderMarkLayers } from "@/config/akoder-mark";
import { siteConfig } from "@/config/site";

export const alt = "Trazo · Hand-drawn crayon sticker SVGs for React and web";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const caveatBold = await readFile(
  join(process.cwd(), "app/_fonts/Caveat-Bold.ttf"),
);

const INK = "#1f1e1b";

const MIX_STOPS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#16a34a",
  "#38bdf8",
  "#2563eb",
  "#ec4899",
] as const;

const CENTER_X = size.width / 2;
const CENTER_Y = size.height / 2;
const RING_RX = 418;
const RING_RY = 208;

interface OrbitSticker {
  def: StickerDef;
  angle: number;
  radius: number;
  size: number;
  rotate: number;
}

const orbit: readonly OrbitSticker[] = [
  { def: heartCatDef, angle: -8, radius: 1.0, size: 100, rotate: 5 },
  { def: sparkleFourDef, angle: 18, radius: 1.03, size: 80, rotate: 8 },
  { def: daisyCatDef, angle: 44, radius: 0.97, size: 96, rotate: -6 },
  { def: dolphinDef, angle: 70, radius: 1.02, size: 100, rotate: 6 },
  { def: stackedCatsDef, angle: 96, radius: 0.99, size: 96, rotate: -5 },
  { def: flowerRedDef, angle: 122, radius: 1.03, size: 86, rotate: -9 },
  { def: bowtieCatDef, angle: 148, radius: 0.98, size: 96, rotate: 6 },
  { def: curlyArrowDef, angle: 174, radius: 1.02, size: 86, rotate: -8 },
  { def: seahorseDef, angle: 200, radius: 0.97, size: 98, rotate: 7 },
  { def: puffyCloudDef, angle: 226, radius: 1.03, size: 86, rotate: -5 },
  { def: babySquidDef, angle: 252, radius: 0.99, size: 96, rotate: 6 },
  { def: flowerCatDef, angle: 278, radius: 1.02, size: 96, rotate: -7 },
  { def: sunBurstDef, angle: 304, radius: 0.98, size: 86, rotate: 8 },
  { def: cheeringCatDef, angle: 330, radius: 1.03, size: 96, rotate: -6 },
];

function positionFor(item: OrbitSticker) {
  const radians = (item.angle * Math.PI) / 180;
  return {
    x: Math.round(
      CENTER_X + Math.cos(radians) * RING_RX * item.radius - item.size / 2,
    ),
    y: Math.round(
      CENTER_Y + Math.sin(radians) * RING_RY * item.radius - item.size / 2,
    ),
  };
}

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

export default function OpenGraphImage() {
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
          position: "relative",
        }}
      >
        {orbit.map((item, index) => {
          const { x, y } = positionFor(item);
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: item.size,
                height: item.size,
                display: "flex",
                transform: `rotate(${item.rotate}deg)`,
              }}
            >
              <StickerArt def={item.def} px={item.size} />
            </div>
          );
        })}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            paddingRight: "43px",
          }}
        >
          <svg viewBox="0 0 32 32" width="168" height="168" fill="none">
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
              fontSize: "164px",
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: INK,
              paddingBottom: "14px",
            }}
          >
            trazo
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 40,
            bottom: 32,
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Caveat",
              fontWeight: 700,
              fontSize: "38px",
              lineHeight: 1,
              color: INK,
              whiteSpace: "pre",
            }}
          >
            {"made by "}
          </div>
          <svg viewBox="0 1 16 15" width="38" height="36" fill="none">
            {akoderMarkLayers.map((layer) => (
              <path key={layer.fill} d={layer.d} fill={layer.fill} />
            ))}
          </svg>
          <div
            style={{
              display: "flex",
              fontFamily: "Caveat",
              fontWeight: 700,
              fontSize: "38px",
              lineHeight: 1,
              color: INK,
            }}
          >
            ditya
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
