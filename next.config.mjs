/**
 * When deployed to GitHub Pages from a project repository the site lives at
 * https://<user>.github.io/<repo>/ — so internal links and static assets must
 * be prefixed with the repo path. The desktop build runs without a basePath
 * (served from the packaged out/ at root), so we only set it when the env var
 * is provided by the deploy workflow.
 *
 *   GitHub Pages build:  NEXT_PUBLIC_BASE_PATH=/Aegis-AI---Network-IDS
 *   Desktop / local:     (unset — defaults to root)
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
