import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@waste/api-client", "@waste/design-tokens", "@waste/ui"],
};

export default nextConfig;
