"use client";

import React, { useState, useCallback } from "react";
import { BookOpen, ChevronDown, ChevronUp, Loader2, Check } from "lucide-react";
import { parseReference } from "@/lib/bible-books";
import { useI18n } from "@/lib/hooks/useI18n";

interface VerseRow { number: string; text: string; }

interface Props {
  reading:   { reference: string; title?: string };
  index:     number;
  /** Optional — if true, shows a "sudah dibaca" badge once expanded */
  trackRead?: boolean;
}

export function ReadingCollapse({ reading, index, trackRead = false }: Props) {
  const [open,    setOpen]    = useState(false);
  const [verses,  setVerses]  = useState<VerseRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);
  const [read,    setRead]    = useState(false);
  const { lang }              = useI18n();

  const fetchVerses = useCallback(async () => {
    if (verses !== null || loading) return;
    const parsed = parseReference(reading.reference);
    if (!parsed) { setVerses([]); return; }
    setLoading(true); setError(false);
    try {
      const res  = await fetch(
        `/api/bible?book=${parsed.book.slug}&chapter=${parsed.chapter}&from=${parsed.verseFrom}&to=${parsed.verseTo}&lang=${lang}`
      );
      const json = await res.json();
      setVerses(res.ok && Array.isArray(json.verses)
        ? json.verses.map((v: any) => ({ number: String(v.verse), text: v.text }))
        : []
      );
    } catch {
      setError(true);
      setVerses([]);
    }
    setLoading(false);
  }, [reading.reference, verses, loading]);

  const toggle = () => {
    if (!open) {
      fetchVerses();
      if (trackRead) setRead(true);
    }
    setOpen((o) => !o);
  };

  return (
    <div className="border-b border-border last:border-0">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors text-left"
      >
        <span
          className="text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: "var(--gold)" }}
        >
          {index + 1}
        </span>
        <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif font-semibold text-sm leading-tight" style={{ color: "var(--brand)" }}>
              {reading.reference}
            </span>
            {trackRead && read && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Check className="h-2.5 w-2.5" /> Dibaca
              </span>
            )}
          </div>
          {reading.title && (
            <span className="text-xs text-muted-foreground truncate">{reading.title}</span>
          )}
        </div>
        <span className="shrink-0 text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Verses panel */}
      {open && (
        <div className="px-5 pb-5 pt-1 bg-muted/20">
          {loading && (
            <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat ayat...
            </div>
          )}
          {error && (
            <p className="text-xs text-red-500 py-3">Gagal memuat ayat. Cek koneksi.</p>
          )}
          {!loading && !error && verses?.length === 0 && (
            <p className="text-xs text-muted-foreground py-3 italic">Ayat tidak ditemukan.</p>
          )}
          {!loading && verses && verses.length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              {verses.map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="text-xs font-bold min-w-[1.5rem] pt-0.5 shrink-0"
                    style={{ color: "var(--brand)" }}
                  >
                    {v.number}
                  </span>
                  <p className="text-foreground leading-relaxed text-sm flex-1">{v.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}