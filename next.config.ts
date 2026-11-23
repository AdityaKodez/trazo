import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["scribbles-icons"],
  },
};

export default nextConfig;
