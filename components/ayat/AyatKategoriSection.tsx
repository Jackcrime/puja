"use client";

import React, { useState, useMemo, useEffect } from "react";
import { VerseCard } from "@/components/ui/VerseCard";

interface Category {
  category: string;
  verses: { label?: string; reference: string; text: string }[];
}

interface Props {
  categories: Category[];
  loading: boolean;
}

export function AyatKategoriSection({ categories, loading }: Props) {
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  // Set default after first load
  useEffect(() => {
    if (!loading && categories.length > 0 && !activeTheme) {
      setActiveTheme(categories[0].category);
    }
  }, [loading, categories, activeTheme]);

  const activeVerses = useMemo(
    () => categories.find((c) => c.category === activeTheme)?.verses ?? [],
    [categories, activeTheme]
  );

  return (
    <section className="mb-10">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none snap-x">
        {categories.map((cat) => {
          const active = activeTheme === cat.category;
          return (
            <button
              key={cat.category}
              onClick={() => setActiveTheme(cat.category)}
              className="shrink-0 snap-start px-4 py-2 rounded-full text-sm font-semibold border transition-all"
              style={
                active
                  ? { backgroundColor: "var(--brand)", borderColor: "var(--brand)", color: "white" }
                  : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
              }
            >
              {cat.category}
              <span className="ml-1.5 text-[10px] opacity-70">({cat.verses.length})</span>
            </button>
          );
        })}
      </div>

      {/* Verses */}
      {activeTheme && (
        <div className="flex flex-col gap-4">
          {activeVerses.map((v, i) => (
            <VerseCard
              key={i}
              reference={v.reference}
              text={v.text}
              label={v.label}
              bookTitle={v.reference.split(" ").slice(0, -1).join(" ")}
              accentColor={i % 2 === 0 ? "gold" : "brand"}
            />
          ))}
        </div>
      )}
    </section>
  );
}