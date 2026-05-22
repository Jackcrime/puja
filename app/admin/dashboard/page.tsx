"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  useAyatCategories, useAuthors, usePustakaBooks,
  useMinistries, useBibleReadings, useAyatKhusus, useDevotional,
} from "@/lib/hooks/useFirestoreData";
import { AdminLayout }  from "@/components/admin/AdminLayout";
import { AdminGuard }   from "@/components/admin/AdminGuard";
import { DashboardStats }            from "@/components/admin/dashboard/DashboardStats";
import { DashboardVisitChart }       from "@/components/admin/dashboard/DashboardVisitChart";
import { DashboardIncompleteContent }from "@/components/admin/dashboard/DashboardIncompleteContent";
import {
  CalendarDays, ChevronRight, Megaphone, BookOpen, Pencil, ArrowUpRight,
  Star, Users, Library, Church, ScrollText, Layers,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayFull() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({
  href, label, sub, icon: Icon, delay = 0,
}: { href: string; label: string; sub: string; icon: React.ElementType; delay?: number }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 hover:shadow-sm transition-all duration-200"
      style={{ animation: `fadeUp 0.5s ease ${delay}ms both` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
        style={{ backgroundColor: "var(--brand-muted)" }}
      >
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

// ─── Module Tile ──────────────────────────────────────────────────────────────
function ModuleTile({
  href, label, desc, icon: Icon, color, badge, delay = 0,
}: {
  href: string; label: string; desc: string;
  icon: React.ElementType; color: string; badge?: number | "…"; delay?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 overflow-hidden"
      style={{ animation: `fadeUp 0.5s ease ${delay}ms both` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}07 0%, transparent 60%)` }}
      />
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}14` }}
        >
          <Icon className="h-5 w-5 transition-transform group-hover:scale-110 duration-200" style={{ color }} />
        </div>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span
              className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}14`, color }}
            >
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
      <div
        className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }}
      />
    </Link>
  );
}

// ─── Divider label ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
      {label}
    </p>
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

  const totalAyat       = lAyat       ? "…" : (ayatCats as any[]).reduce((s: number, c: any) => s + (c.verses?.length ?? 0), 0);
  const totalAuthors    = lAuthors    ? "…" : Object.keys(authors as object).length;
  const totalPustaka    = lPustaka    ? "…" : (pustaka  as any[]).length;
  const totalMinistries = lMinistries ? "…" : (ministries as any[]).length;
  const totalReadings   = lReadings   ? "…" : (readings as any[]).length;

  const ayatTahun = ayatKhusus?.tahun;
  const thisSundayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }, []);
  const ayatMinggu = ayatKhusus?.mingguan?.[thisSundayKey] ?? null;

  const quickActions = [
    { href: "/admin/ayat?tab=dwmy",    icon: CalendarDays, label: "Update Ayat Minggu",  sub: ayatMinggu?.reference ? `Saat ini: ${ayatMinggu.reference}` : "Belum diset untuk minggu ini" },
    { href: "/admin/renungan",         icon: Pencil,       label: "Edit Renungan",        sub: devotional?.title ?? "Renungan harian" },
    { href: "/admin/ayat?tab=bacaan",  icon: BookOpen,     label: "Tambah Bacaan",        sub: `${totalReadings} bacaan aktif` },
    { href: "/admin/pengumuman",       icon: Megaphone,    label: "Atur Pengumuman",      sub: "Warta jemaat terbaru" },
  ];

  const modules = [
    { href: "/admin/ayat",       icon: Star,       color: "var(--gold)",  label: "Ayat",            desc: "Kategori, DWMY, bacaan & perikop.", badge: totalAyat       },
    { href: "/admin/renungan",   icon: ScrollText,  color: "var(--brand)", label: "Renungan Harian", desc: "Teks, penulis, doa, dan audio MP3." },
    { href: "/admin/pengumuman", icon: Megaphone,   color: "var(--brand)", label: "Pengumuman",      desc: "Warta dan informasi jemaat aktif." },
    { href: "/admin/pustaka",    icon: Library,     color: "var(--gold)",  label: "Pustaka Digital", desc: "Buku, materi, dan panduan GKPB.",   badge: totalPustaka    },
    { href: "/admin/penulis",    icon: Users,       color: "var(--brand)", label: "Penulis",         desc: "Pendeta dan pengkhotbah GKPB.",     badge: totalAuthors    },
    { href: "/admin/ministries", icon: Church,      color: "var(--gold)",  label: "Unit Pelayanan",  desc: "Jemaat dan unit sinode.",            badge: totalMinistries },
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
        `}</style>

        {/* ── Hero Banner ──────────────────────────────────────────────────── */}
        <div
          className="relative mb-6 rounded-2xl overflow-hidden"
          style={{ animation: "fadeIn 0.4s ease both" }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--brand) 0%, #3a0a0a 100%)" }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cp" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
                <rect x="19" y="6" width="6" height="32" fill="white" rx="1" />
                <rect x="6" y="18" width="32" height="6" fill="white" rx="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cp)" />
          </svg>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, var(--gold) 40%, var(--gold) 60%, transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px opacity-40" style={{ background: "linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)" }} />

          <div className="relative px-6 py-7 sm:px-8 flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-10">
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {todayFull()}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
                Panel Admin<br />
                <span style={{ color: "var(--gold)" }}>GKPB Sinode</span>
              </h2>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                Puji dan Janji — kelola seluruh konten aplikasi dari sini.
              </p>
            </div>
            {ayatTahun?.reference && (
              <div className="shrink-0 max-w-xs bg-white/[0.06] border border-white/10 rounded-xl px-5 py-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "var(--gold)" }}>
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

        {/* ── Ayat Minggu callout ──────────────────────────────────────────── */}
        {!lKhusus && ayatMinggu?.reference && (
          <div
            className="mb-5 flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-4"
            style={{ animation: "fadeUp 0.45s ease 80ms both" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--brand-muted)" }}>
              <CalendarDays className="h-4 w-4" style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--gold)" }}>
                Ayat Minggu Ini
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>{ayatMinggu.reference}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{ayatMinggu.text}</p>
            </div>
            <Link
              href="/admin/ayat"
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-muted"
              style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
            >
              Edit
            </Link>
          </div>
        )}

        {/* ── Statistik ────────────────────────────────────────────────────── */}
        <DashboardStats
          totalAyat={totalAyat}
          totalAuthors={totalAuthors}
          totalPustaka={totalPustaka}
          totalReadings={totalReadings}
          totalMinistries={totalMinistries}
        />

        {/* ── Realtime Analytics (Pie Charts) ──────────────────────────────── */}
        <SectionLabel label="Statistik Realtime" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-7">
          <DashboardVisitChart
            devotional={devotional}
            ayatKhusus={ayatKhusus}
            lDevotional={lDevotional}
            lKhusus={lKhusus}
          />
          {/* Second pie card: standalone content completeness only */}
          <DashboardPieChartOnly
            devotional={devotional}
            ayatKhusus={ayatKhusus}
            lDevotional={lDevotional}
            lKhusus={lKhusus}
          />
        </div>

        {/* ── Status Konten (Collapsible) ──────────────────────────────────── */}
        <div className="mb-5">
        <DashboardIncompleteContent
          devotional={devotional}
          ayatKhusus={ayatKhusus}
          lDevotional={lDevotional}
          lKhusus={lKhusus}
        />
        </div>

        {/* ── Aksi Cepat ───────────────────────────────────────────────────── */}
        <SectionLabel label="Aksi Cepat" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
          {quickActions.map((a, i) => (
            <QuickAction key={a.href} {...a} delay={500 + i * 50} />
          ))}
        </div>

        {/* ── Modul ────────────────────────────────────────────────────────── */}
        <SectionLabel label="Kelola Konten" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m, i) => (
            <ModuleTile key={m.href} {...m} delay={620 + i * 50} />
          ))}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

