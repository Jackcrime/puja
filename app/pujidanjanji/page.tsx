"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout }    from "@/components/layout/AppLayout";
import { VerseCard }    from "@/components/ui/VerseCard";
import { Calendar }     from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MazmurSection }       from "@/components/pujidanjanji/MazmurSection";
import { BahanKhotbahSection } from "@/components/pujidanjanji/BahanKhotbahSection";
import { PokokDoaSection }     from "@/components/pujidanjanji/PokokDoaSection";
import { SectionDivider }      from "@/components/shared/SectionDivider";
import { CalendarDays, ChevronRight, Copy, Check, BookOpen, ScrollText, Loader2 } from "lucide-react";
import {
  useBibleReadings, useAyatKhusus,
} from "@/lib/hooks/useFirestoreData";
import { useI18n } from "@/lib/hooks/useI18n";
import { useDate } from "@/lib/context/DateContext";
import { getLiturgicalEvents, getLiturgicalSeason } from "@/lib/utils/liturgicalCalendar";
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
  const { data: BIBLE_READINGS } = useBibleReadings();
  const { data: khusus }         = useAyatKhusus();

  const { date, setDate } = useDate();
  const [calOpen,     setCalOpen]     = useState(false);
  const [readVerse,   setReadVerse]   = useState<string[]>([]);

  const displayDate = format(date, "EEEE, d MMMM yyyy", { locale: localeId });

  // Liturgical season & events for selected date
  const liturgicalSeason = getLiturgicalSeason(date);
  const liturgicalEvents = getLiturgicalEvents(date);

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
              <span className="text-xs font-semibold" style={{ color: liturgicalSeason.color }}>
                {liturgicalSeason.name}
              </span>
              {liturgicalEvents.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: liturgicalEvents[0].color }}
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif" style={{ color: "var(--brand)" }}>
                    {t("pujidanjanji.chooseDate")}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex justify-center p-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { if (d) { setDate(d); } setCalOpen(false); }}
                    className="rounded-lg border"
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
            <Accordion type="multiple" className="w-full">
              {BIBLE_READINGS.map((reading, idx) => (
                <AccordionItem value={`r-${idx}`} key={idx} className="border-b last:border-0">
                  <AccordionTrigger
                    className="px-5 py-4 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setReadVerse((p) => p.includes(reading.reference) ? p : [...p, reading.reference])}
                  >
                    <div className="flex flex-col gap-0.5 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                        <span className="font-serif font-semibold" style={{ color: "var(--brand)" }}>
                          {reading.reference}
                        </span>
                        {readVerse.includes(reading.reference) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {t("pujidanjanji.read")}
                          </span>
                        )}
                      </div>
                      {reading.title && (
                        <span className="text-xs text-muted-foreground pl-6">{reading.title}</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-2 bg-muted/20">
                    <div className="flex flex-col gap-3">
                      {(reading.verses ?? []).map((verse, vi) => (
                        <div key={vi} className="flex items-start gap-3">
                          <span className="text-xs font-bold min-w-[1.5rem] pt-0.5" style={{ color: "var(--brand)" }}>
                            {verse.number.split(":")[1]}
                          </span>
                          <p className="text-foreground leading-relaxed text-sm flex-1">{verse.text}</p>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-border mt-1">
                        <CopyBtn reference={reading.reference} text={(reading.verses ?? []).map((v) => v.text).join(" ")} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
      </div>
    </AppLayout>
  );
}