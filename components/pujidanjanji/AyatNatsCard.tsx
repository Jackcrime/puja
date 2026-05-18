"use client";

import React, { useState } from "react";
import { Flame, Copy, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { useAyatNats } from "@/lib/hooks/useFirestoreData";
import { parseReference } from "@/lib/bible-books";
import { PerikopModal } from "@/components/ui/PerikopModal";

export function AyatNatsCard() {
  const { data, loading } = useAyatNats();
  const [copied,    setCopied]    = useState(false);
  const [index,     setIndex]     = useState(0);
  const [expanded,  setExpanded]  = useState(true);
  const [perikopOpen, setPerikopOpen] = useState(false);

  if (loading) return null;

  const items    = data.items ?? [];
  if (items.length === 0) return null;

  const item     = items[index];
  const hasMulti = items.length > 1;

  // Resolve verse location — prefer stored fields, fall back to parsing reference
  const parsed = (() => {
    if (item.bookSlug && item.chapter && item.verseFrom) {
      return {
        book: { slug: item.bookSlug, name: item.bookName ?? item.bookSlug },
        chapter:   item.chapter,
        verseFrom: item.verseFrom,
        verseTo:   item.verseTo ?? item.verseFrom,
      };
    }
    return parseReference(item.reference);
  })();

  const prev = () => { setIndex((i) => (i - 1 + items.length) % items.length); setPerikopOpen(false); };
  const next = () => { setIndex((i) => (i + 1) % items.length); setPerikopOpen(false); };

  const copy = () => {
    navigator.clipboard?.writeText(`${item.reference}\n"${item.text}"`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-muted) 100%)" }}
      >
        {/* ── Header / Collapsed row ── */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-5 pt-4 pb-3 text-left transition-all hover:opacity-90"
        >
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-white/80 shrink-0" />
            <p className="text-xs font-bold tracking-widest uppercase text-white/80">Ayat Nats</p>
            {hasMulti && (
              <span className="text-[10px] font-semibold text-white/50 tabular-nums ml-1">
                {index + 1}/{items.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Reference always visible */}
            <p className="font-serif font-bold text-white/90 text-sm">{item.reference}</p>

            {/* Multi nav when collapsed */}
            {hasMulti && !expanded && (
              <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button onClick={prev} className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button onClick={next} className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Expand/collapse chevron */}
            <span className="text-white/60">
              {expanded
                ? <ChevronUp   className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />}
            </span>
          </div>
        </button>

        {/* ── Expanded body ── */}
        {expanded && (
          <div className="px-5 pb-5">
            {/* Verse text */}
            <p className="font-serif text-white leading-relaxed italic text-base mb-4">
              &ldquo;{item.text}&rdquo;
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2">
              <p className="font-serif font-bold text-white/90 text-sm">{item.reference}</p>

              <div className="flex items-center gap-1">
                {hasMulti && (
                  <>
                    <button onClick={prev} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" aria-label="Ayat sebelumnya">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={next} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" aria-label="Ayat berikutnya">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button onClick={copy} className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors ml-1">
                  {copied ? <><Check className="h-3.5 w-3.5" /> Tersalin!</> : <><Copy className="h-3.5 w-3.5" /> Salin</>}
                </button>
              </div>
            </div>

            {/* Perikop button */}
            {parsed && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <button
                  onClick={() => setPerikopOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/10"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Baca Perikop (TB)
                </button>
              </div>
            )}

            {/* Dot indicators */}
            {hasMulti && (
              <div className="flex justify-center gap-1.5 mt-3">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className="rounded-full transition-all"
                    style={{
                      width:           i === index ? "1.25rem" : "0.375rem",
                      height:          "0.375rem",
                      backgroundColor: i === index ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                    }}
                    aria-label={`Ayat ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Perikop Modal */}
      {parsed && (
        <PerikopModal
          open={perikopOpen}
          onOpenChange={setPerikopOpen}
          bookSlug={parsed.book.slug}
          bookName={parsed.book.name}
          chapter={parsed.chapter}
          verseFrom={parsed.verseFrom}
          verseTo={parsed.verseTo}
        />
      )}
    </>
  );
}