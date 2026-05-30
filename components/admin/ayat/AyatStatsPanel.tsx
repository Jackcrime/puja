"use client";

/**
 * AyatStatsPanel
 * Panel statistik REALTIME untuk halaman Admin Ayat.
 * Menggunakan Supabase Realtime — update otomatis tanpa refresh.
 */

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { AyatKhusus, AyatNats, AyatNatsDailySchedule } from "@/lib/hooks/useSupabaseData";
import {
  BarChart2, CheckCircle2, XCircle, Minus,
  ChevronDown, ChevronUp, Loader2, RefreshCw,
  Flame, CalendarDays, Sun, Calendar, Star,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BULAN_NAMES = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function daysOfCurrentMonth(): string[] {
  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
  );
}

function sundaysOfCurrentMonth(): string[] {
  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  const out: string[] = [];
  for (let d = 1; d <= count; d++) {
    if (new Date(y, m, d).getDay() === 0) {
      out.push(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
  }
  return out;
}

// ─── Realtime hook ────────────────────────────────────────────────────────────

const DEFAULT_KHUSUS: AyatKhusus = {};
const DEFAULT_NATS:   AyatNats   = { items: [] };

function useAyatStatsRealtime() {
  const [khusus,     setKhusus]     = useState<AyatKhusus>(DEFAULT_KHUSUS);
  const [nats,       setNats]       = useState<AyatNats>(DEFAULT_NATS);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loaded  = useRef({ khu: false, nats: false });
  const [loading, setLoading] = useState(true);

  const markLoaded = (key: keyof typeof loaded.current) => {
    loaded.current[key] = true;
    if (Object.values(loaded.current).every(Boolean)) setLoading(false);
    setLastUpdated(new Date());
  };

  // ─── Load ayat_khusus dari 4 tabel Supabase ─────────────────────────────
  const loadKhusus = async () => {
    const [
      { data: tahun },
      { data: bulanRows },
      { data: harianRows },
      { data: mingguanRows },
    ] = await Promise.all([
      supabase.from("ayat_khusus_tahun").select("*").eq("id", "current").maybeSingle(),
      supabase.from("ayat_khusus_bulan").select("*").order("month"),
      supabase.from("ayat_khusus_harian").select("*").order("date_key"),
      supabase.from("ayat_khusus_mingguan").select("*").order("date_key"),
    ]);

    const bulan: Record<string, { reference: string; text: string }> = {};
    for (const row of (bulanRows ?? [])) {
      bulan[String(row.month)] = { reference: row.reference, text: row.text };
    }
    const harian: Record<string, { reference: string; text: string }> = {};
    for (const row of (harianRows ?? [])) {
      harian[row.date_key] = { reference: row.reference, text: row.text };
    }
    const mingguan: Record<string, { reference: string; text: string }> = {};
    for (const row of (mingguanRows ?? [])) {
      mingguan[row.date_key] = { reference: row.reference, text: row.text };
    }

    setKhusus({
      tahun:    tahun?.year ? { year: tahun.year, reference: tahun.reference, text: tahun.text } : undefined,
      bulan:    Object.keys(bulan).length    > 0 ? bulan    : undefined,
      harian:   Object.keys(harian).length   > 0 ? harian   : undefined,
      mingguan: Object.keys(mingguan).length > 0 ? mingguan : undefined,
    });
    markLoaded("khu");
  };

  // ─── Load ayat_nats pool ─────────────────────────────────────────────────
  const loadNats = async () => {
    const { data: rows } = await supabase
      .from("ayat_nats")
      .select("*")
      .order("sort_order");

    setNats({
      items: (rows ?? []).map((r: any) => ({
        id:        r.id,
        reference: r.reference,
        text:      r.text,
        bookSlug:  r.book_slug  || undefined,
        bookName:  r.book_name  || undefined,
        chapter:   r.chapter    || undefined,
        verseFrom: r.verse_from || undefined,
        verseTo:   r.verse_to   || undefined,
      })),
    });
    markLoaded("nats");
  };

  useEffect(() => {
    // Initial load
    loadKhusus();
    loadNats();

    // Realtime: subscribe ke semua tabel ayat_khusus
    const khususChannel = supabase
      .channel("ayat_stats:khusus")
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_khusus_tahun"   }, loadKhusus)
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_khusus_bulan"   }, loadKhusus)
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_khusus_harian"  }, loadKhusus)
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_khusus_mingguan"}, loadKhusus)
      .subscribe();

    // Realtime: subscribe ke ayat_nats
    const natsChannel = supabase
      .channel("ayat_stats:nats")
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_nats" }, loadNats)
      .subscribe();

    return () => {
      supabase.removeChannel(khususChannel);
      supabase.removeChannel(natsChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { khusus, nats, loading, lastUpdated };
}

// ─── Sub-types ────────────────────────────────────────────────────────────────

interface StatRow   { label: string; filled: boolean; detail?: string; }
interface StatGroup { id: string; title: string; icon: React.ElementType; color: string; rows: StatRow[]; }

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ filled, total }: { filled: number; total: number }) {
  const all  = filled === total;
  const none = filled === 0;
  const bg   = all ? "#dcfce7" : none ? "#fee2e2" : "#fef9c3";
  const fg   = all ? "#16a34a" : none ? "#dc2626" : "#854d0e";
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: bg, color: fg }}>
      {filled}/{total}
    </span>
  );
}

// ─── DotStrip ─────────────────────────────────────────────────────────────────

function DotStrip({ rows }: { rows: StatRow[] }) {
  return (
    <div className="flex gap-0.5 items-center flex-wrap">
      {rows.map((r, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
          style={{ backgroundColor: r.filled ? "#22c55e" : "#fca5a5" }} />
      ))}
    </div>
  );
}

// ─── StatBlock ────────────────────────────────────────────────────────────────

function StatBlock({ group }: { group: StatGroup }) {
  const [open, setOpen] = useState(false);
  const Icon   = group.icon;
  const filled = group.rows.filter((r) => r.filled).length;
  const total  = group.rows.length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${group.color} 15%, transparent)` }}>
          <Icon className="h-3.5 w-3.5" style={{ color: group.color }} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider flex-1 text-left"
          style={{ color: "var(--brand)" }}>
          {group.title}
        </span>
        <div className="flex items-center gap-1.5">
          <DotStrip rows={group.rows} />
          <StatusPill filled={filled} total={total} />
          {open
            ? <ChevronUp   className="h-3 w-3 text-muted-foreground" />
            : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {group.rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-1.5 gap-2">
              <span className="text-[11px] text-muted-foreground truncate">{row.label}</span>
              <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                {row.filled
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  : row.detail
                    ? <XCircle     className="h-3.5 w-3.5 text-red-400" />
                    : <Minus       className="h-3.5 w-3.5 text-muted-foreground/50" />}
                {row.detail && (
                  <span className="text-[10px] truncate max-w-[90px]"
                    style={{ color: row.filled ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                    {row.detail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LiveDot ──────────────────────────────────────────────────────────────────

function LiveDot({ lastUpdated }: { lastUpdated: Date | null }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!lastUpdated) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1200);
    return () => clearTimeout(t);
  }, [lastUpdated]);

  const hhmm = lastUpdated
    ? lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className="flex items-center gap-1.5">
      {flash && (
        <div className="flex items-center gap-1 animate-pulse">
          <RefreshCw className="h-2.5 w-2.5 text-green-500" />
          <span className="text-[10px] text-green-600 font-medium">diperbarui</span>
        </div>
      )}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-[10px] text-muted-foreground">Realtime · {hhmm}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AyatStatsPanel() {
  const { khusus, nats, loading, lastUpdated } = useAyatStatsRealtime();

  const [open, setOpen] = useState(false);
  const panelRef        = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Data derivations ───────────────────────────────────────────────────────

  const natsItems   = nats?.items ?? [];
  const now         = new Date();
  const thisYear    = now.getFullYear();
  const thisMonth   = now.getMonth() + 1;
  const thisMonthStr = BULAN_NAMES[thisMonth - 1];

  // 1. Ayat Nats pool
  const natsGroup: StatGroup = {
    id: "nats", title: "Ayat Nats", icon: Flame, color: "var(--gold)",
    rows: natsItems.length === 0
      ? [{ label: "Pool kosong — belum ada nats", filled: false }]
      : natsItems.map((item, i) => ({
          label:  `Nats ${i + 1}`,
          filled: !!(item.reference?.trim() && item.text?.trim()),
          detail: item.reference?.slice(0, 22) || undefined,
        })),
  };

  // 2. Harian — tiap tanggal bulan ini
  const harianGroup: StatGroup = {
    id: "harian", title: `Harian — ${thisMonthStr}`, icon: CalendarDays, color: "var(--brand)",
    rows: daysOfCurrentMonth().map((dateKey) => {
      const entry  = khusus?.harian?.[dateKey];
      const [,,dd] = dateKey.split("-");
      return {
        label:  `Tgl ${parseInt(dd, 10)}`,
        filled: !!(entry?.reference?.trim() && entry?.text?.trim()),
        detail: entry?.reference?.slice(0, 20) || undefined,
      };
    }),
  };

  // 3. Mingguan — tiap hari Minggu bulan ini
  const sundayKeys = sundaysOfCurrentMonth();
  const mingguanGroup: StatGroup = {
    id: "mingguan", title: `Mingguan — ${thisMonthStr}`, icon: Sun, color: "#7c3aed",
    rows: sundayKeys.length === 0
      ? [{ label: "Tidak ada hari Minggu bulan ini", filled: false }]
      : sundayKeys.map((dateKey) => {
          const entry  = khusus?.mingguan?.[dateKey];
          const [,,dd] = dateKey.split("-");
          return {
            label:  `Minggu, ${parseInt(dd, 10)} ${thisMonthStr}`,
            filled: !!(entry?.reference?.trim() && entry?.text?.trim()),
            detail: entry?.reference?.slice(0, 20) || undefined,
          };
        }),
  };

  // 4. Bulanan — 12 bulan
  const bulanGroup: StatGroup = {
    id: "bulan", title: "Bulanan (12 Bulan)", icon: Calendar, color: "#0891b2",
    rows: BULAN_NAMES.map((nama, i) => {
      const entry = khusus?.bulan?.[String(i + 1)];
      return {
        label:  nama,
        filled: !!(entry?.reference?.trim() && entry?.text?.trim()),
        detail: entry?.reference?.slice(0, 20) || undefined,
      };
    }),
  };

  // 5. Tahunan
  const tahunEntry  = khusus?.tahun;
  const tahunGroup: StatGroup = {
    id: "tahun", title: "Tahunan", icon: Star, color: "#16a34a",
    rows: [{
      label:  `Ayat Tahun ${thisYear}`,
      filled: !!(tahunEntry?.reference?.trim() && tahunEntry?.text?.trim()),
      detail: tahunEntry?.reference?.slice(0, 24) || undefined,
    }],
  };

  // ── Overall progress ──────────────────────────────────────────────────────

  const allGroups   = [natsGroup, harianGroup, mingguanGroup, bulanGroup, tahunGroup];
  const totalRows   = allGroups.reduce((s, g) => s + g.rows.length, 0);
  const totalFilled = allGroups.reduce((s, g) => s + g.rows.filter((r) => r.filled).length, 0);
  const pct         = totalRows === 0 ? 0 : Math.round((totalFilled / totalRows) * 100);
  const pctColor    = pct === 100 ? "#16a34a" : pct >= 50 ? "var(--brand)" : "#dc2626";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-semibold transition-all hover:bg-muted hover:shadow-sm"
        style={{ color: open ? "var(--brand)" : "hsl(var(--muted-foreground))" }}
        title="Statistik Ayat Realtime"
      >
        <BarChart2 className="h-4 w-4" />
        <span className="hidden sm:inline">Statistik</span>
        {!loading && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
            backgroundColor: pct === 100 ? "#dcfce7" : pct >= 50 ? "var(--brand-muted)" : "#fee2e2",
            color:           pct === 100 ? "#16a34a" : pct >= 50 ? "var(--brand)"       : "#dc2626",
          }}>
            {pct}%
          </span>
        )}
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          style={{ animation: "ayatStatsFadeDown 0.18s ease both" }}
        >
          <style>{`
            @keyframes ayatStatsFadeDown {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border"
            style={{ backgroundColor: "var(--brand-muted)" }}>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" style={{ color: "var(--brand)" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                Statistik Ayat
              </p>
            </div>
            <LiveDot lastUpdated={lastUpdated} />
          </div>

          <div className="p-3 space-y-2.5 max-h-[80vh] overflow-y-auto">
            {/* Progress card */}
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Kelengkapan keseluruhan</p>
                  <p className="text-xl font-black leading-none" style={{ color: pctColor }}>
                    {loading ? "…" : `${pct}%`}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground text-right">
                  {loading ? "—" : `${totalFilled}/${totalRows} field`}<br />terisi
                </p>
              </div>

              {/* Segmented bar */}
              <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                {allGroups.map((g) => {
                  const gFill  = g.rows.filter((r) => r.filled).length;
                  const gTotal = g.rows.length;
                  const gPct   = gTotal === 0 ? 0 : Math.round((gFill / gTotal) * 100);
                  const share  = `${(gTotal / Math.max(totalRows, 1)) * 100}%`;
                  return (
                    <div key={g.id} className="rounded-full overflow-hidden bg-muted" style={{ width: share }}>
                      <div className="h-full transition-all duration-700"
                        style={{ width: `${gPct}%`, backgroundColor: g.color }} />
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-3 mt-1.5 flex-wrap">
                {allGroups.map((g) => (
                  <div key={g.id} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="text-[9px] text-muted-foreground">{g.title}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Klik grup untuk detail ↓</p>
            </div>

            {/* Groups */}
            {loading ? (
              <div className="flex items-center gap-2 py-3 text-muted-foreground text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghubungkan ke Supabase...
              </div>
            ) : (
              allGroups.map((group) => <StatBlock key={group.id} group={group} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}