import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
        <svg viewBox="0 0 32 32" width="32" height="32">
          <rect width="32" height="32" rx="10" fill="#181715" />
          <path
            d={siteConfig.markStroke}
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24.4" cy="10" r="2.1" fill="#ec4899" />
        </svg>
      </div>
    ),
    size,
  );
}
