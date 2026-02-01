import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  allowedDevOrigins: ["http://localhost:3000", "http://localhost:3001", "192.168.0.2:3000"],
};

export default nextConfig;
