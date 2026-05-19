"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  useAyatCategories,
  useAuthors,
  usePustakaBooks,
  useMinistries,
  useBibleReadings,
  useAyatKhusus,
  useDevotional,
} from "@/lib/hooks/useFirestoreData";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard }  from "@/components/admin/AdminGuard";
import {
  Star, Users, Library, BookOpen, Megaphone, ScrollText,
  ArrowUpRight, Church, CalendarDays, ChevronRight,
  FileText, Layers, Pencil,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayFull(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function todayShort(): string {
  return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, accent, delay = 0,
}: {
  label: string; value: number | "…"; icon: React.ElementType;
  accent: string; delay?: number;
}) {
  return (
    <div
      className="relative bg-card border border-border rounded-2xl p-5 overflow-hidden group hover:border-opacity-70 transition-all duration-200"
      style={{ animation: `fadeUp 0.5s ease ${delay}ms both` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top right, ${accent}08 0%, transparent 70%)` }} />

      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}14` }}>
          <Icon className="h-4.5 w-4.5" style={{ color: accent }} />
        </div>
        <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: accent, opacity: 0.4 }} />
      </div>

      <p className="text-3xl font-bold leading-none mb-1.5"
        style={{ color: accent, fontFamily: "var(--font-serif)" }}>
        {value === "…"
          ? <span className="inline-block w-10 h-7 bg-muted rounded animate-pulse align-middle" />
          : value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({
  href, label, sub, icon: Icon, delay = 0,
}: {
  href: string; label: string; sub: string;
  icon: React.ElementType; delay?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 hover:shadow-sm transition-all duration-200"
      style={{ animation: `fadeUp 0.5s ease ${delay}ms both` }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
        style={{ backgroundColor: "var(--brand-muted)" }}>
        <Icon className="h-4 w-4" style={{ color: "var(--brand)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

// ─── Module Tile (grid besar) ─────────────────────────────────────────────────
function ModuleTile({
  href, label, desc, icon: Icon, color, badge, delay = 0,
}: {
  href: string; label: string; desc: string;
  icon: React.ElementType; color: string; badge?: number | "…";
  delay?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 overflow-hidden"
      style={{ animation: `fadeUp 0.5s ease ${delay}ms both` }}
    >
      {/* Hover bg bloom */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}07 0%, transparent 60%)` }} />

      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}14` }}>
          <Icon className="h-5 w-5 transition-transform group-hover:scale-110 duration-200" style={{ color }} />
        </div>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}14`, color }}>
              {badge === "…" ? "—" : badge}
            </span>
          )}
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
      </div>

      <div>
        <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-serif)" }}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }} />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data: ayatCats,   loading: lAyat      } = useAyatCategories();
  const { data: authors,    loading: lAuthors    } = useAuthors();
  const { data: pustaka,    loading: lPustaka    } = usePustakaBooks();
  const { data: ministries, loading: lMinistries } = useMinistries();
  const { data: readings,   loading: lReadings   } = useBibleReadings();
  const { data: ayatKhusus, loading: lKhusus     } = useAyatKhusus();
  const { data: devotional, loading: lDevotional } = useDevotional();

  const totalAyat      = lAyat      ? "…" : (ayatCats as any[]).reduce((s: number, c: any) => s + (c.verses?.length ?? 0), 0);
  const totalAuthors   = lAuthors   ? "…" : Object.keys(authors as object).length;
  const totalPustaka   = lPustaka   ? "…" : (pustaka  as any[]).length;
  const totalMinistries= lMinistries? "…" : (ministries as any[]).length;
  const totalReadings  = lReadings  ? "…" : (readings as any[]).length;

  // Ayat tahun
  const ayatTahun = ayatKhusus?.tahun;

  // Ayat minggu — ambil dari `mingguan` (sistem baru, per tanggal Minggu)
  // TIDAK pakai legacy `minggu` agar data yg dihapus benar-benar hilang
  const thisSundayKey = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // mundur ke hari Minggu
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  })();
  const ayatMinggu = ayatKhusus?.mingguan?.[thisSundayKey] ?? null;

  const stats = [
    { label: "Ayat Kategori",   value: totalAyat,        icon: Star,      accent: "var(--gold)"  },
    { label: "Penulis",         value: totalAuthors,     icon: Users,     accent: "var(--brand)" },
    { label: "Pustaka Digital", value: totalPustaka,     icon: Library,   accent: "var(--gold)"  },
    { label: "Bacaan",          value: totalReadings,    icon: BookOpen,  accent: "var(--brand)" },
    { label: "Unit Pelayanan",  value: totalMinistries,  icon: Church,    accent: "var(--gold)"  },
  ];

  const quickActions = [
    { href: "/admin/ayat?tab=dwmy",    icon: CalendarDays, label: "Update Ayat Minggu",   sub: ayatMinggu?.reference ? `Saat ini: ${ayatMinggu.reference}` : "Belum diset untuk minggu ini" },
    { href: "/admin/renungan",         icon: Pencil,       label: "Edit Renungan",         sub: devotional?.title ?? "Renungan harian" },
    { href: "/admin/ayat?tab=bacaan",  icon: BookOpen,     label: "Tambah Bacaan",         sub: `${totalReadings} bacaan aktif` },
    { href: "/admin/pengumuman",       icon: Megaphone,    label: "Atur Pengumuman",       sub: "Warta jemaat terbaru" },
  ];

  const modules = [
    { href: "/admin/ayat",        icon: Star,         color: "var(--gold)",  label: "Ayat",              desc: "Kategori, DWMY, bacaan & perikop.", badge: totalAyat },
    { href: "/admin/renungan",    icon: ScrollText,   color: "var(--brand)", label: "Renungan Harian",   desc: "Teks, penulis, doa, dan audio MP3." },
    { href: "/admin/pengumuman",  icon: Megaphone,    color: "var(--brand)", label: "Pengumuman",        desc: "Warta dan informasi jemaat aktif." },
    { href: "/admin/pustaka",     icon: Library,      color: "var(--gold)",  label: "Pustaka Digital",   desc: "Buku, materi, dan panduan GKPB.", badge: totalPustaka },
    { href: "/admin/penulis",     icon: Users,        color: "var(--brand)", label: "Penulis",           desc: "Pendeta dan pengkhotbah GKPB.", badge: totalAuthors },
    { href: "/admin/ministries",  icon: Church,       color: "var(--gold)",  label: "Unit Pelayanan",    desc: "Jemaat dan unit sinode.", badge: totalMinistries },
  ];

  return (
    <AdminGuard>
      <AdminLayout title="Dashboard">
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
        `}</style>

        {/* ── Hero banner ─────────────────────────────────────────────────── */}
        <div className="relative mb-6 rounded-2xl overflow-hidden"
          style={{ animation: "fadeIn 0.4s ease both" }}>
          {/* Base gradient */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, var(--brand) 0%, #3a0a0a 100%)" }} />

          {/* Cross pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cp" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
                <rect x="19" y="6" width="6" height="32" fill="white" rx="1" />
                <rect x="6" y="18" width="32" height="6" fill="white" rx="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cp)" />
          </svg>

          {/* Gold shimmer line top */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent 0%, var(--gold) 40%, var(--gold) 60%, transparent 100%)" }} />

          {/* Gold shimmer line bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-px opacity-40"
            style={{ background: "linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)" }} />

          <div className="relative px-6 py-7 sm:px-8 flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-10">
            {/* Left: greeting */}
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2.5"
                style={{ color: "rgba(255,255,255,0.45)" }}>
                {todayFull()}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight"
                style={{ fontFamily: "var(--font-serif)" }}>
                Panel Admin<br />
                <span style={{ color: "var(--gold)" }}>GKPB Sinode</span>
              </h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                Puji dan Janji — kelola seluruh konten aplikasi dari sini.
              </p>
            </div>

            {/* Right: ayat tahun pill */}
            {ayatTahun?.reference && (
              <div className="shrink-0 max-w-xs bg-white/[0.06] border border-white/10 rounded-xl px-5 py-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5"
                  style={{ color: "var(--gold)" }}>
                  Ayat Tahun {ayatTahun.year}
                </p>
                <p className="text-xs font-bold mb-1 text-white/80">{ayatTahun.reference}</p>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {ayatTahun.text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Ayat Minggu callout (if set) ─────────────────────────────────── */}
        {!lKhusus && ayatMinggu?.reference && (
          <div className="mb-5 flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-4"
            style={{ animation: "fadeUp 0.45s ease 80ms both" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--brand-muted)" }}>
              <CalendarDays className="h-4 w-4" style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--gold)" }}>
                Ayat Minggu Ini
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                {ayatMinggu.reference}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                {ayatMinggu.text}
              </p>
            </div>
            <Link href="/admin/ayat"
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-muted"
              style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}>
              Edit
            </Link>
          </div>
        )}

        {/* ── Statistik ───────────────────────────────────────────────────── */}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Ringkasan Konten
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-7">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} delay={i * 55} />
          ))}
        </div>

        {/* ── Aksi Cepat ──────────────────────────────────────────────────── */}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Aksi Cepat
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
          {quickActions.map((a, i) => (
            <QuickAction key={a.href} {...a} delay={300 + i * 50} />
          ))}
        </div>

        {/* ── Semua Modul ─────────────────────────────────────────────────── */}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Kelola Konten
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m, i) => (
            <ModuleTile key={m.href} {...m} delay={520 + i * 50} />
          ))}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}