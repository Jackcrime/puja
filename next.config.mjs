import withPWA from "@ducanh2912/next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  customWorkerSrc: "worker",          // ← inject worker/index.ts ke SW
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  fallbackRoutes: {
    document: "/offline",             // ← fallback halaman saat offline
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Cache semua halaman app dengan NetworkFirst (offline tetap jalan)
      {
        urlPattern: /^https:\/\/.*\.(?:html)$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "html-cache",
          expiration: { maxEntries: 32, maxAgeSeconds: 86400 },
        },
      },
      // Cache font Google
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 8, maxAgeSeconds: 31536000 },
        },
      },
      // Cache audio renungan
      {
        urlPattern: /\.(?:mp3|wav|ogg)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "audio-cache",
          expiration: { maxEntries: 16, maxAgeSeconds: 604800 },
          rangeRequests: true,
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default pwaConfig(nextConfig);