// ─── Inline second pie card (content completeness breakdown) ──────────────────
import { PieChart as PieChartSVG } from "@/components/admin/dashboard/PieChart";
import type { PieSlice } from "@/components/admin/dashboard/PieChart";

function DashboardPieChartOnly({
  devotional, ayatKhusus, lDevotional, lKhusus,
}: {
  devotional: any; ayatKhusus: any; lDevotional: boolean; lKhusus: boolean;
}) {
  const [tab, setTab] = React.useState<"Renungan" | "Ayat">("Renungan");

  const renunganSlices: PieSlice[] = React.useMemo(() => {
    const fields = [
      { label: "Judul",        filled: !!devotional.title,      color: "var(--brand)" },
      { label: "Penulis",      filled: !!devotional.authorCode, color: "#4f9e8f"      },
      { label: "Isi Renungan", filled: !!devotional.body,       color: "var(--gold)"  },
      { label: "Doa",          filled: !!devotional.prayer,     color: "#7c5cbf"      },
      { label: "Audio",        filled: !!devotional.audioUrl,   color: "#e07b3a"      },
    ];
    return fields.map((f) => ({
      label: f.label,
      value: 1,
      color: f.filled ? f.color : "hsl(var(--muted))",
    }));
  }, [devotional]);

  const ayatSlices: PieSlice[] = React.useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay());
    const sk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const allSlots = [
      { label: "Tahun",    filled: !!ayatKhusus.tahun?.reference },
      { label: "Minggu",   filled: !!ayatKhusus.mingguan?.[sk]?.reference },
      ...months.map((m, i) => ({ label: m, filled: !!ayatKhusus.bulan?.[String(i+1)]?.reference })),
    ];
    const colors = ["var(--gold)","var(--brand)","#4f9e8f","#7c5cbf","#e07b3a","#3a7ec0","#d4706e","#947127","#22c55e","#f59e0b","#64748b","#ef4444","#a855f7","#06b6d4"];
    return allSlots.map((s, i) => ({
      label: s.label,
      value: 1,
      color: s.filled ? colors[i % colors.length] : "hsl(var(--muted))",
    }));
  }, [ayatKhusus]);

  const slices    = tab === "Renungan" ? renunganSlices : ayatSlices;
  const isLoading = tab === "Renungan" ? lDevotional : lKhusus;
  const filled    = slices.filter((s) => s.color !== "hsl(var(--muted))").length;
  const accent    = tab === "Renungan" ? "var(--brand)" : "var(--gold)";

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4"
      style={{ animation: "fadeUp 0.5s ease 390ms both" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Kelengkapan Field
        </p>
        <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
          {(["Renungan","Ayat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all duration-150"
              style={
                tab === t
                  ? { backgroundColor: "hsl(var(--card))", color: accent, boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }
                  : { color: "hsl(var(--muted-foreground))" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-5 items-center animate-pulse">
          <div className="w-[160px] h-[160px] rounded-full bg-muted shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            {[1,2,3].map((i) => <div key={i} className="h-3 rounded bg-muted" style={{ width:`${50+i*10}%` }} />)}
          </div>
        </div>
      ) : (
        <div className="flex gap-5 items-center">
          <div className="relative shrink-0 w-[160px] h-[160px]">
            <PieChartSVG slices={slices} size={160} innerRadius={48} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black leading-none" style={{ color: accent }}>
                {filled}/{slices.length}
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
                terisi
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-2 leading-tight">
              {tab === "Renungan" ? "5 field renungan" : "14 slot ayat khusus"}
            </p>
            {tab === "Ayat" ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {slices.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[11px] text-muted-foreground truncate">{s.label}</span>
                    <span className="ml-auto text-[10px] font-semibold shrink-0" style={{
                      color: s.color === "hsl(var(--muted))" ? "hsl(var(--muted-foreground))" : s.color
                    }}>
                      {s.color === "hsl(var(--muted))" ? "✗" : "✓"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {slices.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    <span className="ml-auto text-[10px] font-semibold" style={{
                      color: s.color === "hsl(var(--muted))" ? "hsl(var(--muted-foreground))" : s.color
                    }}>
                      {s.color === "hsl(var(--muted))" ? "kosong" : "✓"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}