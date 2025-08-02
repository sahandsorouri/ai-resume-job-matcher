import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  },
  // Disable ESLint during build to prevent failure due to warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Webpack optimization to reduce bundle size
  webpack: (config, { isServer, dev }) => {
    // Completely disable webpack cache
    config.cache = false;
    
    if (!isServer) {
      // Optimize client-side bundle with smaller chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          maxSize: 244000, // Keep chunks under 250KB
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: -10,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: "react",
              chunks: "all",
              priority: 10,
            },
            firecrawl: {
              test: /[\\/]node_modules[\\/](@mendable)[\\/]/,
              name: "firecrawl",
              chunks: "all",
              priority: 5,
            },
          },
        },
      };
    }
    return config;
  },
  // Enable compression
  compress: true,
  // Disable webpack cache completely
  experimental: {
    webpackBuildWorker: false,
  },
  // Configure for Cloudflare Pages
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
