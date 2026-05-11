"use client";

// ─── Perikop Modal ─────────────────────────────────────────────────────────────
// Menampilkan teks Alkitab penuh (TB) persis seperti di pujidanjanji.balichurchsynod.org
// Format ayat: "2:1 Lalu berdoalah Hana..." dengan nomor chapter:verse

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookOpen, X, Loader2, AlertCircle } from "lucide-react";
import { formatRef } from "@/lib/bible-books";
import type { BiblePassageResponse } from "@/app/api/bible/route";

interface PerikopModalProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  bookSlug:     string;   // untuk API: "1samuel"
  bookName:     string;   // untuk display: "1 Samuel"
  chapter:      number;
  verseFrom:    number;
  verseTo:      number;
  heading?:     string;   // judul perikop dari admin
}

export function PerikopModal({
  open, onOpenChange,
  bookSlug, bookName, chapter, verseFrom, verseTo, heading,
}: PerikopModalProps) {
  const [data,    setData]    = useState<BiblePassageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const ref = formatRef(bookName, chapter, verseFrom, verseTo);

  useEffect(() => {
    if (!open || !bookSlug) return;
    let cancelled = false;

    const fetch_ = async () => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const url = `/api/bible?book=${encodeURIComponent(bookSlug)}&chapter=${chapter}&from=${verseFrom}&to=${verseTo}`;
        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok || json.error) {
          setError(json.error ?? "Gagal memuat teks Alkitab.");
          return;
        }

        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Tidak dapat menghubungi server. Cek koneksi internet.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch_();
    return () => { cancelled = true; };
  }, [open, bookSlug, chapter, verseFrom, verseTo]);

  // Buat lookup heading per verse number
  const headingMap = new Map<number, string>();
  data?.headings.forEach((h) => headingMap.set(h.beforeVerse, h.text));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--brand)" }} />
            <div>
              <h2 className="font-bold text-base leading-tight" style={{ color: "var(--brand)" }}>
                {ref}
              </h2>
              {heading && (
                <p className="text-xs text-muted-foreground mt-0.5">{heading}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 ml-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Memuat teks Alkitab...</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-2 text-sm leading-relaxed">
              {data.verses.length === 0 ? (
                <p className="text-muted-foreground italic text-sm">Teks tidak tersedia.</p>
              ) : (
                data.verses.map((v) => {
                  const secHeading = headingMap.get(v.verse);
                  return (
                    <React.Fragment key={v.verse}>
                      {/* Section heading (perikop dalam pasal) */}
                      {secHeading && (
                        <p className="font-semibold text-sm pt-3 pb-1" style={{ color: "var(--brand)" }}>
                          {secHeading}
                        </p>
                      )}
                      {/* Verse text */}
                      <p className="text-foreground">
                        {/* Nomor ayat: chapter:verse dalam format italic ringan */}
                        <span
                          className="font-semibold text-xs mr-1.5 select-none"
                          style={{ color: "var(--brand)", opacity: 0.7 }}
                        >
                          {chapter}:{v.verse}
                        </span>
                        {v.text}
                      </p>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-border shrink-0 bg-muted/20">
          <p className="text-[10px] text-muted-foreground">
            Teks Alkitab Terjemahan Baru (TB) © Lembaga Alkitab Indonesia
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Trigger button (pakai di halaman user) ───────────────────────────────────
interface PerikopButtonProps extends Omit<PerikopModalProps, "open" | "onOpenChange"> {
  label?: string;
}

export function PerikopButton({ label = "Perikop (TB)", ...props }: PerikopButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-muted transition-colors"
        style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
      >
        <BookOpen className="h-3.5 w-3.5" />
        {label}
      </button>
      <PerikopModal open={open} onOpenChange={setOpen} {...props} />
    </>
  );
}