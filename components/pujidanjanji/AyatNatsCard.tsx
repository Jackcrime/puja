"use client";

import React, { useState } from "react";
import { Flame, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useAyatNats } from "@/lib/hooks/useFirestoreData";

export function AyatNatsCard() {
  const { data, loading } = useAyatNats();
  const [copied, setCopied] = useState(false);
  const [index, setIndex]   = useState(0);

  if (loading) return null;

  const items    = data.items ?? [];
  if (items.length === 0) return null;

  const item     = items[index];
  const hasMulti = items.length > 1;

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  const copy = () => {
    navigator.clipboard?.writeText(`${item.reference}\n"${item.text}"`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-muted) 100%)" }}
    >
      <div className="p-5">
        {/* Label row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-white/80" />
            <p className="text-xs font-bold tracking-widest uppercase text-white/80">
              Ayat Nats
            </p>
          </div>
          {hasMulti && (
            <p className="text-[10px] font-semibold text-white/60 tabular-nums">
              {index + 1} / {items.length}
            </p>
          )}
        </div>

        {/* Verse text */}
        <p className="font-serif text-white leading-relaxed italic text-base mb-3">
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
    </div>
  );
}