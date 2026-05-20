"use client";

import React, { useState, useRef, useEffect } from "react";
import { BIBLE_BOOKS, formatRef } from "@/lib/bible-books";
import { getVerseCount } from "@/lib/bible-verse-counts";
import { Loader2, Eye, BookOpen, AlertCircle, Search, X, ChevronDown } from "lucide-react";
import type { BiblePassageResponse } from "@/app/api/bible/route";

export interface VerseSelection {
  bookSlug:  string;
  bookName:  string;
  chapter:   number;
  verseFrom: number;
  verseTo:   number;
}

interface BibleVerseSelectorProps {
  value:       VerseSelection;
  onChange:    (val: VerseSelection) => void;
  onPreview?:  (data: BiblePassageResponse | null) => void;
  showPreview?: boolean;
  compact?:    boolean;
  lockedBook?: string;
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
  value, onChange, onPreview, showPreview = true, compact = false, lockedBook,
}: BibleVerseSelectorProps) {
  const [preview,     setPreview]   = useState<BiblePassageResponse | null>(null);
  const [loading,     setLoading]   = useState(false);
  const [preErr,      setPreErr]    = useState("");
  const [noKey,       setNoKey]     = useState(false);
  const [bookSearch,  setBookSearch] = useState("");
  const [bookOpen,    setBookOpen]   = useState(false);
  const bookPanelRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  // Lock book
  useEffect(() => {
    if (lockedBook && value.bookSlug !== lockedBook) {
      const book = BIBLE_BOOKS.find((b) => b.slug === lockedBook);
      if (book) onChange({ bookSlug: book.slug, bookName: book.name, chapter: value.chapter || 1, verseFrom: value.verseFrom || 1, verseTo: value.verseTo || 1 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedBook, value.bookSlug]);

  // Close book panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bookPanelRef.current && !bookPanelRef.current.contains(e.target as Node)) {
        setBookOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when panel opens
  useEffect(() => {
    if (bookOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [bookOpen]);

  const PLbooks = BIBLE_BOOKS.filter((b) => b.testament === "PL");
  const PBbooks = BIBLE_BOOKS.filter((b) => b.testament === "PB");

  const filterBooks = (books: typeof BIBLE_BOOKS) => {
    const q = bookSearch.toLowerCase().trim();
    if (!q) return books;
    return books.filter((b) =>
      b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q)
    );
  };

  const filteredPL = filterBooks(PLbooks);
  const filteredPB = filterBooks(PBbooks);

  const selectedBook = BIBLE_BOOKS.find((b) => b.slug === value.bookSlug);
  const chapterMax   = selectedBook?.chapters ?? 1;

  const verseMax = value.bookSlug && value.chapter
    ? getVerseCount(value.bookSlug, value.chapter)
    : 50;

  const chapterOptions = Array.from({ length: chapterMax }, (_, i) => i + 1);
  const verseFromOptions = Array.from({ length: verseMax }, (_, i) => i + 1);
  const verseToOptions   = Array.from(
    { length: verseMax - value.verseFrom + 1 },
    (_, i) => i + value.verseFrom
  );

  const handleBookSelect = (slug: string) => {
    const book = BIBLE_BOOKS.find((b) => b.slug === slug);
    onChange({ bookSlug: slug, bookName: book?.name ?? "", chapter: 1, verseFrom: 1, verseTo: 1 });
    setPreview(null);
    onPreview?.(null);
    setPreErr("");
    setBookOpen(false);
    setBookSearch("");
  };

  const handleChapterChange = (val: number) => {
    const vMax = getVerseCount(value.bookSlug, val);
    onChange({ ...value, chapter: val, verseFrom: 1, verseTo: Math.min(1, vMax) });
    setPreview(null); onPreview?.(null);
  };

  const handleVerseFromChange = (raw: number) => {
    const verseFrom = raw;
    const verseTo   = Math.max(verseFrom, Math.min(verseMax, value.verseTo));
    onChange({ ...value, verseFrom, verseTo });
  };

  const handleVerseToChange = (raw: number) => {
    onChange({ ...value, verseTo: raw });
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

      {/* ── Pilih Kitab ── */}
      <div>
        <label
          className="text-xs font-bold uppercase tracking-wider block mb-1.5"
          style={{ color: "var(--gold)" }}
        >
          Kitab
        </label>

        {lockedBook ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
            <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
              {BIBLE_BOOKS.find((b) => b.slug === lockedBook)?.name ?? lockedBook}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand/10 text-muted-foreground font-bold uppercase tracking-wider ml-auto">
              Fixed
            </span>
          </div>
        ) : (
          <div className="relative" ref={bookPanelRef}>
            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setBookOpen((o) => !o)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm border rounded-xl bg-background transition-colors hover:bg-muted/40 focus:outline-none"
              style={{
                borderColor: bookOpen ? "var(--brand-border)" : "var(--border, #e5e7eb)",
                color: value.bookSlug ? "var(--foreground)" : "var(--muted-foreground)",
              }}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)", opacity: value.bookSlug ? 1 : 0.5 }} />
              <span className="flex-1 text-left font-medium">
                {value.bookSlug
                  ? <>
                      <span style={{ color: "var(--brand)" }}>{selectedBook?.name}</span>
                      <span className="text-xs ml-1.5 opacity-50">{selectedBook?.testament}</span>
                    </>
                  : "— Pilih kitab —"}
              </span>
              {value.bookSlug && !bookOpen && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  style={{ background: "var(--brand-muted)", color: "var(--brand)" }}
                >
                  {selectedBook?.abbr}
                </span>
              )}
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0 transition-transform"
                style={{ color: "var(--muted-foreground)", transform: bookOpen ? "rotate(180deg)" : "none" }}
              />
            </button>

            {/* Dropdown panel */}
            {bookOpen && (
              <div
                className="absolute z-50 top-full mt-1.5 left-0 right-0 rounded-2xl border border-border bg-background shadow-xl overflow-hidden"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
              >
                {/* Search bar */}
                <div className="p-2 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border bg-background focus-within:border-brand"
                    style={{ transition: "border-color 0.15s" }}>
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Cari kitab..."
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/60"
                    />
                    {bookSearch && (
                      <button type="button" onClick={() => setBookSearch("")}>
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Book lists */}
                <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                  {filteredPL.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                        Perjanjian Lama
                      </p>
                      <div className="grid grid-cols-2 gap-0.5">
                        {filteredPL.map((b) => (
                          <button
                            key={b.slug}
                            type="button"
                            onClick={() => handleBookSelect(b.slug)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors hover:bg-muted/60"
                            style={{
                              background: value.bookSlug === b.slug ? "var(--brand-muted)" : "",
                              color: value.bookSlug === b.slug ? "var(--brand)" : "",
                              fontWeight: value.bookSlug === b.slug ? 600 : 400,
                            }}
                          >
                            <span className="text-[10px] font-bold opacity-50 w-7 shrink-0">{b.abbr}</span>
                            <span className="truncate">{b.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredPB.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                        Perjanjian Baru
                      </p>
                      <div className="grid grid-cols-2 gap-0.5">
                        {filteredPB.map((b) => (
                          <button
                            key={b.slug}
                            type="button"
                            onClick={() => handleBookSelect(b.slug)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors hover:bg-muted/60"
                            style={{
                              background: value.bookSlug === b.slug ? "var(--brand-muted)" : "",
                              color: value.bookSlug === b.slug ? "var(--brand)" : "",
                              fontWeight: value.bookSlug === b.slug ? 600 : 400,
                            }}
                          >
                            <span className="text-[10px] font-bold opacity-50 w-7 shrink-0">{b.abbr}</span>
                            <span className="truncate">{b.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredPL.length === 0 && filteredPB.length === 0 && (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      Kitab "<span className="font-medium">{bookSearch}</span>" tidak ditemukan.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pasal + Ayat selector ── */}
      <div className={`grid gap-3 grid-cols-3`}>
        {/* Pasal */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Pasal
          </label>
          <div className="relative">
            <select
              value={value.chapter}
              disabled={!value.bookSlug}
              onChange={(e) => handleChapterChange(Number(e.target.value))}
              className="w-full appearance-none px-3 py-2.5 pr-7 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50 cursor-pointer"
              style={{ borderColor: value.bookSlug ? "var(--border)" : undefined }}
            >
              {chapterOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              {!value.bookSlug && <option value={1}>1</option>}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          {selectedBook && (
            <p className="text-[10px] text-muted-foreground mt-1">1 – {chapterMax} pasal</p>
          )}
        </div>

        {/* Ayat mulai */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Ayat mulai
          </label>
          <div className="relative">
            <select
              value={value.verseFrom}
              disabled={!value.bookSlug}
              onChange={(e) => handleVerseFromChange(Number(e.target.value))}
              className="w-full appearance-none px-3 py-2.5 pr-7 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              {verseFromOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
              {!value.bookSlug && <option value={1}>1</option>}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          {selectedBook && (
            <p className="text-[10px] text-muted-foreground mt-1">1 – {verseMax} ayat</p>
          )}
        </div>

        {/* Ayat selesai */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Ayat selesai
          </label>
          <div className="relative">
            <select
              value={value.verseTo}
              disabled={!value.bookSlug}
              onChange={(e) => handleVerseToChange(Number(e.target.value))}
              className="w-full appearance-none px-3 py-2.5 pr-7 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              {verseToOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
              {!value.bookSlug && <option value={1}>1</option>}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          {selectedBook && (
            <p className="text-[10px] text-muted-foreground mt-1">≥ ayat mulai</p>
          )}
        </div>
      </div>

      {/* Referensi badge */}
      {value.bookSlug && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border"
          style={{ background: "var(--brand-muted)", borderColor: "var(--brand-border)" }}
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>{ref}</span>
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