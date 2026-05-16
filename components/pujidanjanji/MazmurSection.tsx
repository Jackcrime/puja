"use client";

import React, { useState } from "react";
import { Music, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useMazmurMinggu } from "@/lib/hooks/useFirestoreData";
import { SectionDivider } from "@/components/shared/SectionDivider";

export function MazmurSection() {
  const { data, loading } = useMazmurMinggu();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied]     = useState(false);

  if (loading) return null;
  if (!data.reference || !data.verses || data.verses.length === 0) return null;

  const copy = () => {
    const all = data.verses.map((v) => `${v.number} ${v.text}`).join("\n");
    navigator.clipboard?.writeText(`${data.reference}\n${all}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = data.verses.slice(0, 2);
  const rest    = data.verses.slice(2);

  return (
    <section className="mb-8">
      <SectionDivider label="Mazmur Minggu" />
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header stripe */}
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--gold)" }} />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-1">
          <Music className="h-4 w-4" style={{ color: "var(--gold)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
            Mazmur Minggu
          </p>
        </div>
        <p className="font-serif font-bold text-base mb-4" style={{ color: "var(--brand)" }}>
          {data.reference} — {data.title}
        </p>

        {/* Verses */}
        <div className="flex flex-col gap-3">
          {preview.map((v) => (
            <div key={v.number} className="flex items-start gap-3">
              <span className="text-xs font-bold min-w-[2.5rem] pt-0.5 shrink-0" style={{ color: "var(--brand)" }}>
                {v.number.split(":")[1]}
              </span>
              <p className="text-sm text-foreground leading-relaxed">{v.text}</p>
            </div>
          ))}

          {expanded && rest.map((v) => (
            <div key={v.number} className="flex items-start gap-3">
              <span className="text-xs font-bold min-w-[2.5rem] pt-0.5 shrink-0" style={{ color: "var(--brand)" }}>
                {v.number.split(":")[1]}
              </span>
              <p className="text-sm text-foreground leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
          {rest.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: "var(--brand)" }}
            >
              {expanded
                ? <><ChevronUp className="h-3.5 w-3.5" /> Sembunyikan</>
                : <><ChevronDown className="h-3.5 w-3.5" /> Tampilkan semua ({data.verses.length} ayat)</>}
            </button>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            {copied
              ? <><Check className="h-3.5 w-3.5 text-green-600" /> Tersalin!</>
              : <><Copy className="h-3.5 w-3.5" /> Salin</>}
          </button>
        </div>
      </div>
    </div>
    </section>
  );
}
