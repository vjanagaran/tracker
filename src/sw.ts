/// <reference lib="webworker" />

import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

function isSupabaseHost(hostname: string) {
  return hostname.endsWith("supabase.co") || hostname.endsWith("supabase.in");
}

function isAppRoute(pathname: string) {
  return /^\/(wheel|tasks|boards|spoke|profile|admin)(\/|$)/.test(pathname);
}

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ url }) => isSupabaseHost(url.hostname),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ request, url }) =>
      request.mode === "navigate" ||
      request.destination === "document" ||
      (url.origin === self.location.origin && isAppRoute(url.pathname)),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ request, url }) =>
      url.origin === self.location.origin &&
      (request.destination === "script" ||
        request.destination === "style" ||
        request.destination === "font" ||
        url.pathname.startsWith("/_next/static/")),
    handler: new CacheFirst({
      cacheName: "pb-static-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: ({ request, url }) =>
      url.origin === self.location.origin &&
      (request.destination === "image" ||
        url.pathname.startsWith("/icons/") ||
        url.pathname === "/manifest.json"),
    handler: new CacheFirst({
      cacheName: "pb-static-images",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: () => true,
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document" || request.mode === "navigate";
        },
      },
    ],
  },
});

serwist.addEventListeners();
