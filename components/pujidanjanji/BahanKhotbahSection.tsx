"use client";

import React, { useState, useEffect } from "react";
import { BookMarked, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useBahanKhotbah } from "@/lib/hooks/useFirestoreData";
import { getLiturgicalEvents } from "@/lib/utils/liturgicalCalendar";
import { SectionDivider } from "@/components/shared/SectionDivider";
import type { BiblePassageResponse } from "@/app/api/bible/route";

export function BahanKhotbahSection({ date }: { date?: Date }) {
  const d = date ?? new Date();
  const { data, loading } = useBahanKhotbah(d);
  const [open,    setOpen]    = useState(false);
  const [verses,  setVerses]  = useState<BiblePassageResponse | null>(null);
  const [fetching, setFetching] = useState(false);

  const isSunday  = d.getDay() === 0;
  const isHoliday = getLiturgicalEvents(d).length > 0;
  if (!isSunday && !isHoliday) return null;

  if (loading) return null;
  if (!data.bookSlug) return null;

  // Fetch verses when opened
  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && !verses && !fetching) {
      setFetching(true);
      try {
        const url = `/api/bible?book=${data.bookSlug}&chapter=${data.chapter}&from=${data.verseFrom}&to=${data.verseTo}`;
        const res  = await fetch(url);
        if (res.ok) setVerses(await res.json());
      } catch { /* silent — show reference only */ }
      finally { setFetching(false); }
    }
  };

  return (
    <section className="mb-8">
      <SectionDivider label="Bahan Khotbah" />
      <div className="bg-card border border-border rounded-xl overflow-hidden">

        {/* Accent bar */}
        <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />

        {/* Header / toggle */}
        <button
          onClick={handleOpen}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-start gap-3 text-left">
            <BookMarked className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: "var(--gold)" }}>
                Bahan Khotbah
              </p>
              <p className="font-serif font-semibold text-sm" style={{ color: "var(--brand)" }}>
                {data.reference}
              </p>
            </div>
          </div>
          {open
            ? <ChevronUp  className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>

        {/* Expanded: verse text */}
        {open && (
          <div className="px-5 pb-5 border-t border-border bg-muted/10">
            {fetching ? (
              <div className="flex items-center gap-2 pt-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat teks ayat...
              </div>
            ) : verses ? (
              <div className="pt-4 space-y-2">
                {verses.verses.map((v) => (
                  <p key={v.verse} className="text-sm leading-relaxed">
                    <span
                      className="text-xs font-semibold mr-1.5 select-none"
                      style={{ color: "var(--brand)", opacity: 0.7 }}
                    >
                      {data.chapter}:{v.verse}
                    </span>
                    {v.text}
                  </p>
                ))}
              </div>
            ) : (
              /* Fallback if API unavailable */
              <p className="pt-4 text-sm text-muted-foreground italic">
                {data.reference}
              </p>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
