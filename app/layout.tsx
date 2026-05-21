import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Providers } from "./providers";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const playfair = Playfair_Display({
  subsets:  ["latin"],
  variable: "--font-playfair",
  display:  "swap",
  weight:   ["400", "600", "700"],
  style:    ["normal", "italic"],
});

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-inter",
  display:  "swap",
  weight:   ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Puji dan Janji",
  description: "Panduan bacaan Alkitab harian dan renungan Sinode Gereja Kristen Protestan di Bali. Gratis dan terbuka untuk semua.",
  keywords: ["GKPB","Gereja Kristen Protestan Bali","Puji dan Janji","Janji Hidup","renungan harian","Alkitab"],
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Puji & Janji",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7B1D1D" },
    { media: "(prefers-color-scheme: dark)",  color: "#1a1008"  },
  ],
  width:        "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/gkpb-logo.png" />
      </head>
      <body className="font-sans antialiased">
        <ServiceWorkerRegistrar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}