import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack for faster hot reload
  reactCompiler: true,
  
  // Turbopack configuration for better file watching in Docker
  turbopack: {
    resolveAlias: {
      // Ensure proper module resolution
    },
  },
  
  // Watch options for better file watching (when using webpack fallback)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
    return config;
  },
  
  // Development optimizations
  experimental: {
    // Enable faster refresh
    optimizePackageImports: ['lucide-react'],
  },
  
  // Security headers for production
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Image domains for S3/CloudFront (for AWS deployment)
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_IMAGE_DOMAINS
      ? process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(",").map((domain) => ({
          protocol: "https",
          hostname: domain,
        }))
      : [],
  },
};

export default nextConfig;
