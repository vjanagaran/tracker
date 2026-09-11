import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? "offline-1";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  cacheOnNavigation: false,
  reloadOnOnline: false,
  register: true,
  globPublicPatterns: ["icons/*", "manifest.json"],
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  manifestTransforms: [
    async (entries) => ({
      manifest: entries.filter((entry) => {
        const url = entry.url;
        if (url.includes("supabase")) {
          return false;
        }
        if (
          /^\/(wheel|tasks|boards|spoke|profile|admin|auth)(\/|$)/.test(url) ||
          url.startsWith("/_next/data/")
        ) {
          return false;
        }
        return (
          url.startsWith("/_next/static/") ||
          url.startsWith("/icons/") ||
          url === "/manifest.json" ||
          url === "/offline" ||
          url === "/favicon.ico"
        );
      }),
      warnings: [],
    }),
  ],
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
    ];
  },
};

export default process.env.NODE_ENV === "production"
  ? withSerwist(nextConfig)
  : nextConfig;
