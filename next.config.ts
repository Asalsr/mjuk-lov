import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for small Docker images.
  output: "standalone",
  images: {
    // YouTube thumbnails are optimized + cached by next/image (served from our
    // own domain, not YouTube's CDN), so they load fast and aren't refetched.
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
    // Thumbnails are immutable — cache the optimized copies for a month.
    minimumCacheTTL: 2_678_400,
  },
};

export default nextConfig;
