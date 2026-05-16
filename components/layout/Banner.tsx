"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Megaphone, Bell } from "lucide-react";
import { useAnnouncement } from "@/lib/hooks/useFirestoreData";
import { getLiturgicalEvents } from "@/lib/utils/liturgicalCalendar";

const BANNER_KEY = "gkpb_banner_v2";

export function Banner() {
  const [isVisible,    setIsVisible]    = useState(false);
  const [holidayBanner, setHolidayBanner] = useState<{ text: string; color: string } | null>(null);
  const { data: announcement } = useAnnouncement();

  useEffect(() => {
    // Cek hari raya liturgi hari ini — selalu tampil meski sudah di-dismiss
    const today = new Date();
    const events = getLiturgicalEvents(today);
    if (events.length > 0) {
      const ev = events[0];
      setHolidayBanner({ text: `${ev.emoji} ${ev.name} — ${ev.greeting}`, color: ev.color });
      setIsVisible(true);
      return;
    }

    // Tidak ada hari raya — cek dismissed state biasa
    try {
      const dismissed = localStorage.getItem(BANNER_KEY);
      if (!dismissed) setIsVisible(true);
    } catch {}
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    if (!holidayBanner) {
      try { localStorage.setItem(BANNER_KEY, "1"); } catch {}
    }
  };

  if (!isVisible) return null;

  // Hari raya: tampil dengan warna liturgi (overrides pengumuman biasa)
  if (holidayBanner) {
    return (
      <div className="w-full text-white text-sm" style={{ backgroundColor: holidayBanner.color }}>
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="h-3.5 w-3.5 shrink-0 opacity-80" />
            <span className="font-medium truncate">{holidayBanner.text}</span>
          </div>
          <button onClick={dismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-0.5" aria-label="Tutup">
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
