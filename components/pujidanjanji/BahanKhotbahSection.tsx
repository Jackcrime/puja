"use client";

import React, { useState, useEffect } from "react";
import { BookMarked, ChevronDown, ChevronUp, Loader2, Copy, Check, BookOpen } from "lucide-react";
import { useBahanKhotbah } from "@/lib/hooks/useSupabaseData";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { useI18n } from "@/lib/hooks/useI18n";
import type { BiblePassageResponse } from "@/app/api/bible/route";

export function BahanKhotbahSection({ date }: { date?: Date }) {
  const d = date ?? new Date();
  const { data, loading } = useBahanKhotbah(d);
  const { lang } = useI18n();
  const [open,     setOpen]     = useState(false);
  const [verses,   setVerses]   = useState<BiblePassageResponse | null>(null);
  const [fetching, setFetching] = useState(false);
  const [copied,   setCopied]   = useState(false);

  const [apiError, setApiError] = useState(false);

  // Reset state ketika data berubah (misal ganti minggu)
  useEffect(() => {
    setVerses(null);
    setOpen(false);
    setApiError(false);
  }, [data.bookSlug, data.chapter]);

  if (loading) return null;
  if (data.visible === false) return null;
  if (!data.bookSlug || !data.chapter || !data.verseFrom || !data.verseTo) return null;

  // Cek hari tampil berdasarkan visibleDays (utama) — fallback ke legacy date range
  const dayOfWeek     = d.getDay();
  const effectiveDays = data.visibleDays;
  if (effectiveDays && effectiveDays.length > 0) {
    // Admin sudah set → ikuti setting
    if (!effectiveDays.includes(dayOfWeek)) return null;
  } else {
    // Legacy fallback: visibleFrom/visibleUntil date range
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (data.visibleFrom  && todayStr < data.visibleFrom)  return null;
    if (data.visibleUntil && todayStr > data.visibleUntil) return null;
  }

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (!next || verses || fetching) return;

    setFetching(true);
    setApiError(false);
    try {
      const ch  = Number(data.chapter)   || 1;
      const frm = Number(data.verseFrom) || 1;
      const to  = Number(data.verseTo)   || frm;
      const url = `/api/bible?book=${data.bookSlug}&chapter=${ch}&from=${frm}&to=${to}&lang=${lang}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || json.error || !Array.isArray(json.verses)) {
        setApiError(true);
        return;
      }

      // Strip HTML tags dari teks ayat (beberapa sumber punya tags)
      const clean: BiblePassageResponse = {
        ...json,
        verses: (json.verses as { verse: number; text: string }[]).map((v) => ({
          verse: v.verse,
          text:  String(v.text ?? "").replace(/<[^>]+>/g, "").trim(),
        })),
      };
      setVerses(clean.verses.length > 0 ? clean : null);
      if (clean.verses.length === 0) setApiError(true);
    } catch {
      setApiError(true);
    } finally {
      setFetching(false);
    }
  };

  const handleCopy = () => {
    const text = verses
      ? verses.verses.map((v) => `${data.chapter}:${v.verse} ${v.text}`).join("\n")
      : data.reference;
    navigator.clipboard?.writeText(`${data.reference}\n${text}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mb-8">
      <SectionDivider label="Bahan Khotbah" color="brand" />

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Top accent bar — brand color */}
        <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />

        {/* Header — always visible, acts as toggle */}
        <button
          onClick={handleOpen}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 p-1.5 rounded-lg shrink-0"
              style={{ backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)" }}
            >
              <BookMarked className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
                style={{ color: "var(--gold)" }}>
                Bahan Khotbah Minggu
              </p>
              <p className="font-serif font-bold text-base leading-snug"
                style={{ color: "var(--brand)" }}>
                {data.reference}
              </p>
              {!open && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Ketuk untuk membaca teks
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 ml-3">
            {open
              ? <ChevronUp  className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Expanded content */}
        {open && (
          <div className="border-t border-border">
            {fetching ? (
              <div className="flex items-center gap-2.5 px-5 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: "var(--brand)" }} />
                Memuat teks ayat...
              </div>
            ) : verses && verses.verses.length > 0 ? (
              <div className="px-5 pt-4 pb-2">
                {/* Verse header badge */}
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
                    {data.reference}
                  </span>
                </div>

                {/* Verses */}
                <div className="space-y-2.5">
                  {verses.verses.map((v) => (
                    <div key={v.verse} className="flex items-start gap-3">
                      <span
                        className="text-[11px] font-bold min-w-[2rem] pt-0.5 shrink-0 select-none"
                        style={{ color: "var(--brand)", opacity: 0.65 }}
                      >
                        {data.chapter}:{v.verse}
                      </span>
                      <p className="text-sm leading-relaxed text-foreground">{v.text}</p>
                    </div>
                  ))}
                </div>

                {/* Copy footer */}
                <div className="flex justify-end pt-3 mt-3 border-t border-border">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied
                      ? <><Check className="h-3.5 w-3.5 text-green-600" /> Tersalin!</>
                      : <><Copy  className="h-3.5 w-3.5" /> Salin teks</>}
                  </button>
                </div>
              </div>
            ) : (
              /* Fallback — API gagal atau tidak tersedia */
              <div className="px-5 py-4 space-y-3">
                <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                  {data.reference}
                </p>
                {apiError && (
                  <p className="text-xs text-muted-foreground">
                    Teks ayat tidak dapat dimuat. Baca langsung di:
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://alkitab.sabda.org/passage/?passage=${encodeURIComponent(data.reference)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors"
                    style={{ color: "var(--brand)" }}
                  >
                    <BookOpen className="h-3 w-3" />
                    Baca di SABDA
                  </a>
                  <a
                    href={`https://www.bible.com/id/bible/306/${data.bookSlug?.toUpperCase()}.${data.chapter}.TB`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <BookOpen className="h-3 w-3" />
                    Baca di Bible.com
                  </a>
                </div>
                <div className="flex justify-end pt-2 border-t border-border">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied
                      ? <><Check className="h-3.5 w-3.5 text-green-600" /> Tersalin!</>
                      : <><Copy  className="h-3.5 w-3.5" /> Salin referensi</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}