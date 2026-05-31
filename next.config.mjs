import withPWA from "@ducanh2912/next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  customWorkerSrc: "worker",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  fallbackRoutes: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.(?:html)$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "html-cache",
          expiration: { maxEntries: 32, maxAgeSeconds: 86400 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 8, maxAgeSeconds: 31536000 },
        },
      },
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

  images: {
    formats: ["image/avif", "image/webp"],  // konversi otomatis ke format modern
    remotePatterns: [
      // Supabase Storage — foto penulis, thumbnail, dll (format: <project>.supabase.co)
      { protocol: "https", hostname: "*.supabase.co"  },
      // Supabase CDN / storage edge
      { protocol: "https", hostname: "*.supabase.in"  },
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

export default pwaConfig(nextConfig);
