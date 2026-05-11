"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, BookOpen, Star, ScrollText } from "lucide-react";

const CACHED_VERSES = [
  { ref: "Filipi 4:13", text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
  { ref: "Mazmur 46:1", text: "Allah itu bagi kita tempat perlindungan dan kekuatan, sebagai penolong dalam kesesakan sangat terbukti." },
  { ref: "Yohanes 14:27", text: "Damai sejahtera Kutinggalkan bagimu. Damai sejahtera-Ku Kuberikan kepadamu." },
  { ref: "Roma 8:28", text: "Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia." },
  { ref: "Yosua 1:9", text: "Kuatkan dan teguhkanlah hatimu, janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau." },
];

export default function OfflinePage() {
  const [verse, setVerse] = useState(CACHED_VERSES[0]);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const idx = Math.floor((Date.now() / 86400000) % CACHED_VERSES.length);
    setVerse(CACHED_VERSES[idx]);
  }, []);

  const retry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  };

  const cachedPages = [
    { href: "/", label: "Beranda", icon: BookOpen },
    { href: "/janjihidup", label: "Janji Hidup", icon: ScrollText },
    { href: "/ayat", label: "Ayat Emas", icon: Star },
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
          Sedang Offline
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Tidak ada koneksi internet. Beberapa halaman yang sudah pernah dibuka masih tersedia di bawah.
        </p>

        {/* Daily verse while offline */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6 text-left">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>
            Ayat Hari Ini
          </p>
          <p className="font-serif font-semibold mb-2" style={{ color: "var(--brand)" }}>{verse.ref}</p>
          <p className="text-sm text-foreground leading-relaxed italic">&ldquo;{verse.text}&rdquo;</p>
        </div>

        {/* Cached pages */}
        <div className="flex flex-col gap-2 mb-6">
          <p className="text-xs font-semibold text-muted-foreground text-left mb-1">Halaman Tersimpan</p>
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
          {retrying ? "Mencoba..." : "Coba Lagi"}
        </button>
      </div>
    </div>
  );
}
