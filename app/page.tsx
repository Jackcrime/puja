"use client";

import React from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { BookOpenText, ScrollText, Library, Star, ArrowRight, CalendarDays, BookMarked, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";
import { useDevotional, useDailyVerse } from "@/lib/hooks/useFirestoreData";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function Home() {
  const { t } = useI18n();
  const { data: devotional, loading: devLoading } = useDevotional();
  const { data: dailyVerse } = useDailyVerse();
  const todayStr = format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId });

  const features = [
    { href: "/pujidanjanji", title: t("nav.pujidanjanji"), desc: "Tuntunan membaca Alkitab setiap hari untuk membangun kedisiplinan rohani.", icon: BookOpenText },
    { href: "/janjihidup",   title: t("nav.janjihidup"),   desc: "Refleksi harian untuk mengaplikasikan firman Tuhan dalam kehidupan nyata.", icon: ScrollText },
    { href: "/pustaka-digital", title: t("nav.pustaka"),   desc: "Akses dokumen, tata gereja, dan materi pembinaan Sinode GKPB.", icon: Library },
    { href: "/ayat",         title: t("nav.ayat"),         desc: "Kumpulan ayat istimewa — ayat minggu, bulanan, dan tahunan.", icon: Star },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-6">
        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <CalendarDays className="h-4 w-4" />
            <span>{todayStr}</span>
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl leading-tight mb-3">
            {t("home.welcome")}<br />
            <span style={{ color: "var(--brand)" }}>Puji dan Janji</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl">{t("home.subtitle")}</p>
        </div>

        {/* Daily Verse */}
        <div className="mb-8 rounded-xl border-l-4 p-5 bg-card" style={{ borderLeftColor: "var(--brand)" }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>{t("home.dailyVerse")}</p>
          <p className="font-serif text-lg font-semibold mb-2" style={{ color: "var(--brand)" }}>{dailyVerse.reference}</p>
          <p className="text-foreground leading-relaxed italic">&ldquo;{dailyVerse.text}&rdquo;</p>
        </div>

        {/* Devotional preview — hanya tampil jika ada konten */}
        {(devLoading || devotional.title?.trim() || devotional.body?.trim()) && (
        <div className="mb-8 bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4" style={{ color: "var(--gold)" }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>{t("home.devotionalToday")}</span>
            </div>
            <Link href="/janjihidup" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: "var(--brand)" }}>
              {t("home.readFull")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {devLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
            </div>
          ) : (
            <>
              <h3 className="font-serif font-bold text-lg mb-2" style={{ color: "var(--brand)" }}>{devotional.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{devotional.body.split("\n\n")[0]}</p>
            </>
          )}
        </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.href} href={f.href} className="group block">
                <div className="bg-card border border-border rounded-xl p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md h-full">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-muted)" }}>
                      <Icon className="h-5 w-5" style={{ color: "var(--brand)" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif font-bold text-lg mb-1" style={{ color: "var(--brand)" }}>{f.title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-4">
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--brand)" }}>
                      {t("home.readFull")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
