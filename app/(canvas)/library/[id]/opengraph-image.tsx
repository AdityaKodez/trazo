import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { findSticker, type StickerDef } from "trazo/svg";

import { akoderMarkLayers } from "@/config/akoder-mark";

export const alt = "Trazo hand-drawn crayon SVG sticker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const shantellBold = await readFile(
  join(process.cwd(), "app/_fonts/ShantellSans-Bold.ttf"),
);

const imageOptions = {
  ...size,
  fonts: [
    {
      name: "Shantell Sans",
      data: shantellBold,
      style: "normal" as const,
      weight: 700 as const,
    },
  ],
};

const INK = "#1f1e1b";

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
            fontFamily: "Shantell Sans",
            fontSize: 76,
            fontWeight: 700,
            color: INK,
          }}
        >
          trazo
        </div>
      ),
      imageOptions,
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
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#ffffff",
          fontFamily: "Shantell Sans",
          fontWeight: 700,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.min(300, Math.floor(1560 / sticker.name.length)),
            lineHeight: 1,
            whiteSpace: "nowrap",
            color: "#c8bbab",
          }}
        >
          {sticker.name}
        </div>

        <StickerArt def={sticker} px={390} />

        <div
          style={{
            position: "absolute",
            right: 40,
            bottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 2,
            fontSize: 28,
            lineHeight: 1,
            color: INK,
          }}
        >
          <div style={{ whiteSpace: "pre" }}>{"made by "}</div>
          <svg viewBox="0 1 16 15" width="32" height="30" fill="none">
            {akoderMarkLayers.map((layer) => (
              <path key={layer.fill} d={layer.d} fill={layer.fill} />
            ))}
          </svg>
          <div>ditya</div>
        </div>
      </div>
    ),
    imageOptions,
  );
}
