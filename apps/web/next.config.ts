import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  transpilePackages: ["@waste/api-client", "@waste/design-tokens", "@waste/ui"],
  async rewrites() {
    const apiTarget = (process.env.API_PROXY_TARGET ?? process.env.API_BASE_URL)?.replace(
      /\/+$/,
      "",
    );
    if (!apiTarget) return [];

    return [
      {
        source: "/v1/:path*",
        destination: `${apiTarget}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
