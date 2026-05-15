"use client";

import React, { useState } from "react";
import { Flame, Copy, Check } from "lucide-react";
import { useAyatNats } from "@/lib/hooks/useFirestoreData";

export function AyatNatsCard() {
  const { data, loading } = useAyatNats();
  const [copied, setCopied] = useState(false);

  if (loading) return null;

  const copy = () => {
    navigator.clipboard?.writeText(`${data.reference}\n"${data.text}"`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-muted) 100%)" }}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-white/80" />
          <p className="text-xs font-bold tracking-widest uppercase text-white/80">
            Ayat Nats
          </p>
        </div>
        <p className="font-serif text-white leading-relaxed italic text-base mb-3">
          &ldquo;{data.text}&rdquo;
        </p>
        <div className="flex items-center justify-between">
          <p className="font-serif font-bold text-white/90 text-sm">{data.reference}</p>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
          >
            {copied
              ? <><Check className="h-3.5 w-3.5" /> Tersalin!</>
              : <><Copy className="h-3.5 w-3.5" /> Salin</>}
          </button>
        </div>
      </div>
    </div>
  );
}
