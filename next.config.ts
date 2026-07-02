import type { NextConfig } from "next";

// Served from https://<user>.github.io/CronLens/ in production (GitHub Pages
// project subpath). basePath/assetPrefix are only applied when PAGES=true so
// local dev at localhost:3000 stays path-free. See docs/Architecture.md §6.
const repo = "CronLens";
const isPages = process.env.PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isPages ? `/${repo}` : "",
  assetPrefix: isPages ? `/${repo}/` : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
