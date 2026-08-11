import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks dev-only assets (JS chunks, HMR, hydration data) from any
  // origin except localhost by default — needed to test over LAN on a phone.
  allowedDevOrigins: ["192.168.1.61"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
