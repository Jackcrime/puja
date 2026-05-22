"use client";

import React, { useState, useRef, useEffect } from "react";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { getVerseCount } from "@/lib/bible-verse-counts";
import { Loader2, Eye, BookOpen, AlertCircle, Search, X, ChevronDown, Layers } from "lucide-react";
import type { BiblePassageResponse } from "@/app/api/bible/route";

// verseFrom=0 & verseTo=0 → full pasal (tidak spesifik ayat)
export interface VerseSelection {
  bookSlug:  string;
  bookName:  string;
  chapter:   number;
  verseFrom: number;   // 0 = full pasal
  verseTo:   number;   // 0 = full pasal
}

interface BibleVerseSelectorProps {
  value:        VerseSelection;
  onChange:     (val: VerseSelection) => void;
  onPreview?:   (data: BiblePassageResponse | null) => void;
  showPreview?: boolean;
  compact?:     boolean;
  lockedBook?:  string;
}

export function emptySelection(): VerseSelection {
  return { bookSlug: "", bookName: "", chapter: 1, verseFrom: 0, verseTo: 0 };
}

/** Label referensi: "Ulangan 14" (full) atau "Ulangan 14:28–29" (spesifik) */
export function refLabel(sel: VerseSelection): string {
  if (!sel.bookSlug) return "—";
  if (!sel.verseFrom || !sel.verseTo) return `${sel.bookName} ${sel.chapter}`;
  if (sel.verseFrom === sel.verseTo) return `${sel.bookName} ${sel.chapter}:${sel.verseFrom}`;
  return `${sel.bookName} ${sel.chapter}:${sel.verseFrom}–${sel.verseTo}`;
}

/** Hitung verseFrom/To efektif untuk fetch (0 → full pasal) */
export function effectiveVerses(sel: VerseSelection): { from: number; to: number } {
  if (!sel.bookSlug) return { from: 1, to: 1 };
  const max = getVerseCount(sel.bookSlug, sel.chapter);
  return {
    from: sel.verseFrom || 1,
    to:   sel.verseTo   || max,
  };
}

