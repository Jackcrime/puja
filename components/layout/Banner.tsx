"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Megaphone, Bell } from "lucide-react";
import { useAnnouncement } from "@/lib/hooks/useSupabaseData";
import { getLiturgicalEvents } from "@/lib/utils/liturgicalCalendar";

const BANNER_KEY_PREFIX = "gkpb_banner_v";

// ─── Hitung warna teks (hitam/putih) berdasarkan luminansi background ──────
function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1f2937" : "#ffffff";
}

export function Banner() {
  const [isVisible,    setIsVisible]    = useState(false);
  const [isDark,       setIsDark]       = useState(false);
  const [holidayBanner, setHolidayBanner] = useState<{ text: string; bg: string; fg: string } | null>(null);
  const { data: announcement } = useAnnouncement();

  // Detect & track sistem dark mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    // Cek hari raya liturgi hari ini — selalu tampil meski sudah di-dismiss
    const today = new Date();
    const events = getLiturgicalEvents(today);
    if (events.length > 0) {
      const ev = events[0];
      // Pilih warna sesuai mode, hitung text contrast otomatis
      const bg = (isDark && ev.darkColor) ? ev.darkColor : ev.color;
      const fg = getContrastColor(bg);
      setHolidayBanner({ text: `${ev.emoji} ${ev.name} — ${ev.greeting}`, bg, fg });
      setIsVisible(true);
      return;
    }

    if (!announcement?.text) return;

    const version = (announcement as any).updatedAt?.seconds
      ?? (announcement as any).updatedAt?.toMillis?.()
      ?? announcement.text.slice(0, 32);
    const dismissKey = `${BANNER_KEY_PREFIX}${version}`;

    try {
      const dismissed = localStorage.getItem(dismissKey);
      if (!dismissed) setIsVisible(true);
    } catch {
      setIsVisible(true);
    }
  }, [announcement, isDark]);

  // Re-compute holiday banner colors saat dark mode berubah
  useEffect(() => {
    if (!holidayBanner) return;
    const today = new Date();
    const events = getLiturgicalEvents(today);
    if (events.length > 0) {
      const ev = events[0];
      const bg = (isDark && ev.darkColor) ? ev.darkColor : ev.color;
      const fg = getContrastColor(bg);
      setHolidayBanner({ text: `${ev.emoji} ${ev.name} — ${ev.greeting}`, bg, fg });
    }
  }, [isDark]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    setIsVisible(false);
    if (!holidayBanner && announcement?.text) {
      const version = (announcement as any).updatedAt?.seconds
        ?? (announcement as any).updatedAt?.toMillis?.()
        ?? announcement.text.slice(0, 32);
      const dismissKey = `${BANNER_KEY_PREFIX}${version}`;
      try {
        localStorage.setItem(dismissKey, "1");
        Object.keys(localStorage)
          .filter(k => k.startsWith(BANNER_KEY_PREFIX) && k !== dismissKey)
          .forEach(k => localStorage.removeItem(k));
      } catch {}
    }
  };

  if (!isVisible) return null;

  // Hari raya liturgi
  if (holidayBanner) {
    return (
      <div className="w-full text-sm" style={{ backgroundColor: holidayBanner.bg, color: holidayBanner.fg }}>
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="h-3.5 w-3.5 shrink-0 opacity-80" />
            <span className="font-medium truncate">{holidayBanner.text}</span>
          </div>
          <button onClick={dismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-0.5" aria-label="Tutup"
            style={{ color: holidayBanner.fg }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Pengumuman biasa dari Firestore
  if (!announcement?.text) return null;
  return (
    <div className="w-full text-white text-sm" style={{ backgroundColor: "var(--brand)" }}>
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Megaphone className="h-3.5 w-3.5 shrink-0 opacity-80" />
          {announcement.link ? (
            <Link href={announcement.link} className="font-medium truncate hover:underline">
              {announcement.text}
            </Link>
          ) : (
            <span className="font-medium truncate">{announcement.text}</span>
          )}
        </div>
        <button onClick={dismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-0.5" aria-label="Tutup">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}