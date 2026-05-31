"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout }    from "@/components/layout/AppLayout";
import { VerseCard }    from "@/components/ui/VerseCard";
import { DatePickerCalendar } from "@/components/ui/DatePickerCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MazmurSection }       from "@/components/pujidanjanji/MazmurSection";
import { BahanKhotbahSection } from "@/components/pujidanjanji/BahanKhotbahSection";
import { PokokDoaSection }     from "@/components/pujidanjanji/PokokDoaSection";
import { ReadingCollapse }     from "@/components/pujidanjanji/ReadingCollapse";
import { SectionDivider }      from "@/components/shared/SectionDivider";
import { CalendarDays, ChevronRight, Copy, Check, BookOpen, ScrollText, Loader2, ExternalLink } from "lucide-react";
import {
  useBibleReadings, useAyatKhusus,
} from "@/lib/hooks/useSupabaseData";
import { useI18n } from "@/lib/hooks/useI18n";
import { useDate } from "@/lib/context/DateContext";
import { getLiturgicalEvents, getLiturgicalSeason } from "@/lib/utils/liturgicalCalendar";

// TODO: ganti dengan URL app Alkitab GKPB setelah selesai dibangun
const BIBLE_APP_URL = "https://alkitab.gkpb.id";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function CopyBtn({ text, reference }: { text: string; reference: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();
  const copy = () => {
    navigator.clipboard?.writeText(`${reference}\n"${text}"`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? t("common.copied") : t("common.copy")}
    </button>
  );
}

export default function PujiDanJanji() {
  const { t } = useI18n();
  const { date, setDate } = useDate();
  const [calOpen, setCalOpen] = useState(false);

  const { data: BIBLE_READINGS } = useBibleReadings(date);
  const { data: khusus }         = useAyatKhusus();

  const displayDate = format(date, "EEEE, d MMMM yyyy", { locale: localeId });

  // Liturgical season & events for selected date
  const liturgicalSeason = getLiturgicalSeason(date);
  const liturgicalEvents = getLiturgicalEvents(date);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const seasonColor = isDark ? (liturgicalSeason.darkColor ?? liturgicalSeason.color) : liturgicalSeason.color;

  // Ayat Harian dari date-linked record
  const dateKey    = format(date, "yyyy-MM-dd");
  const ayatHarian = khusus.harian?.[dateKey];

  // Ayat Minggu — pakai mingguan[sundayKey] (sistem baru), fallback ke minggu lama
  const sundayKey  = (() => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return format(d, "yyyy-MM-dd");
  })();
  const ayatMinggu = khusus.mingguan?.[sundayKey] ?? khusus.minggu ?? null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-border">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>
              {t("pujidanjanji.title")}
            </p>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl" style={{ color: "var(--brand)" }}>
              {displayDate}
            </h1>
            {/* Liturgical season badge */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-sm">{liturgicalSeason.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: seasonColor }}>
                {liturgicalSeason.name}
              </span>
              {liturgicalEvents.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: isDark ? (liturgicalEvents[0].darkColor ?? liturgicalEvents[0].color) : liturgicalEvents[0].color }}
                >
                  {liturgicalEvents[0].name}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {/* Calendar button */}
            <Dialog open={calOpen} onOpenChange={setCalOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("pujidanjanji.chooseDate")}</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-serif" style={{ color: "var(--brand)" }}>
                    {t("pujidanjanji.chooseDate")}
                  </DialogTitle>
                </DialogHeader>
                <div className="px-2 pb-4 pt-1">
                  <DatePickerCalendar
                    selected={date}
                    onSelect={(d) => { setDate(d); setCalOpen(false); }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Mazmur Minggu ─────────────────────────────────────────────────── */}
        <MazmurSection date={date} />

        {/* ── Ayat Minggu ───────────────────────────────────────────────────── */}
        {ayatMinggu && (
          <section className="mb-8">
            <SectionDivider label="Ayat Minggu" />
            <VerseCard
              reference={ayatMinggu.reference}
              text={ayatMinggu.text}
              bookTitle={ayatMinggu.reference.split(" ").slice(0, -1).join(" ")}
              date={"date" in ayatMinggu ? (ayatMinggu as any).date : undefined}
              accentColor="brand"
            />
          </section>
        )}

        {/* ── Ayat Harian (date-linked) ─────────────────────────────────────── */}
        <section className="mb-8">
          <SectionDivider label="Ayat Harian" />
          {ayatHarian ? (
            <VerseCard
              reference={ayatHarian.reference}
              text={ayatHarian.text}
              bookTitle={ayatHarian.reference.split(" ").slice(0, -1).join(" ")}
              label={`AYAT — ${displayDate}`}
              accentColor="gold"
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              Belum ada ayat harian untuk tanggal ini
            </div>
          )}
        </section>

        {/* ── Bahan Khotbah ─────────────────────────────────────────────────── */}
        <BahanKhotbahSection date={date} />

        {/* ── Bacaan Alkitab ────────────────────────────────────────────────── */}
        <section className="mb-8">
          <SectionDivider label={t("pujidanjanji.readings")} />
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {BIBLE_READINGS.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                Belum ada bacaan untuk hari ini.
              </div>
            ) : BIBLE_READINGS.map((reading, idx) => (
              <ReadingCollapse
                key={idx}
                reading={reading}
                index={idx}
                trackRead
              />
            ))}
          </div>
        </section>

        {/* ── Pokok Doa Harian ──────────────────────────────────────────────── */}
        <PokokDoaSection selectedDate={date} />

        {/* CTA ke Janji Hidup */}
        <Link href="/janjihidup">
          <div className="flex items-center justify-between p-5 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>
                {t("pujidanjanji.next")}
              </p>
              <p className="font-serif font-bold text-lg" style={{ color: "var(--brand)" }}>
                {t("pujidanjanji.readDevotional")}
              </p>
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </div>
        </Link>

        {/* Tombol ke App Alkitab */}
        <a href={BIBLE_APP_URL} target="_blank" rel="noopener noreferrer">
          <div className="flex items-center justify-between p-5 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all mt-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--brand-muted)" }}>
                <BookOpen className="h-4 w-4" style={{ color: "var(--brand)" }} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: "var(--gold)" }}>
                  Alkitab GKPB
                </p>
                <p className="font-serif font-bold text-base" style={{ color: "var(--brand)" }}>
                  Buka Alkitab
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </a>
      </div>
    </AppLayout>
  );
}