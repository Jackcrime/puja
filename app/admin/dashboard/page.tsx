"use client";

import React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import {
  useAyatCategories,
  useAuthors,
  usePustakaBooks,
  usePerikop,
} from "@/lib/hooks/useFirestoreData";
import {
  Star, Users, Library, BookOpen, Megaphone, ScrollText,
  ArrowRight, Loader2,
} from "lucide-react";

// ─── Kartu statistik ──────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | "…";
  icon: React.ElementType;
  href: string;
  color: string;
}

function StatCard({ label, value, icon: Icon, href, color }: StatCardProps) {
  return (
    <Link
      href={href}
      className="bg-card border border-border rounded-xl p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
      <p className="text-2xl font-bold" style={{ color }}>
        {value === "…" ? (
          <span className="inline-block w-8 h-7 bg-muted rounded animate-pulse" />
        ) : (
          value
        )}
      </p>
      <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  // Ambil data langsung dari Firestore hooks — tidak ada hardcode lagi
  const { data: ayatCats,   loading: loadAyat    } = useAyatCategories();
  const { data: authorsDict, loading: loadAuthors } = useAuthors();
  const { data: pustaka,    loading: loadPustaka  } = usePustakaBooks();
  const { data: perikops,   loading: loadPerikop  } = usePerikop();

  // Hitung total ayat dari semua kategori
  const totalAyat = loadAyat
    ? "…"
    : (ayatCats as any[]).reduce((sum: number, cat: any) => sum + (cat.verses?.length ?? 0), 0);

  const totalAuthors = loadAuthors ? "…" : Object.keys(authorsDict as object).length;
  const totalPustaka = loadPustaka ? "…" : (pustaka as any[]).length;
  const totalPerikop = loadPerikop ? "…" : (perikops as any[]).length;

  const stats: StatCardProps[] = [
    { label: "Ayat Emas",      value: totalAyat,    icon: Star,      href: "/admin/ayat",        color: "var(--gold)"  },
    { label: "Penulis",        value: totalAuthors, icon: Users,     href: "/admin/penulis",     color: "var(--brand)" },
    { label: "Renungan Harian",value: 1,            icon: ScrollText,href: "/admin/renungan",    color: "var(--brand)" },
    { label: "Pustaka Digital",value: totalPustaka, icon: Library,   href: "/admin/pustaka",     color: "var(--gold)"  },
    { label: "Perikop",        value: totalPerikop, icon: BookOpen,  href: "/admin/perikop",     color: "var(--brand)" },
    { label: "Pengumuman",     value: 1,            icon: Megaphone, href: "/admin/pengumuman",  color: "var(--gold)"  },
  ];

  const anyLoading = loadAyat || loadAuthors || loadPustaka || loadPerikop;

  return (
    <AdminGuard>
      <AdminLayout title="Dashboard">
        {/* Sambutan */}
        <div
          className="mb-6 p-5 bg-card border border-border rounded-xl"
          style={{ borderLeftWidth: 4, borderLeftColor: "var(--brand)" }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>
            Selamat datang
          </p>
          <h2 className="font-serif font-bold text-xl" style={{ color: "var(--brand)" }}>
            Admin Panel GKPB
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola konten aplikasi Puji dan Janji dari sini.
          </p>
          {anyLoading && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Memuat statistik dari Firestore...
            </p>
          )}
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {stats.map((s) => (
            <StatCard key={s.href} {...s} />
          ))}
        </div>

        {/* Aksi cepat */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>
            Aksi Cepat
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/admin/ayat",        label: "Tambah Ayat"      },
              { href: "/admin/penulis",     label: "Tambah Penulis"   },
              { href: "/admin/pustaka",     label: "Tambah Dokumen"   },
              { href: "/admin/renungan",    label: "Edit Renungan"    },
              { href: "/admin/pengumuman",  label: "Edit Pengumuman"  },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                style={{ borderColor: "var(--brand-border)", color: "var(--brand)" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}