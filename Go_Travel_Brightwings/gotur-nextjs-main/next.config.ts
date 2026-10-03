/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // 👇 Enables static export
  output: "export",

  // 👇 Change output directory (optional)
  distDir: "build",

  // Static export can't use the default image loader.
  images: { unoptimized: true },

  webpack: (config: any) => {
    config.module.rules.push({
      test: /\.(mjs|cjs)$/,
      type: "javascript/auto",
    });
    return config;
  },
};

export default nextConfig;
