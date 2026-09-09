import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks dev-only assets (JS chunks, HMR, hydration data) from any
  // origin except localhost by default — needed to test over LAN on a phone.
  allowedDevOrigins: ["192.168.1.61"],
  // An iOS PWA can sit suspended for days, so after a deploy it may still be
  // running the previous build's JS — whose Server Function IDs no longer
  // exist, making every post fail. With a deployment id Next detects the
  // mismatch from the response header and does a full reload instead.
  deploymentId:
    process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA,
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
