"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { VerseCard } from "@/components/ui/VerseCard";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, ChevronRight, Copy, Check, BookOpen, ScrollText } from "lucide-react";
import { VERSE_HIGHLIGHTS, BIBLE_READINGS, PRAYER_TOPIC, SPECIAL_VERSES, PERIKOP } from "@/lib/mockData";
import { useI18n } from "@/lib/hooks/useI18n";
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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [perikopOpen, setPerikopOpen] = useState(false);
  const [readVerse, setReadVerse] = useState<string[]>([]);

  const displayDate = date
    ? format(date, "EEEE, d MMMM yyyy", { locale: localeId })
    : "Sabtu, 3 Mei 2026";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-border">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>{t("pujidanjanji.title")}</p>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl" style={{ color: "var(--brand)" }}>{displayDate}</h1>
          </div>
          <div className="flex gap-2">
            {/* Perikop button */}
            <Dialog open={perikopOpen} onOpenChange={setPerikopOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <ScrollText className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("pujidanjanji.perikop")}</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif" style={{ color: "var(--brand)" }}>{t("pujidanjanji.perikop")}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-2">
                  {PERIKOP.map((p, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-xl" style={{ backgroundColor: "var(--brand-muted)" }}>
                      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>{i + 1}</div>
                      <div>
                        <p className="font-serif font-semibold" style={{ color: "var(--brand)" }}>
                          {p.book} {p.chapter}:{p.verses}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">{p.heading}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Calendar button */}
            <Dialog open={calOpen} onOpenChange={setCalOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" aria-label={t("pujidanjanji.chooseDate")}>
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("pujidanjanji.chooseDate")}</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif" style={{ color: "var(--brand)" }}>{t("pujidanjanji.chooseDate")}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center p-4">
                  <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setCalOpen(false); }} className="rounded-lg border" />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Verse Highlights */}
        <section className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{t("pujidanjanji.highlights")}</p>
          <div className="flex flex-col gap-3">
            {VERSE_HIGHLIGHTS.map((v, i) => (
              <VerseCard key={i} reference={v.reference} text={v.text} id={`highlight-${i}`} />
            ))}
          </div>
        </section>

        {/* Bible Readings */}
        <section className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{t("pujidanjanji.readings")}</p>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Accordion type="multiple" className="w-full">
              {BIBLE_READINGS.map((reading, idx) => (
                <AccordionItem value={`r-${idx}`} key={idx} className="border-b last:border-0">
                  <AccordionTrigger className="px-5 py-4 hover:bg-muted/50 transition-colors text-left" onClick={() => setReadVerse(p => p.includes(reading.reference) ? p : [...p, reading.reference])}>
                    <div className="flex flex-col gap-0.5 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                        <span className="font-serif font-semibold" style={{ color: "var(--brand)" }}>{reading.reference}</span>
                        {readVerse.includes(reading.reference) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t("pujidanjanji.read")}</span>
                        )}
                      </div>
                      {reading.title && <span className="text-xs text-muted-foreground pl-6">{reading.title}</span>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-2 bg-muted/20">
                    <div className="flex flex-col gap-3">
                      {reading.verses.map((verse, vi) => (
                        <div key={vi} className="flex items-start gap-3">
                          <span className="text-xs font-bold min-w-[1.5rem] pt-0.5" style={{ color: "var(--brand)" }}>{verse.number.split(":")[1]}</span>
                          <p className="text-foreground leading-relaxed text-sm flex-1">{verse.text}</p>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-border mt-1">
                        <CopyBtn reference={reading.reference} text={reading.verses.map(v => v.text).join(" ")} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Prayer Topic */}
        <section className="mb-8">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
            <div className="p-5">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--gold)" }}>{t("pujidanjanji.prayer")}</p>
              <h3 className="font-serif font-bold text-lg mb-3" style={{ color: "var(--brand)" }}>{PRAYER_TOPIC.title}</h3>
              <p className="text-muted-foreground leading-relaxed italic text-sm">{PRAYER_TOPIC.text}</p>
            </div>
          </div>
        </section>

        {/* Special Verses */}
        <section className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{t("pujidanjanji.special")}</p>
          <div className="flex flex-col gap-3">
            {SPECIAL_VERSES.map((v, i) => (
              <VerseCard key={i} reference={v.reference} text={v.text} label={v.label} date={v.date} id={`special-${i}`} accentColor="brand" />
            ))}
          </div>
        </section>

        {/* CTA */}
        <Link href="/janjihidup">
          <div className="flex items-center justify-between p-5 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>{t("pujidanjanji.next")}</p>
              <p className="font-serif font-bold text-lg" style={{ color: "var(--brand)" }}>{t("pujidanjanji.readDevotional")}</p>
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </AppLayout>
  );
}
