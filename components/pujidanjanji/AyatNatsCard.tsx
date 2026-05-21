"use client";

import React, { useState } from "react";
import { Flame, Copy, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { useAyatNats } from "@/lib/hooks/useFirestoreData";
import { parseReference } from "@/lib/bible-books";
import { PerikopModal } from "@/components/ui/PerikopModal";

export function AyatNatsCard() {
  const { data, loading } = useAyatNats();
  const [copied, setCopied] = useState(false);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [perikopOpen, setPerikopOpen] = useState(false);

  if (loading) return null;

  const items = data.items ?? [];
  if (items.length === 0) return null;

  const item = items[index];
  const hasMulti = items.length > 1;

  // Resolve verse location — prefer stored fields, fall back to parsing reference
  const parsed = (() => {
    if (item.bookSlug && item.chapter && item.verseFrom) {
      return {
        book: { slug: item.bookSlug, name: item.bookName ?? item.bookSlug },
        chapter: item.chapter,
        verseFrom: item.verseFrom,
        verseTo: item.verseTo ?? item.verseFrom,
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
      <div className="bg-card border border-border rounded-xl overflow-hidden transition-all">
        {/* ── Garis Aksen atas seperti di Renungan ── */}
        <div className="h-1 w-full" style={{ backgroundColor: "var(--brand)" }} />

        {/* ── Header / Collapsed row ── */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-5 pt-4 pb-4 text-left transition-colors hover:bg-muted/30"
        >
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
              Ayat Nats
            </p>
            {hasMulti && (
              <span className="text-[10px] font-semibold text-muted-foreground tabular-nums ml-1">
                {index + 1}/{items.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Reference always visible */}
            <p className="font-serif font-bold text-sm" style={{ color: "var(--brand)" }}>
              {item.reference}
            </p>

            {/* Multi nav when collapsed */}
            {hasMulti && !expanded && (
              <div className="flex items-center gap-0.5 mr-1" onClick={(e) => e.stopPropagation()}>
                <div onClick={prev} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                <div onClick={next} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            )}

            {/* Expand/collapse chevron */}
            <span className="text-muted-foreground">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </div>
        </button>

        {/* ── Expanded body ── */}
        {expanded && (
          <div className="px-5 pb-5 animate-accordion-down">
            {/* Verse text */}
            <p className="font-serif text-foreground leading-relaxed italic text-lg mb-4 mt-1">
              &ldquo;{item.text}&rdquo;
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 mt-4">
              <div className="flex items-center gap-1">
                {hasMulti && (
                  <>
                    <button onClick={prev} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Ayat sebelumnya">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={next} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Ayat berikutnya">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              <button onClick={copy} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-1">
                {copied ? <><Check className="h-3.5 w-3.5 text-green-600" /> Tersalin!</> : <><Copy className="h-3.5 w-3.5" /> Salin</>}
              </button>
            </div>

            {/* Perikop button */}
            {parsed && (
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => setPerikopOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Baca Perikop (TB)
                </button>
              </div>
            )}

            {/* Dot indicators */}
            {hasMulti && (
              <div className="flex justify-center gap-1.5 mt-5">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === index ? "1.25rem" : "0.375rem",
                      height: "0.375rem",
                      backgroundColor: i === index ? "var(--brand)" : "var(--brand-muted)",
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