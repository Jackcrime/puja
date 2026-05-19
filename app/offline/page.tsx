"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, BookOpen, Star, ScrollText } from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";

const CACHED_VERSES_ID = [
  { ref: "Filipi 4:13", text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
  { ref: "Mazmur 46:1", text: "Allah itu bagi kita tempat perlindungan dan kekuatan, sebagai penolong dalam kesesakan sangat terbukti." },
  { ref: "Yohanes 14:27", text: "Damai sejahtera Kutinggalkan bagimu. Damai sejahtera-Ku Kuberikan kepadamu." },
  { ref: "Roma 8:28", text: "Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia." },
  { ref: "Yosua 1:9", text: "Kuatkan dan teguhkanlah hatimu, janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau." },
];

const CACHED_VERSES_EN = [
  { ref: "Philippians 4:13", text: "I can do all things through him who strengthens me." },
  { ref: "Psalm 46:1", text: "God is our refuge and strength, a very present help in trouble." },
  { ref: "John 14:27", text: "Peace I leave with you; my peace I give to you." },
  { ref: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him." },
  { ref: "Joshua 1:9", text: "Be strong and courageous. Do not be afraid; the LORD your God will be with you." },
];

export default function OfflinePage() {
  const { t, lang } = useI18n();
  const verses = lang === "en" ? CACHED_VERSES_EN : CACHED_VERSES_ID;
  const [verse, setVerse] = useState(verses[0]);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const idx = Math.floor((Date.now() / 86400000) % verses.length);
    setVerse(verses[idx]);
  }, [lang]);

  const retry = () => {
    setRetrying(true);
    setTimeout(() => { window.location.href = "/"; }, 800);
  };

  const cachedPages = [
    { href: "/", label: t("offline.beranda"), icon: BookOpen },
    { href: "/janjihidup", label: t("nav.janjihidup"), icon: ScrollText },
    { href: "/ayat", label: t("nav.ayat"), icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full text-center">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "var(--brand-muted)" }}>
          <WifiOff className="h-8 w-8" style={{ color: "var(--brand)" }} />
        </div>

        {/* Title */}
        <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: "var(--brand)" }}>
          {t("offline.title")}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          {t("offline.subtitle")}
        </p>

        {/* Daily verse while offline */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6 text-left">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>
            {t("home.dailyVerse")}
          </p>
          <p className="font-serif font-semibold mb-2" style={{ color: "var(--brand)" }}>{verse.ref}</p>
          <p className="text-sm text-foreground leading-relaxed italic">&ldquo;{verse.text}&rdquo;</p>
        </div>

        {/* Cached pages */}
        <div className="flex flex-col gap-2 mb-6">
          <p className="text-xs font-semibold text-muted-foreground text-left mb-1">{t("offline.cachedContent")}</p>
          {cachedPages.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-left"
            >
              <Icon className="h-4 w-4" style={{ color: "var(--brand)" }} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Retry */}
        <button onClick={retry}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--brand)" }}
          disabled={retrying}
        >
          <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? t("common.loading") : t("offline.retry")}
        </button>
      </div>
    </div>
  );
}