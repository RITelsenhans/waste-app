import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  transpilePackages: ["@waste/design-tokens", "@waste/ui"],
};

export default nextConfig;
