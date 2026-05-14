"use client";

import React, { useState } from "react";
import { BIBLE_BOOKS, formatRef } from "@/lib/bible-books";
import { Loader2, Eye, BookOpen, AlertCircle } from "lucide-react";
import type { BiblePassageResponse } from "@/app/api/bible/route";

export interface VerseSelection {
  bookSlug:  string;
  bookName:  string;
  chapter:   number;
  verseFrom: number;
  verseTo:   number;
}

interface BibleVerseSelectorProps {
  value:      VerseSelection;
  onChange:   (val: VerseSelection) => void;
  onPreview?: (data: BiblePassageResponse | null) => void;
  showPreview?: boolean;
  compact?: boolean;
}

const EMPTY_SEL: VerseSelection = {
  bookSlug: "", bookName: "", chapter: 1, verseFrom: 1, verseTo: 1,
};

export function emptySelection(): VerseSelection {
  return { ...EMPTY_SEL };
}

export function refLabel(sel: VerseSelection): string {
  if (!sel.bookSlug) return "—";
  return formatRef(sel.bookName, sel.chapter, sel.verseFrom, sel.verseTo);
}

export function BibleVerseSelector({
  value, onChange, onPreview, showPreview = true, compact = false,
}: BibleVerseSelectorProps) {
  const [preview, setPreview]   = useState<BiblePassageResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [preErr,  setPreErr]    = useState("");
  const [noKey,   setNoKey]     = useState(false);

  const PLbooks = BIBLE_BOOKS.filter((b) => b.testament === "PL");
  const PBbooks = BIBLE_BOOKS.filter((b) => b.testament === "PB");
  const selectedBook = BIBLE_BOOKS.find((b) => b.slug === value.bookSlug);
  const chapterMax   = selectedBook?.chapters ?? 1;

  const set = (key: keyof VerseSelection, val: any) =>
    onChange({ ...value, [key]: val });

  const handleBookChange = (slug: string) => {
    const book = BIBLE_BOOKS.find((b) => b.slug === slug);
    onChange({ bookSlug: slug, bookName: book?.name ?? "", chapter: 1, verseFrom: 1, verseTo: 1 });
    setPreview(null);
    onPreview?.(null);
    setPreErr("");
  };

  const handlePreview = async () => {
    if (!value.bookSlug) return;
    setLoading(true); setPreErr(""); setPreview(null); setNoKey(false);
    try {
      const url = `/api/bible?book=${value.bookSlug}&chapter=${value.chapter}&from=${value.verseFrom}&to=${value.verseTo}`;
      const res  = await fetch(url);
      const json = await res.json();
      if (!res.ok || json.error) {
        if (res.status === 503) setNoKey(true);
        setPreErr(json.error ?? "Gagal memuat.");
        return;
      }
      setPreview(json);
      onPreview?.(json);
    } catch { setPreErr("Tidak dapat menghubungi server."); }
    finally  { setLoading(false); }
  };

  const ref = refLabel(value);

  return (
    <div className="space-y-3">
      {/* No API Key warning */}
      {noKey && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <span className="font-semibold">LAI_BIBLE_API_KEY</span> belum di-set di{" "}
            <code>.env.local</code>. Preview tidak tersedia sementara.
          </p>
        </div>
      )}

      {/* Pilih kitab */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
          Kitab
        </label>
        <select
          value={value.bookSlug}
          onChange={(e) => handleBookChange(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
        >
          <option value="">— Pilih kitab —</option>
          <optgroup label="Perjanjian Lama">
            {PLbooks.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </optgroup>
          <optgroup label="Perjanjian Baru">
            {PBbooks.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </optgroup>
        </select>
      </div>

      {/* Pasal + Ayat */}
      <div className={`grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-3"}`}>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Pasal
          </label>
          <input
            type="number" min={1} max={chapterMax}
            value={value.chapter}
            onChange={(e) => set("chapter", Number(e.target.value))}
            disabled={!value.bookSlug}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50"
          />
          {selectedBook && <p className="text-[10px] text-muted-foreground mt-1">maks {chapterMax}</p>}
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Ayat mulai
          </label>
          <input
            type="number" min={1}
            value={value.verseFrom}
            onChange={(e) => set("verseFrom", Number(e.target.value))}
            disabled={!value.bookSlug}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Ayat selesai
          </label>
          <input
            type="number" min={value.verseFrom}
            value={value.verseTo}
            onChange={(e) => set("verseTo", Number(e.target.value))}
            disabled={!value.bookSlug}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Referensi badge */}
      {value.bookSlug && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border">
          <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--brand)" }}>{ref}</span>
        </div>
      )}

      {/* Preview button */}
      {showPreview && value.bookSlug && (
        <div>
          <button
            onClick={handlePreview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
            style={{ borderColor: "var(--brand-border)", color: "var(--brand)" }}
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat...</>
              : <><Eye className="h-3.5 w-3.5" /> Pratinjau Teks</>}
          </button>
          {preErr && !noKey && <p className="text-xs text-red-500 mt-2">{preErr}</p>}
        </div>
      )}

      {/* Preview teks */}
      {preview && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
            <p className="text-xs font-bold" style={{ color: "var(--brand)" }}>{ref}</p>
          </div>
          <div className="px-4 py-3 max-h-48 overflow-y-auto space-y-2">
            {preview.verses.map((v) => (
              <p key={v.verse} className="text-sm leading-relaxed">
                <span
                  className="text-xs font-semibold mr-1.5 select-none"
                  style={{ color: "var(--brand)", opacity: 0.7 }}
                >
                  {value.chapter}:{v.verse}
                </span>
                {v.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}