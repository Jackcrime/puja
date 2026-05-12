"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  useAyatCategories,
  useAuthors,
  usePustakaBooks,
  usePerikop,
  useMinistries,
} from "@/lib/hooks/useFirestoreData";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import {
  Star, Users, Library, BookOpen, Megaphone, ScrollText,
  ArrowUpRight, Church, CalendarDays, Cross,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function today(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, delay = 0,
}: {
  label: string; value: number | "…"; icon: React.ElementType;
  color: string; delay?: number;
}) {
  return (
    <div
      className="relative bg-card border border-border rounded-2xl p-5 overflow-hidden"
      style={{ animationDelay: `${delay}ms`, animation: "fadeUp 0.5s ease both" }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-3xl font-bold tracking-tight" style={{ color, fontFamily: "var(--font-serif)" }}>
        {value === "…" ? (
          <span className="inline-block w-10 h-8 bg-muted rounded-lg animate-pulse align-middle" />
        ) : value}
      </p>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({
  href, label, description, icon: Icon, color, badge, delay = 0,
}: {
  href: string; label: string; description: string;
  icon: React.ElementType; color: string; badge?: number | "…";
  delay?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-opacity-60 transition-all duration-200"
      style={{
        animationDelay: `${delay}ms`,
        animation: "fadeUp 0.5s ease both",
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-5 w-5 transition-transform group-hover:scale-110" style={{ color }} />
        </div>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {badge === "…" ? "—" : badge}
            </span>
          )}
          <ArrowUpRight
            className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
          />
        </div>
      </div>

      {/* Text */}
      <div>
        <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }}
      />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data: ayatCats,    loading: loadAyat     } = useAyatCategories();
  const { data: authorsDict, loading: loadAuthors  } = useAuthors();
  const { data: pustaka,     loading: loadPustaka  } = usePustakaBooks();
  const { data: perikops,    loading: loadPerikop  } = usePerikop();
  const { data: ministries,  loading: loadMinistry } = useMinistries();

  const totalAyat = loadAyat
    ? "…"
    : (ayatCats as any[]).reduce((s: number, c: any) => s + (c.verses?.length ?? 0), 0);
  const totalAuthors   = loadAuthors  ? "…" : Object.keys(authorsDict as object).length;
  const totalPustaka   = loadPustaka  ? "…" : (pustaka as any[]).length;
  const totalPerikop   = loadPerikop  ? "…" : (perikops as any[]).length;
  const totalMinistry  = loadMinistry ? "…" : (ministries as any[]).length;

  const stats = [
    { label: "Ayat Emas",       value: totalAyat,    icon: Star,      color: "var(--gold)"  },
    { label: "Penulis",         value: totalAuthors, icon: Users,     color: "var(--brand)" },
    { label: "Pustaka Digital", value: totalPustaka, icon: Library,   color: "var(--gold)"  },
    { label: "Perikop",         value: totalPerikop, icon: BookOpen,  color: "var(--brand)" },
  ];

  const modules = [
    {
      href: "/admin/ayat",        icon: Star,         color: "var(--gold)",
      label: "Ayat Emas",
      description: "Kelola koleksi ayat-ayat pilihan yang ditampilkan ke jemaat.",
      badge: totalAyat,
    },
    {
      href: "/admin/ayat-khusus", icon: CalendarDays, color: "var(--gold)",
      label: "Ayat Khusus",
      description: "Ayat tematik untuk hari raya dan momen peribadatan khusus.",
    },
    {
      href: "/admin/renungan",    icon: ScrollText,   color: "var(--brand)",
      label: "Renungan Harian",
      description: "Edit renungan yang tampil di halaman utama aplikasi.",
    },
    {
      href: "/admin/pengumuman",  icon: Megaphone,    color: "var(--brand)",
      label: "Pengumuman",
      description: "Informasi dan warta jemaat yang aktif ditampilkan.",
    },
    {
      href: "/admin/pustaka",     icon: Library,      color: "var(--gold)",
      label: "Pustaka Digital",
      description: "Upload dan kelola buku, materi, serta panduan GKPB.",
      badge: totalPustaka,
    },
    {
      href: "/admin/perikop",     icon: BookOpen,     color: "var(--brand)",
      label: "Perikop",
      description: "Atur jadwal bacaan Alkitab mingguan.",
      badge: totalPerikop,
    },
    {
      href: "/admin/bacaan",      icon: BookOpen,     color: "var(--brand)",
      label: "Bacaan Alkitab",
      description: "Kelola daftar bacaan harian untuk jemaat.",
    },
    {
      href: "/admin/penulis",     icon: Users,        color: "var(--brand)",
      label: "Penulis",
      description: "Data pendeta dan pengkhotbah yang bertugas di GKPB.",
      badge: totalAuthors,
    },
    {
      href: "/admin/ministries",  icon: Church,       color: "var(--gold)",
      label: "Unit Pelayanan",
      description: "Daftar jemaat dan unit pelayanan seluruh sinode.",
      badge: totalMinistry,
    },
  ];

  return (
    <AdminGuard>
      <AdminLayout title="Dashboard">
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `}</style>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div
          className="relative mb-6 rounded-2xl overflow-hidden"
          style={{ animation: "fadeIn 0.4s ease both" }}
        >
          {/* Background */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, var(--brand) 0%, #3d0e0e 100%)",
            }}
          />
          {/* Geometric cross pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.06]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="cross" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="18" y="6" width="4" height="28" fill="white" />
                <rect x="6" y="17" width="28" height="6" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cross)" />
          </svg>
          {/* Gold accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }}
          />

          <div className="relative px-6 py-8 sm:px-8">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
              {today()}
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white mb-1"
              style={{ fontFamily: "var(--font-serif)", lineHeight: 1.2 }}
            >
              Selamat datang,<br />Admin GKPB
            </h2>
            <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.60)" }}>
              Kelola seluruh konten aplikasi Puji dan Janji dari panel ini.
            </p>

            {/* Gold divider */}
            <div className="flex items-center gap-3 mt-5">
              <div className="h-px flex-1 opacity-20" style={{ backgroundColor: "var(--gold)" }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--gold)" }} />
              <div className="h-px flex-1 opacity-20" style={{ backgroundColor: "var(--gold)" }} />
            </div>
          </div>
        </div>

        {/* ── Statistik ───────────────────────────────────────────────────── */}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3 px-0.5">
          Ringkasan Konten
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} delay={i * 60} />
          ))}
        </div>

        {/* ── Modul ───────────────────────────────────────────────────────── */}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3 px-0.5">
          Kelola Konten
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m, i) => (
            <ModuleCard key={m.href} {...m} delay={240 + i * 50} />
          ))}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}