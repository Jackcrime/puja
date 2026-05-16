"use client";

import React, { useState } from "react";
import { BookMarked, ChevronDown, ChevronUp } from "lucide-react";
import { useBahanKhotbah } from "@/lib/hooks/useFirestoreData";
import { SectionDivider } from "@/components/shared/SectionDivider";

export function BahanKhotbahSection({ date }: { date?: Date }) {
  const { data, loading } = useBahanKhotbah(date);
  const [open, setOpen] = useState(false);

  if (loading) return null;
  if (!data.reference || !data.title) return null;

  return (
    <section className="mb-8">
      <SectionDivider label="Bahan Khotbah" />
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Accent */}
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />

      {/* Collapsible trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start gap-3 text-left">
          <BookMarked className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: "var(--gold)" }}>
              Bahan Khotbah
            </p>
            <p className="font-serif font-semibold text-sm" style={{ color: "var(--brand)" }}>
              {data.reference} — {data.title}
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border bg-muted/10 space-y-4">
          {/* Thema */}
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--gold)" }}>
              Tema
            </p>
            <p className="font-serif font-semibold" style={{ color: "var(--brand)" }}>{data.thema}</p>
          </div>

          {/* Pendahuluan */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--gold)" }}>
              Pendahuluan
            </p>
            <p className="text-sm text-foreground leading-relaxed">{data.pendahuluan}</p>
          </div>

          {/* Poin Utama */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--gold)" }}>
              Poin Utama
            </p>
            <div className="space-y-3">
              {data.poinUtama.map((p, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                    style={{ backgroundColor: "var(--brand)" }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--brand)" }}>{p.judul}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.isi}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Penutup */}
          <div className="pt-1 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--gold)" }}>
              Penutup
            </p>
            <p className="text-sm text-foreground leading-relaxed italic">{data.penutup}</p>
          </div>
        </div>
      )}
    </div>
    </section>
  );
}