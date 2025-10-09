import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow ngrok and other dev origins to prevent HMR issues
  experimental: {
    allowedDevOrigins: [
      '.ngrok-free.app',
      '.ngrok.io',
      'localhost:3000',
    ],
  },
  // Webpack configuration to reduce HMR aggressive reloading
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce HMR aggressiveness
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

export default nextConfig;
