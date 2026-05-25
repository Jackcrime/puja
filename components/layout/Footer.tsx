"use client";

import React from "react";
import Link from "next/link";
import {
  Youtube, Facebook, Instagram, Phone,
  Twitter, MessageCircle, Send, Globe, Link as LinkIcon,
} from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";
import { useTentangInfoPublic } from "@/lib/hooks/useTentangInfo";
import type { SocialLink } from "@/lib/hooks/useTentangInfo";

// ─── Platform → Lucide icon ────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  Instagram,
  YouTube:       Youtube,
  Facebook,
  "X (Twitter)": Twitter,
  TikTok:        MessageCircle, // closest available
  WhatsApp:      Phone,
  Telegram:      Send,
  Website:       Globe,
  Lainnya:       LinkIcon,
};

// Fallback statis kalau Firestore belum di-seed
const FALLBACK_SOCIALS: SocialLink[] = [
  { platform: "YouTube",   handle: "YouTube GKPB",   url: "https://www.youtube.com/@sinodegkpb" },
  { platform: "Facebook",  handle: "Facebook GKPB",  url: "fb://facewebmodal/f?href=https://www.facebook.com/61566909179740" },
  { platform: "Instagram", handle: "Instagram GKPB", url: "https://www.instagram.com/sinodegkpb" },
  { platform: "WhatsApp",  handle: "Whatsapp GKPB",  url: "https://wa.me/628213141064" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Footer() {
  const { t }    = useI18n();
  const year     = new Date().getFullYear();
  const { data } = useTentangInfoPublic();

  // Pakai data Firestore kalau ada, fallback ke hardcode
  const socials = data.socials && data.socials.length > 0
    ? data.socials
    : FALLBACK_SOCIALS;

  return (
    <footer className="w-full border-t bg-card mt-auto py-10 no-print">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="font-serif font-semibold text-foreground mb-1">Gereja Kristen Protestan di Bali</p>
            <p className="text-sm text-muted-foreground">Sinode GKPB — Bali, Indonesia</p>
          </div>

          {/* Medsos icons — dinamis dari Firestore */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {socials.map((s) => {
              const Icon = PLATFORM_ICONS[s.platform] ?? LinkIcon;
              return (
                <a
                  key={s.platform + s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.handle || s.platform}
                  title={s.handle || s.platform}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground transition-colors hover:text-white"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--brand)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "";
                    (e.currentTarget as HTMLElement).style.borderColor = "";
                  }}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>{t("footer.copyright").replace("{year}", String(year))}</p>
          <div className="flex items-center gap-4">
            <Link href="/tentang" className="hover:text-foreground transition-colors">{t("footer.about")}</Link>
            <a href="https://pujidanjanji.balichurchsynod.org/kebijakan-privasi" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{t("footer.privacy")}</a>
            {/* Nomor WA dinamis dari kontak Firestore jika ada */}
            <a
              href={socials.find((s) => s.platform === "WhatsApp")?.url ?? "https://wa.me/628213141064"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {t("footer.contact")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}