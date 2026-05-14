"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AppLayout }    from "@/components/layout/AppLayout";
import { VerseCard }    from "@/components/ui/VerseCard";
import { useAyatCategories, useAyatKhusus } from "@/lib/hooks/useFirestoreData";
import { useHighlights, HIGHLIGHT_COLORS }  from "@/lib/hooks/useHighlights";
import { useI18n } from "@/lib/hooks/useI18n";
import {
  Star, BookOpen, ChevronDown, ChevronUp,
  Highlighter, Copy, Check, Calendar, Sparkles,
} from "lucide-react";

// ─── Konstanta ────────────────────────────────────────────────────────────────
const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const currentMonth = new Date().getMonth() + 1; // 1–12

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AyatEmas() {
  const { t } = useI18n();
  const { data: khusus,    loading: loadKhusus }  = useAyatKhusus();
  const { data: categories, loading: loadCat }    = useAyatCategories();
  const { highlightList, copyAll }                 = useHighlights();

  const [search,      setSearch]      = useState("");
  const [bulanOpen,   setBulanOpen]   = useState(false);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [copiedAll,   setCopiedAll]   = useState(false);

  // Set default active theme ke kategori pertama setelah load
  useEffect(() => {
    if (!loadCat && categories.length > 0 && !activeTheme)
      setActiveTheme(categories[0].category);
  }, [loadCat, categories, activeTheme]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const allVersesFlat = useMemo(() => {
    const special = [
      khusus.tahun   ? { reference: khusus.tahun.reference,   text: khusus.tahun.text,   label: `AYAT TAHUN ${khusus.tahun.year}`, category: "Tuntunan" } : null,
      khusus.minggu  ? { reference: khusus.minggu.reference,  text: khusus.minggu.text,  label: "AYAT MINGGU",   category: "Tuntunan", date: khusus.minggu.date } : null,
      ...BULAN.map((_, i) => {
        const b = khusus.bulan?.[String(i + 1)];
        return b ? { reference: b.reference, text: b.text, label: `AYAT ${BULAN[i].toUpperCase()}`, category: "Tuntunan" } : null;
      }),
    ].filter(Boolean) as any[];

    return [
      ...special,
      ...(categories as any[]).flatMap((cat: any) =>
        cat.verses.map((v: any) => ({ ...v, category: cat.category }))
      ),
    ];
  }, [khusus, categories]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allVersesFlat.filter((v) =>
      v.reference.toLowerCase().includes(q) ||
      v.text.toLowerCase().includes(q)
    );
  }, [search, allVersesFlat]);

  const handleCopyAll = async () => {
    await copyAll();
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const activeVerses = useMemo(() =>
    (categories as any[]).find((c: any) => c.category === activeTheme)?.verses ?? [],
    [categories, activeTheme]
  );

  // ── Ayat bulan saat ini ────────────────────────────────────────────────────
  const ayatBulanIni = khusus.bulan?.[String(currentMonth)];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">

        {/* ── Header ───────────────────────────────────────────────────────── */}
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

        {/* ── Search ───────────────────────────────────────────────────────── */}
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

        {/* ─────────────── SEARCH RESULTS ─────────────────────────────────── */}
        {searchResults !== null ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground font-medium">
              {searchResults.length} ayat ditemukan
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t("ayat.notFound")}</p>
                <p className="text-sm mt-1">{t("ayat.notFoundSub")}</p>
              </div>
            ) : (
              searchResults.map((v: any, i: number) => (
                <VerseCard key={i} reference={v.reference} text={v.text} label={v.label} date={v.date}
                  accentColor={i % 2 === 0 ? "gold" : "brand"} showPerikop />
              ))
            )}
          </div>

        ) : (
          <>
            {/* ──────────── SECTION 1: AYAT TUNTUNAN ───────────────────────── */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                <p className="text-xs font-bold tracking-widest uppercase px-3" style={{ color: "var(--gold)" }}>
                  Ayat Tuntunan
                </p>
                <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
              </div>

              <div className="flex flex-col gap-4">
                {/* Ayat Tahun — paling besar */}
                {khusus.tahun && (
                  <VerseCard
                    reference={khusus.tahun.reference}
                    text={khusus.tahun.text}
                    label={`AYAT TAHUN ${khusus.tahun.year}`}
                    accentColor="brand"
                    showPerikop
                  />
                )}

                {/* Ayat Bulan + Minggu berdampingan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ayatBulanIni && (
                    <VerseCard
                      reference={ayatBulanIni.reference}
                      text={ayatBulanIni.text}
                      label={`AYAT BULAN ${BULAN[currentMonth - 1].toUpperCase()}`}
                      accentColor="gold"
                      showPerikop
                    />
                  )}
                  {khusus.minggu && (
                    <VerseCard
                      reference={khusus.minggu.reference}
                      text={khusus.minggu.text}
                      label="AYAT MINGGU"
                      date={khusus.minggu.date}
                      accentColor="brand"
                      showPerikop
                    />
                  )}
                </div>

                {/* Accordion: Semua Ayat Bulanan Jan–Des */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setBulanOpen(!bulanOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: "var(--gold)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                        Daftar Ayat Bulanan {khusus.tahun?.year}
                      </span>
                    </div>
                    {bulanOpen
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {bulanOpen && (
                    <div className="border-t border-border divide-y divide-border">
                      {BULAN.map((nama, i) => {
                        const b = khusus.bulan?.[String(i + 1)];
                        const isThisMonth = i + 1 === currentMonth;
                        return (
                          <div
                            key={i}
                            className="px-4 py-3 flex gap-3"
                            style={isThisMonth ? { backgroundColor: "var(--brand-muted, #f0f4ff)" } : {}}
                          >
                            <div className="w-24 shrink-0">
                              <span
                                className="text-xs font-bold"
                                style={{ color: isThisMonth ? "var(--brand)" : "var(--muted-foreground)" }}
                              >
                                {nama}
                                {isThisMonth && <span className="ml-1 text-[9px] bg-brand/10 px-1 rounded" style={{ color: "var(--brand)" }}>Ini</span>}
                              </span>
                            </div>
                            {b ? (
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold" style={{ color: "var(--brand)" }}>{b.reference}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{b.text}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">—</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ──────────── SECTION 2: JELAJAH TEMA ────────────────────────── */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                <p className="text-xs font-bold tracking-widest uppercase px-3" style={{ color: "var(--gold)" }}>
                  Jelajah Tema
                </p>
                <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
              </div>

              {/* Category pills — horizontal scroll */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none snap-x">
                {(categories as any[]).map((cat: any) => {
                  const active = activeTheme === cat.category;
                  return (
                    <button
                      key={cat.category}
                      onClick={() => setActiveTheme(cat.category)}
                      className="shrink-0 snap-start px-4 py-2 rounded-full text-sm font-semibold border transition-all"
                      style={active ? {
                        backgroundColor: "var(--brand)",
                        borderColor:     "var(--brand)",
                        color:           "white",
                      } : {
                        borderColor: "var(--border)",
                        color:       "var(--muted-foreground)",
                      }}
                    >
                      {cat.category}
                      <span className="ml-1.5 text-[10px] opacity-70">({cat.verses.length})</span>
                    </button>
                  );
                })}
              </div>

              {/* Verses dari kategori aktif */}
              {activeTheme && (
                <div className="flex flex-col gap-4">
                  {activeVerses.map((v: any, i: number) => (
                    <VerseCard
                      key={i}
                      reference={v.reference}
                      text={v.text}
                      label={v.label}
                      accentColor={i % 2 === 0 ? "gold" : "brand"}
                      showPerikop
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ──────────── SECTION 3: AYAT TERSIMPAN ─────────────────────── */}
            {highlightList.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                  <p className="text-xs font-bold tracking-widest uppercase px-3" style={{ color: "var(--gold)" }}>
                    Ayat Disorot
                  </p>
                  <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                </div>

                {/* Info + tombol salin */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-1.5">
                    <Highlighter className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold" style={{ color: "var(--brand)" }}>{highlightList.length}</span> ayat tersimpan di perangkat ini
                    </p>
                  </div>
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-muted"
                    style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
                  >
                    {copiedAll
                      ? <><Check className="h-3.5 w-3.5 text-green-600" /> Tersalin!</>
                      : <><Copy className="h-3.5 w-3.5" /> Salin Semua</>}
                  </button>
                </div>

                {/* Color legend */}
                <div className="flex gap-3 mb-5 flex-wrap">
                  {Object.entries(HIGHLIGHT_COLORS).map(([color, val]) => {
                    const count = highlightList.filter(h => h.color === color).length;
                    if (count === 0) return null;
                    return (
                      <div key={color} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: val.bg, borderColor: val.border }} />
                        <span className="text-xs text-muted-foreground">{val.label} ({count})</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-4">
                  {highlightList.map((h, i) => (
                    <VerseCard
                      key={h.id}
                      reference={h.reference}
                      text={h.text}
                      label={h.label}
                      accentColor={i % 2 === 0 ? "gold" : "brand"}
                    />
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center mt-6 italic">
                  Sorotan disimpan di perangkat ini. Gunakan "Salin Semua" untuk menyimpan ke catatan.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}