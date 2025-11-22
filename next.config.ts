import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only enable static export for frontend builds (IPFS deployment)
  ...(process.env.BUILD_TARGET === 'frontend' && {
    output: 'export',
    trailingSlash: true, // Required for IPFS
    images: { unoptimized: true }, // Required for static export
  }),
};

export default nextConfig;
