import type { NextConfig } from "next";

// Use basePath for GitHub Pages when provided, otherwise empty for local/dev
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { turbo: { rules: {} } },
  // Enable static HTML export
  output: "export",
  // Ensure static assets resolve correctly on GitHub Pages
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;



