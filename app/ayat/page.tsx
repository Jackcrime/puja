"use client";

import React, { useState, useMemo } from "react";
import { AppLayout }    from "@/components/layout/AppLayout";
import { VerseCard }    from "@/components/ui/VerseCard";
import { useAyatCategories, useAyatKhusus } from "@/lib/hooks/useFirestoreData";
import { useI18n } from "@/lib/hooks/useI18n";
import { AyatTuntunanSection } from "@/components/ayat/AyatTuntunanSection";
import { AyatKategoriSection } from "@/components/ayat/AyatKategoriSection";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { Star, BookOpen } from "lucide-react";

export default function AyatEmas() {
  const { t } = useI18n();
  const { data: khusus,     loading: loadKhusus }  = useAyatKhusus();
  const { data: categories, loading: loadCat }     = useAyatCategories();

  const [search, setSearch] = useState("");

  // Flat list for search
  const allVersesFlat = useMemo(() => {
    const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const special = [
      khusus.tahun   ? { reference: khusus.tahun.reference,   text: khusus.tahun.text,   label: `AYAT TAHUN ${khusus.tahun.year}` }   : null,
      (() => {
        // Gunakan mingguan (baru) berdasarkan Minggu minggu ini
        const d = new Date(); d.setDate(d.getDate() - d.getDay());
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const m = khusus.mingguan?.[key];
        return m ? { reference: m.reference, text: m.text, label: "AYAT MINGGU", date: key } : null;
      })(),
      ...BULAN.map((_, i) => {
        const b = khusus.bulan?.[String(i + 1)];
        return b ? { reference: b.reference, text: b.text, label: `AYAT ${BULAN[i].toUpperCase()}` } : null;
      }),
    ].filter(Boolean) as any[];

    return [
      ...special,
      ...(categories as any[]).flatMap((cat: any) => cat.verses.map((v: any) => ({ ...v }))),
    ];
  }, [khusus, categories]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allVersesFlat.filter(
      (v) => v.reference.toLowerCase().includes(q) || v.text.toLowerCase().includes(q)
    );
  }, [search, allVersesFlat]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">

        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
              Koleksi Ayat
            </p>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl mb-2" style={{ color: "var(--brand)" }}>
            {t("ayat.title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("ayat.subtitle")}</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari referensi atau kata kunci..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 transition-shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {searchResults !== null ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground font-medium">{searchResults.length} ayat ditemukan</p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t("ayat.notFound")}</p>
                <p className="text-sm mt-1">{t("ayat.notFoundSub")}</p>
              </div>
            ) : (
              searchResults.map((v: any, i: number) => (
                <VerseCard
                  key={i}
                  reference={v.reference}
                  text={v.text}
                  label={v.label}
                  bookTitle={v.reference.split(" ").slice(0, -1).join(" ")}
                  date={v.date}
                  accentColor={i % 2 === 0 ? "gold" : "brand"}
                />
              ))
            )}
          </div>
        ) : (
          <>
            {/* Section 1: Ayat Tuntunan */}
            {!loadKhusus && (
              <>
                <SectionDivider label="Ayat Tuntunan" />
                <AyatTuntunanSection khusus={khusus} />
              </>
            )}

            {/* Section 2: Jelajah Tema */}
            {!loadCat && (
              <>
                <SectionDivider label="Jelajah Tema" />
                <AyatKategoriSection categories={categories as any} loading={loadCat} />
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}