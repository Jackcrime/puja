"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppLayout }       from "@/components/layout/AppLayout";
import { VerseCard }       from "@/components/ui/VerseCard";
import { AuthorModal }     from "@/components/ui/AuthorModal";
import { FocusMode }       from "@/components/ui/FocusMode";
import { AyatNatsCard }    from "@/components/pujidanjanji/AyatNatsCard";
import { SectionDivider }  from "@/components/shared/SectionDivider";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play, Pause, Headphones, BookOpen, Printer, Share2, Check,
  Maximize2, Loader2, HandHeart,
} from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";
import { useDate } from "@/lib/context/DateContext";
import { format, getDay } from "date-fns";
import { id as localeId }  from "date-fns/locale";
import {
  useDevotional,
  useVerseHighlights,
  useBibleReadings,
  usePokokDoaHarian,
  useAuthors,
} from "@/lib/hooks/useFirestoreData";

// ─── Helper: hari ini dalam seminggu (0=Minggu…6=Sabtu) → nama hari ─────────
const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JanjiHidup() {
  const { t } = useI18n();
  const { date } = useDate();

  // ── Data hooks — semua sinkron dengan admin ───────────────────────────────
  const { data: devotional, loading: devLoading } = useDevotional();
  const { data: highlights, loading: hlLoading }  = useVerseHighlights();
  const { data: readings }                         = useBibleReadings();
  const { data: pokokDoaList }                     = usePokokDoaHarian();   // ← sama seperti admin
  const { data: authors }                          = useAuthors();

  // ── Audio state ───────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [shared,      setShared]      = useState(false);
  const [authorOpen,  setAuthorOpen]  = useState(false);
  const [focusMode,   setFocusMode]   = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const todayStr = format(date, "EEEE, d MMMM yyyy", { locale: localeId });
  const author   = authors[devotional.authorCode as keyof typeof authors];
  const audioUrl = (devotional as any).audioUrl as string | undefined;

  // Pokok doa hari yang dipilih — cocokkan berdasarkan nama hari
  const hariIni      = NAMA_HARI[getDay(date)];
  const pokokDoaHari = pokokDoaList.find((p) => p.hari === hariIni);

  // ── Audio listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    setProgress(0); setDuration(0); setIsPlaying(false);
    const onTime  = () => setProgress(audio.currentTime);
    const onMeta  = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate",     onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended",          onEnded);
    if (audio.readyState >= 1) setDuration(audio.duration);
    return () => {
      audio.removeEventListener("timeupdate",     onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended",          onEnded);
    };
  }, [audioUrl]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const fmt = (s: number) =>
    isFinite(s)
      ? `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`
      : "0:00";

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: devotional.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {}
  };

  // ── Focus mode ────────────────────────────────────────────────────────────
  if (focusMode) {
    return (
      <FocusMode
        title={devotional.title}
        authorCode={devotional.authorCode}
        body={devotional.body}
        prayer={devotional.prayer}
        onExit={() => setFocusMode(false)}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <AuthorModal code={devotional.authorCode} open={authorOpen} onOpenChange={setAuthorOpen} />
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-border">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>
              {t("janjihidup.title")}
            </p>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl" style={{ color: "var(--brand)" }}>
              {todayStr}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (audioRef.current && isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
                setFocusMode(true);
              }}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              title="Mode Fokus"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={share}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              title={t("common.share")}
            >
              {shared ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors no-print"
              title={t("common.print")}
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Ayat Nats ────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <AyatNatsCard />
        </section>

        {/* ── Audio ────────────────────────────────────────────────────────── */}
        <audio ref={audioRef} src={audioUrl ?? ""} preload="metadata" />
        {audioUrl && (
          <section className="mb-8 no-print">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleAudio}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: "var(--brand)" }}
                >
                  {isPlaying
                    ? <Pause className="h-4 w-4 fill-current" />
                    : <Play  className="h-4 w-4 fill-current ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-semibold text-sm leading-snug truncate mb-1" style={{ color: "var(--brand)" }}>
                    {devotional.title}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("janjihidup.audio")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        if (!audioRef.current || !duration) return;
                        const r = e.currentTarget.getBoundingClientRect();
                        audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ backgroundColor: "var(--brand)", width: duration ? `${(progress / duration) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {fmt(progress)} / {fmt(duration)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Renungan ─────────────────────────────────────────────────────── */}
        {(devLoading || devotional.title?.trim() || devotional.body?.trim()) && (
        <section className="mb-8">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="h-1 w-full" style={{ backgroundColor: "var(--brand)" }} />
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>
                {t("janjihidup.devotional")}
              </p>
              {devLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Memuat renungan...
                </div>
              ) : (
                <>
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl mb-6" style={{ color: "var(--brand)" }}>
                    {devotional.title}
                  </h2>
                  <div className="space-y-4">
                    {devotional.body.split("\n\n").map((para, i) => (
                      <p key={i} className="text-foreground leading-relaxed">{para}</p>
                    ))}
                  </div>
                  {/* Author chip */}
                  <button
                    onClick={() => setAuthorOpen(true)}
                    className="mt-6 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: "var(--brand)" }}
                    >
                      {author ? (author.name?.[0] ?? "?") : devotional.authorCode[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                        {author
                          ? `${author.title ? author.title + " " : ""}${author.name}`
                          : `(${devotional.authorCode})`}
                      </p>
                      {author?.ministry && (
                        <p className="text-xs text-muted-foreground">{author.ministry}</p>
                      )}
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
        )}

        {/* ── Doa ──────────────────────────────────────────────────────────── */}
        {!devLoading && devotional.prayer?.trim() && (
        <section className="mb-8">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="h-0.5 w-full" style={{ backgroundColor: "var(--gold)" }} />
            <div className="p-5">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--gold)" }}>
                {t("janjihidup.prayer")}
              </p>
              <p className="font-serif italic text-lg leading-relaxed" style={{ color: "var(--brand)" }}>
                &ldquo;{devotional.prayer}&rdquo;
              </p>
            </div>
          </div>
        </section>
        )}

        {/* ── Pokok Doa Hari Ini ───────────────────────────────────────────── */}
        {/* Data dari usePokokDoaHarian() — sama persis dengan yang di-manage admin */}
        {pokokDoaHari && (
          <section className="mb-8">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HandHeart className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
                    {t("janjihidup.prayerTopic")} — {pokokDoaHari.hari}
                  </p>
                </div>
                <p className="font-semibold text-sm mb-1.5" style={{ color: "var(--brand)" }}>
                  {pokokDoaHari.topik}
                </p>
                {pokokDoaHari.detail && (
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    {pokokDoaHari.detail}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Bacaan Alkitab ───────────────────────────────────────────────── */}
        <section className="mb-8">
          <SectionDivider label={t("pujidanjanji.readings")} />
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Accordion type="multiple" defaultValue={["r-0"]} className="w-full">
              {readings.map((reading, idx) => (
                <AccordionItem value={`r-${idx}`} key={idx} className="border-b last:border-0">
                  <AccordionTrigger className="px-5 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-0.5 text-left">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                        <span className="font-serif font-semibold" style={{ color: "var(--brand)" }}>
                          {reading.reference}
                        </span>
                      </div>
                      {reading.title && (
                        <span className="text-xs text-muted-foreground pl-6">{reading.title}</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-2 bg-muted/20">
                    <div className="flex flex-col gap-3">
                      {reading.verses.map((verse, vi) => (
                        <div key={vi} className="flex items-start gap-3">
                          <span className="text-xs font-bold min-w-[1.5rem] pt-0.5" style={{ color: "var(--brand)" }}>
                            {verse.number.split(":")[1]}
                          </span>
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

        {/* ── Ayat Highlights ──────────────────────────────────────────────── */}
        {!hlLoading && highlights.length > 0 && (
          <section className="mb-8">
            <SectionDivider label={t("pujidanjanji.highlights")} />
            <div className="flex flex-col gap-3">
              {highlights.map((v, i) => (
                <VerseCard
                  key={i}
                  reference={v.reference}
                  text={v.text}
                  bookTitle={v.reference.split(" ").slice(0, -1).join(" ")}
                  accentColor={i % 2 === 0 ? "gold" : "brand"}
                  showPerikop
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </AppLayout>
  );
}