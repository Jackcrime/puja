"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VerseCard } from "@/components/ui/VerseCard";
import { AuthorModal } from "@/components/ui/AuthorModal";
import { FocusMode } from "@/components/ui/FocusMode";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Play, Pause, Headphones, BookOpen, Printer, Share2, Check, Maximize2, Loader2, ScrollText } from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  useDevotional, useVerseHighlights, useBibleReadings,
  usePrayerTopic, useSpecialVerses, useAuthors,
  usePerikop,
} from "@/lib/hooks/useFirestoreData";

export default function JanjiHidup() {
  const { t } = useI18n();
  const { data: devotional, loading: devLoading } = useDevotional();
  const { data: highlights, loading: hlLoading }  = useVerseHighlights();
  const { data: readings }                         = useBibleReadings();
  const { data: prayerTopic }                      = usePrayerTopic();
  const { data: specialVerses }                    = useSpecialVerses();
  const { data: authors }                          = useAuthors();
  const { data: perikop }                          = usePerikop();

  const [isPlaying, setIsPlaying]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [shared, setShared]         = useState(false);
  const [authorOpen, setAuthorOpen] = useState(false);
  const [focusMode, setFocusMode]   = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const todayStr = format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId });
  const author = authors[devotional.authorCode as keyof typeof authors];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", () => setIsPlaying(false));
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const fmt = (s: number) => isFinite(s) ? `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}` : "0:00";

  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: devotional.title, url: window.location.href }); }
      else { await navigator.clipboard.writeText(window.location.href); setShared(true); setTimeout(()=>setShared(false),2000); }
    } catch {}
  };

  if (focusMode) {
    return <FocusMode title={devotional.title} authorCode={devotional.authorCode} body={devotional.body} prayer={devotional.prayer} onExit={() => setFocusMode(false)} />;
  }

  return (
    <AppLayout>
      <AuthorModal code={devotional.authorCode} open={authorOpen} onOpenChange={setAuthorOpen} />
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-border">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>{t("janjihidup.title")}</p>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl" style={{ color: "var(--brand)" }}>{todayStr}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setFocusMode(true)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"><Maximize2 className="h-4 w-4" /></button>
            <button onClick={share} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
              {shared ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
            </button>
            <button onClick={() => window.print()} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors no-print"><Printer className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Audio Player — hanya tampil jika admin sudah upload audio */}
        {(devotional as any).audioUrl ? (
        <section className="mb-8 no-print">
          <audio ref={audioRef} src={(devotional as any).audioUrl} preload="metadata" />
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-4">
              <button onClick={toggleAudio} className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: "var(--brand)" }}>
                {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Headphones className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("janjihidup.audio")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                    if (!audioRef.current || !duration) return;
                    const r = e.currentTarget.getBoundingClientRect();
                    audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
                  }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: "var(--brand)", width: duration ? `${(progress/duration)*100}%` : "0%" }} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{fmt(progress)} / {fmt(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        ) : <audio ref={audioRef} src="" />}

        {/* Perikop */}
        {perikop.length > 0 && (
        <section className="mb-8 no-print">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
              <ScrollText className="h-4 w-4" style={{ color: "var(--brand)" }} />
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Perikop Hari Ini</p>
            </div>
            <div className="divide-y divide-border">
              {(perikop as any[]).map((p: any, i: number) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white mt-0.5" style={{ backgroundColor: "var(--brand)" }}>{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-serif font-semibold text-sm leading-snug" style={{ color: "var(--brand)" }}>
                      {p.bookName ?? p.book} {p.chapter}:{p.verses ?? `${p.verseFrom}–${p.verseTo}`}
                    </p>
                    {p.heading && <p className="text-xs text-muted-foreground mt-0.5">{p.heading}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Verse Highlights */}
        <section className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{t("pujidanjanji.highlights")}</p>
          {hlLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Memuat...</div> : (
            <div className="flex flex-col gap-3">
              {highlights.map((v, i) => <VerseCard key={i} reference={v.reference} text={v.text} id={`jh-hl-${i}`} showPerikop />)}
            </div>
          )}
        </section>

        {/* Bible Readings */}
        <section className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{t("pujidanjanji.readings")}</p>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Accordion type="multiple" defaultValue={["r-0"]} className="w-full">
              {readings.map((reading, idx) => (
                <AccordionItem value={`r-${idx}`} key={idx} className="border-b last:border-0">
                  <AccordionTrigger className="px-5 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-0.5 text-left">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                        <span className="font-serif font-semibold" style={{ color: "var(--brand)" }}>{reading.reference}</span>
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Devotional */}
        <section className="mb-8">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="h-1 w-full" style={{ backgroundColor: "var(--brand)" }} />
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{t("janjihidup.devotional")}</p>
              {devLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Memuat renungan...</div>
              ) : (
                <>
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl mb-6" style={{ color: "var(--brand)" }}>{devotional.title}</h2>
                  <div className="space-y-4">
                    {devotional.body.split("\n\n").map((para, i) => (
                      <p key={i} className="text-foreground leading-relaxed">{para}</p>
                    ))}
                  </div>
                  <button onClick={() => setAuthorOpen(true)} className="mt-6 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: "var(--brand)" }}>
                      {author ? (author.name?.[0] ?? "?") : devotional.authorCode[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                        {author ? `${author.title ? author.title + " " : ""}${author.name}` : `(${devotional.authorCode})`}
                      </p>
                      {author?.ministry && <p className="text-xs text-muted-foreground">{author.ministry}</p>}
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Prayer */}
        <section className="mb-8">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="h-0.5 w-full" style={{ backgroundColor: "var(--gold)" }} />
            <div className="p-5">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--gold)" }}>{t("janjihidup.prayer")}</p>
              <p className="font-serif italic text-lg leading-relaxed" style={{ color: "var(--brand)" }}>&ldquo;{devotional.prayer}&rdquo;</p>
            </div>
          </div>
        </section>

        {/* Prayer Topic */}
        <section className="mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--gold)" }}>{t("janjihidup.prayerTopic")}: {prayerTopic.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed italic">{prayerTopic.text}</p>
          </div>
        </section>

        {/* Special Verses */}
        <section className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{t("pujidanjanji.special")}</p>
          <div className="flex flex-col gap-3">
            {specialVerses.map((v, i) => (
              <VerseCard key={i} reference={v.reference} text={v.text} label={v.label} date={(v as any).date} id={`jh-sv-${i}`} accentColor="brand" />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}