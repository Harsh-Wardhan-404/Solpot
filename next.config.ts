import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Enable Fast Refresh (enabled by default in development)
  experimental: {
    // Turbopack is already enabled via CLI flag
  },
  
  // Ensure proper hot reload for all files
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Enable hot module replacement
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after the first change
      };
    }
    return config;
  },
};

export default nextConfig;
