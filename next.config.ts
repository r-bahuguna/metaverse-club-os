import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS || false;
let assetPrefix = '';
let basePath = '';

if (isGithubActions) {
  assetPrefix = `/red-velvet-proposal/`;
  basePath = `/red-velvet-proposal`;
}

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  assetPrefix,
  basePath
};

export default nextConfig;
