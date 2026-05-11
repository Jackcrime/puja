"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VerseCard } from "@/components/ui/VerseCard";
import { useAyatCategories, useSpecialVerses } from "@/lib/hooks/useFirestoreData";
import { useI18n } from "@/lib/hooks/useI18n";
import { Star, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

export default function AyatEmas() {
  const { t } = useI18n();
  const { data: AYAT_CATEGORIES } = useAyatCategories();
  const { data: SPECIAL_VERSES }  = useSpecialVerses();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);

  const allVersesFlat = useMemo(() => [
    ...SPECIAL_VERSES.map(v => ({ ...v, category: "Tuntunan" })),
    ...AYAT_CATEGORIES.flatMap(cat => cat.verses.map(v => ({ ...v, category: cat.category }))),
  ], []);

  const filteredBySearch = useMemo(() => {
    if (!search) return null;
    return allVersesFlat.filter(v =>
      v.reference.toLowerCase().includes(search.toLowerCase()) ||
      v.text.toLowerCase().includes(search.toLowerCase()) ||
      v.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, allVersesFlat]);

  const toggleCategory = (cat: string) => {
    setExpanded(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Koleksi Ayat</p>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl mb-2" style={{ color: "var(--brand)" }}>{t("ayat.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("ayat.subtitle")}</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("ayat.search")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 transition-shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Search results */}
        {filteredBySearch !== null ? (
          filteredBySearch.length > 0 ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              <p className="text-xs text-muted-foreground font-medium">{filteredBySearch.length} ayat ditemukan</p>
              {filteredBySearch.map((v, i) => (
                <VerseCard key={i} reference={v.reference} text={v.text} label={v.label} date={(v as any).date} id={`search-${i}`} accentColor={i % 2 === 0 ? "gold" : "brand"} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t("ayat.notFound")}</p>
              <p className="text-sm mt-1">{t("ayat.notFoundSub")}</p>
            </div>
          )
        ) : (
          <>
            {/* Special verses */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Ayat Tuntunan</p>
              </div>
              <div className="flex flex-col gap-3">
                {SPECIAL_VERSES.map((v, i) => (
                  <VerseCard key={i} reference={v.reference} text={v.text} label={v.label} date={v.date} id={`special-${i}`} accentColor="brand" />
                ))}
              </div>
            </div>

            {/* Categories */}
            {AYAT_CATEGORIES.map((cat) => {
              const isOpen = expanded.includes(cat.category);
              return (
                <div key={cat.category} className="mb-4">
                  <button
                    onClick={() => toggleCategory(cat.category)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-serif font-semibold" style={{ color: "var(--brand)" }}>{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{cat.verses.length} ayat</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-3 mt-3 animate-fade-in">
                      {cat.verses.map((v, i) => (
                        <VerseCard key={i} reference={v.reference} text={v.text} label={v.label} id={`${cat.category}-${i}`} accentColor={i % 2 === 0 ? "gold" : "brand"} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </AppLayout>
  );
}