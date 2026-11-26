import type { NextConfig } from "next";

const STATIC_ASSET_CACHE_CONTROL =
  "public, max-age=604800, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["radix-ui", "motion/react"],
  },
  async headers() {
    return [
      {
        source: "/ui-icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: STATIC_ASSET_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/sounds/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: STATIC_ASSET_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/agent-skills/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: STATIC_ASSET_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/testimonials/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: STATIC_ASSET_CACHE_CONTROL,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
