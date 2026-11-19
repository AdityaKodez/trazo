import { ImageResponse } from "next/og";
import {
  curlyArrowDef,
  heartBurstDef,
  sparkleFourDef,
  sunBurstDef,
  trazoCatalog,
} from "trazo";

export const alt = "Trazo · Hand-drawn crayon sticker SVGs for React and web";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf8f4",
          color: "#181715",
          position: "relative",
          padding: "64px",
        }}
      >
        <svg
          viewBox={curlyArrowDef.viewBox}
          width="150"
          height="150"
          style={{ position: "absolute", left: "90px", top: "85px" }}
        >
          <path d={curlyArrowDef.d} fill="#f97316" />
        </svg>
        <svg
          viewBox={heartBurstDef.viewBox}
          width="150"
          height="150"
          style={{ position: "absolute", right: "95px", top: "85px" }}
        >
          <path d={heartBurstDef.d} fill="#ec4899" />
        </svg>
        <svg
          viewBox={sunBurstDef.viewBox}
          width="145"
          height="145"
          style={{ position: "absolute", left: "110px", bottom: "85px" }}
        >
          <path d={sunBurstDef.d} fill="#eab308" />
        </svg>
        <svg
          viewBox={sparkleFourDef.viewBox}
          width="140"
          height="140"
          style={{ position: "absolute", right: "110px", bottom: "85px" }}
        >
          <path d={sparkleFourDef.d} fill="#2563eb" />
        </svg>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#ffffff",
            border: "1px solid #e6e1d7",
            borderRadius: "999px",
            padding: "8px 20px",
            fontSize: "20px",
            color: "#6b665e",
            marginBottom: "24px",
          }}
        >
          {trazoCatalog.length} crayon stickers · Zero runtime filters
        </div>

        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            textAlign: "center",
            maxWidth: "820px",
            lineHeight: 1.1,
          }}
        >
          Hand-drawn crayon stickers for the web.
        </div>

        <div
          style={{
            marginTop: "28px",
            display: "flex",
            alignItems: "center",
            backgroundColor: "#181715",
            color: "#faf8f4",
            borderRadius: "16px",
            padding: "14px 28px",
            fontSize: "26px",
            fontFamily: "monospace",
          }}
        >
          $ npm i trazo
        </div>
      </div>
    ),
    size,
  );
}