export function BibleVerseSelector({
  value, onChange, onPreview, showPreview = true, compact = false, lockedBook,
}: BibleVerseSelectorProps) {
  const [preview,    setPreview]   = useState<BiblePassageResponse | null>(null);
  const [loading,    setLoading]   = useState(false);
  const [preErr,     setPreErr]    = useState("");
  const [noKey,      setNoKey]     = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [bookOpen,   setBookOpen]   = useState(false);

  // Toggle mode: false = full pasal, true = pilih ayat spesifik
  const specificVerse = !!(value.verseFrom && value.verseTo);
  const setSpecificVerse = (on: boolean) => {
    if (on) {
      onChange({ ...value, verseFrom: 1, verseTo: 1 });
    } else {
      onChange({ ...value, verseFrom: 0, verseTo: 0 });
      setPreview(null); onPreview?.(null);
    }
  };

  const bookPanelRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  // Lock book
  useEffect(() => {
    if (lockedBook && value.bookSlug !== lockedBook) {
      const book = BIBLE_BOOKS.find((b) => b.slug === lockedBook);
      if (book) onChange({ bookSlug: book.slug, bookName: book.name, chapter: value.chapter || 1, verseFrom: 0, verseTo: 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedBook, value.bookSlug]);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (bookPanelRef.current && !bookPanelRef.current.contains(e.target as Node))
        setBookOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (bookOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [bookOpen]);

  const PLbooks = BIBLE_BOOKS.filter((b) => b.testament === "PL");
  const PBbooks = BIBLE_BOOKS.filter((b) => b.testament === "PB");

  const filterBooks = (books: typeof BIBLE_BOOKS) => {
    const q = bookSearch.toLowerCase().trim();
    return q ? books.filter((b) => b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q)) : books;
  };

  const filteredPL = filterBooks(PLbooks);
  const filteredPB = filterBooks(PBbooks);

  const selectedBook = BIBLE_BOOKS.find((b) => b.slug === value.bookSlug);
  const chapterMax   = selectedBook?.chapters ?? 1;
  const verseMax     = value.bookSlug && value.chapter ? getVerseCount(value.bookSlug, value.chapter) : 50;

  const chapterOptions   = Array.from({ length: chapterMax }, (_, i) => i + 1);
  const verseFromOptions = Array.from({ length: verseMax }, (_, i) => i + 1);
  const verseToOptions   = Array.from(
    { length: verseMax - (value.verseFrom || 1) + 1 },
    (_, i) => i + (value.verseFrom || 1)
  );

  const handleBookSelect = (slug: string) => {
    const book = BIBLE_BOOKS.find((b) => b.slug === slug);
    onChange({ bookSlug: slug, bookName: book?.name ?? "", chapter: 1, verseFrom: 0, verseTo: 0 });
    setPreview(null); onPreview?.(null); setPreErr("");
    setBookOpen(false); setBookSearch("");
  };

  const handleChapterChange = (val: number) => {
    onChange({ ...value, chapter: val, verseFrom: specificVerse ? 1 : 0, verseTo: specificVerse ? 1 : 0 });
    setPreview(null); onPreview?.(null);
  };

  const handleVerseFromChange = (raw: number) => {
    const verseTo = Math.max(raw, Math.min(verseMax, value.verseTo || raw));
    onChange({ ...value, verseFrom: raw, verseTo });
  };

  const handleVerseToChange = (raw: number) => {
    onChange({ ...value, verseTo: raw });
  };

  const handlePreview = async () => {
    if (!value.bookSlug) return;
    const { from, to } = effectiveVerses(value);
    setLoading(true); setPreErr(""); setPreview(null); setNoKey(false);
    try {
      const res  = await fetch(`/api/bible?book=${value.bookSlug}&chapter=${value.chapter}&from=${from}&to=${to}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        if (res.status === 503) setNoKey(true);
        setPreErr(json.error ?? "Gagal memuat."); return;
      }
      setPreview(json); onPreview?.(json);
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

      {/* ── Pilih Kitab ── */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
          Kitab
        </label>

        {lockedBook ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
            <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
              {BIBLE_BOOKS.find((b) => b.slug === lockedBook)?.name ?? lockedBook}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand/10 text-muted-foreground font-bold uppercase tracking-wider ml-auto">Fixed</span>
          </div>
        ) : (
          <div ref={bookPanelRef}>
            <button
              type="button"
              onClick={() => setBookOpen((o) => !o)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm border rounded-xl bg-background transition-colors hover:bg-muted/40 focus:outline-none"
              style={{ borderColor: bookOpen ? "var(--brand-border)" : "var(--border, #e5e7eb)" }}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)", opacity: value.bookSlug ? 1 : 0.5 }} />
              <span className="flex-1 text-left font-medium">
                {value.bookSlug
                  ? <><span style={{ color: "var(--brand)" }}>{selectedBook?.name}</span><span className="text-xs ml-1.5 opacity-50">{selectedBook?.testament}</span></>
                  : <span className="text-muted-foreground">— Pilih kitab —</span>}
              </span>
              {value.bookSlug && !bookOpen && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  style={{ background: "var(--brand-muted)", color: "var(--brand)" }}>
                  {selectedBook?.abbr}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform text-muted-foreground"
                style={{ transform: bookOpen ? "rotate(180deg)" : "none" }} />
            </button>

            {bookOpen && (
              <div className="mt-1.5 rounded-2xl border border-border bg-background overflow-hidden"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <div className="p-2 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border bg-background">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input ref={searchRef} type="text" placeholder="Cari kitab..."
                      value={bookSearch} onChange={(e) => setBookSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/60" />
                    {bookSearch && (
                      <button type="button" onClick={() => setBookSearch("")}>
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto p-2 space-y-2">
                  {filteredPL.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Perjanjian Lama</p>
                      <div className="grid grid-cols-2 gap-0.5">
                        {filteredPL.map((b) => (
                          <button key={b.slug} type="button" onClick={() => handleBookSelect(b.slug)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors hover:bg-muted/60"
                            style={{ background: value.bookSlug === b.slug ? "var(--brand-muted)" : "", color: value.bookSlug === b.slug ? "var(--brand)" : "", fontWeight: value.bookSlug === b.slug ? 600 : 400 }}>
                            <span className="text-[10px] font-bold opacity-50 w-7 shrink-0">{b.abbr}</span>
                            <span className="truncate">{b.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredPB.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Perjanjian Baru</p>
                      <div className="grid grid-cols-2 gap-0.5">
                        {filteredPB.map((b) => (
                          <button key={b.slug} type="button" onClick={() => handleBookSelect(b.slug)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors hover:bg-muted/60"
                            style={{ background: value.bookSlug === b.slug ? "var(--brand-muted)" : "", color: value.bookSlug === b.slug ? "var(--brand)" : "", fontWeight: value.bookSlug === b.slug ? 600 : 400 }}>
                            <span className="text-[10px] font-bold opacity-50 w-7 shrink-0">{b.abbr}</span>
                            <span className="truncate">{b.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredPL.length === 0 && filteredPB.length === 0 && (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      Kitab &quot;<span className="font-medium">{bookSearch}</span>&quot; tidak ditemukan.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pasal ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Pasal
          </label>
          <div className="relative">
            <select value={value.chapter} disabled={!value.bookSlug}
              onChange={(e) => handleChapterChange(Number(e.target.value))}
              className="w-full appearance-none px-3 py-2.5 pr-7 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50 cursor-pointer">
              {chapterOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              {!value.bookSlug && <option value={1}>1</option>}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          {selectedBook && <p className="text-[10px] text-muted-foreground mt-1">1 – {chapterMax} pasal</p>}
        </div>

        {/* Toggle ayat spesifik */}
        <div className="flex flex-col justify-end pb-0.5">
          <button
            type="button"
            disabled={!value.bookSlug}
            onClick={() => setSpecificVerse(!specificVerse)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-40"
            style={specificVerse
              ? { background: "var(--brand-muted)", borderColor: "var(--brand-border)", color: "var(--brand)" }
              : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{specificVerse ? "Ayat spesifik ✓" : "Semua ayat"}</span>
          </button>
          {selectedBook && !specificVerse && (
            <p className="text-[10px] text-muted-foreground mt-1">{verseMax} ayat dalam pasal ini</p>
          )}
        </div>
      </div>

      {/* ── Ayat mulai & selesai (opsional, muncul saat toggle aktif) ── */}
      {specificVerse && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Ayat mulai
            </label>
            <div className="relative">
              <select value={value.verseFrom || 1} disabled={!value.bookSlug}
                onChange={(e) => handleVerseFromChange(Number(e.target.value))}
                className="w-full appearance-none px-3 py-2.5 pr-7 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50 cursor-pointer">
                {verseFromOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Ayat selesai
            </label>
            <div className="relative">
              <select value={value.verseTo || 1} disabled={!value.bookSlug}
                onChange={(e) => handleVerseToChange(Number(e.target.value))}
                className="w-full appearance-none px-3 py-2.5 pr-7 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50 cursor-pointer">
                {verseToOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          {selectedBook && (
            <p className="col-span-2 text-[10px] text-muted-foreground -mt-1">
              Pasal ini memiliki {verseMax} ayat · ayat selesai ≥ ayat mulai
            </p>
          )}
        </div>
      )}

      {/* Referensi badge */}
      {value.bookSlug && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border"
          style={{ background: "var(--brand-muted)", borderColor: "var(--brand-border)" }}>
          <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>{ref}</span>
          {!specificVerse && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider opacity-60"
              style={{ color: "var(--brand)" }}>Full Pasal</span>
          )}
        </div>
      )}

      {/* Preview button */}
      {showPreview && value.bookSlug && (
        <div>
          <button onClick={handlePreview} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
            style={{ borderColor: "var(--brand-border)", color: "var(--brand)" }}>
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
                <span className="text-xs font-semibold mr-1.5 select-none"
                  style={{ color: "var(--brand)", opacity: 0.7 }}>
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