"use client";

import React, { useState, useEffect } from "react";
import { useRealtimeStats } from "@/lib/hooks/useRealtimeStats";
import {
  CheckCircle2, XCircle, Loader2, BookOpen, Music,
  Minus,
  BookMarked, HandHeart, Star, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatRow {
  label:   string;
  filled:  boolean;
  detail?: string;
}

interface StatGroup {
  id:      string;
  title:   string;
  icon:    React.ElementType;
  color:   string;   // CSS var or hex
  rows:    StatRow[];
}

// ─── Pill badge ───────────────────────────────────────────────────────────────

function StatusPill({ filled, total }: { filled: number; total: number }) {
  const pct  = total === 0 ? 0 : Math.round((filled / total) * 100);
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

// ─── Dot strip ───────────────────────────────────────────────────────────────

function DotStrip({ rows }: { rows: StatRow[] }) {
  return (
    <div className="flex gap-0.5 items-center">
      {rows.map((r, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
          style={{ backgroundColor: r.filled ? "#22c55e" : "#fca5a5" }} />
      ))}
    </div>
  );
}

// ─── Collapsible group ────────────────────────────────────────────────────────

function StatBlock({ group }: { group: StatGroup }) {
  const [open, setOpen] = useState(false);
  const Icon   = group.icon;
  const filled = group.rows.filter((r) => r.filled).length;
  const total  = group.rows.length;
  const allOk  = filled === total;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors"
      >
        {/* Icon */}
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${group.color} 15%, transparent)` }}>
          <Icon className="h-3.5 w-3.5" style={{ color: group.color }} />
        </div>

        {/* Title */}
        <span className="text-[11px] font-bold uppercase tracking-wider flex-1 text-left"
          style={{ color: "var(--brand)" }}>
          {group.title}
        </span>

        {/* Right: dots + pill + chevron */}
        <div className="flex items-center gap-1.5">
          <DotStrip rows={group.rows} />
          <StatusPill filled={filled} total={total} />
          {open
            ? <ChevronUp   className="h-3 w-3 text-muted-foreground" />
            : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      {/* Rows */}
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {group.rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-1.5 gap-2">
              <span className="text-[11px] text-muted-foreground">{row.label}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                {row.filled
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  : row.detail
                    ? <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    : <Minus   className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
                {row.detail && (
                  <span className="text-[10px] truncate max-w-[96px]"
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

// ─── Flash dot ───────────────────────────────────────────────────────────────

function LiveDot({ lastUpdated }: { lastUpdated: Date | null }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!lastUpdated) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1200);
    return () => clearTimeout(t);
  }, [lastUpdated]);

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
      <span className="text-[10px] text-muted-foreground">
        Realtime · {lastUpdated ? format(lastUpdated, "HH:mm:ss", { locale: localeId }) : "—"}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface RenunganStatsPanelProps {
  selectedDate?: Date;
}

export function RenunganStatsPanel({ selectedDate }: RenunganStatsPanelProps = {}) {
  const { devotional: dev, mazmur, khotbah, pokdoa, khusus, authors, loading, lastUpdated } = useRealtimeStats(selectedDate);

  const authorName = (() => {
    if (!dev.authorCode) return undefined;
    const a = (authors as any)[dev.authorCode];
    return a ? `${a.title ? a.title + " " : ""}${a.name}` : dev.authorCode;
  })();

  // ── Groups ────────────────────────────────────────────────────────────────

  const renunganGroup: StatGroup = {
    id: "renungan", title: "Renungan Harian", icon: BookOpen, color: "var(--brand)",
    rows: [
      { label: "Judul",       filled: !!dev.title?.trim(),      detail: dev.title?.slice(0, 20) },
      { label: "Penulis",     filled: !!dev.authorCode?.trim(), detail: authorName },
      { label: "Isi",         filled: !!dev.body?.trim(),       detail: dev.body?.trim() ? `${dev.body.split(" ").length} kata` : undefined },
      { label: "Doa Penutup", filled: !!dev.prayer?.trim(),     detail: dev.prayer?.trim() ? `${dev.prayer.split(" ").length} kata` : undefined },
      { label: "Audio",       filled: !!dev.audioUrl?.trim(),   detail: dev.audioUrl?.trim() ? "Terupload" : undefined },
    ],
  };

  const trackedSunday = format(
    (() => { const d = new Date(selectedDate ?? new Date()); d.setDate(d.getDate() - d.getDay()); return d; })(),
    "d MMM", { locale: localeId }
  );

  // Mazmur + Bahan Khotbah digabung
  const bacaanGroup: StatGroup = {
    id: "bacaan", 
    title: `Bacaan Minggu (${trackedSunday})`, 
    icon: BookMarked, 
    color: "#7c3aed",
    rows: [
      // Mazmur
      { label: "Mazmur — Referensi", filled: !!mazmur.reference?.trim(), detail: mazmur.reference },
      { label: "Mazmur — Ayat", filled: (mazmur.verses?.length ?? 0) > 0, detail: mazmur.verses?.length ? `${mazmur.verses.length} ayat` : undefined },

      // Bahan Khotbah — Perbaikan logic
      { 
        label: "Khotbah — Perikop",  
        filled: !!khotbah.bookSlug?.trim() && khotbah.visible !== false, 
        detail: khotbah.reference || undefined 
      },
    ],
  };

  const HARI = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const pokdoaGroup: StatGroup = {
    id: "pokdoa", title: "Pokok Doa", icon: HandHeart, color: "#0891b2",
    rows: HARI.map((hari) => {
      const entry = pokdoa.find((d) => d.hari === hari);
      return { label: hari, filled: !!(entry?.topik?.trim()), detail: entry?.topik?.slice(0, 16) };
    }),
  };

  const todayKey   = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "d MMM", { locale: localeId });
  const khususGroup: StatGroup = {
    id: "khusus", title: "Ayat Khusus", icon: Star, color: "#d97706",
    rows: [
      // Cek field mingguan (sistem baru, key = sundayKey) + fallback ke field minggu lama
      { label: "Ayat Minggu",
        filled: !!(khusus?.mingguan?.[(() => { const d = new Date(selectedDate ?? new Date()); d.setDate(d.getDate() - d.getDay()); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })()]?.reference?.trim())
             || !!(khusus?.minggu?.reference?.trim()),
        detail: khusus?.mingguan?.[(() => { const d = new Date(selectedDate ?? new Date()); d.setDate(d.getDate() - d.getDay()); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })()]?.reference
             || khusus?.minggu?.reference },
      { label: `Hari ini (${todayLabel})`, filled: !!(khusus?.harian?.[todayKey]?.reference?.trim()), detail: khusus?.harian?.[todayKey]?.reference },
    ],
  };

  // ── Overall progress ─────────────────────────────────────────────────────

  const allGroups = [renunganGroup, bacaanGroup, pokdoaGroup, khususGroup];
  const totalRows = allGroups.reduce((s, g) => s + g.rows.length, 0);
  const totalFill = allGroups.reduce((s, g) => s + g.rows.filter((r) => r.filled).length, 0);
  const pct       = Math.round((totalFill / totalRows) * 100);
  const pctColor  = pct === 100 ? "#16a34a" : pct >= 50 ? "var(--brand)" : "#dc2626";

  return (
    <div className="space-y-2.5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>
          Statistik Konten
        </p>
        <LiveDot lastUpdated={lastUpdated} />
      </div>

      {/* Progress card */}
      <div className="rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Kelengkapan keseluruhan</p>
            <p className="text-xl font-black leading-none" style={{ color: pctColor }}>{pct}%</p>
          </div>
          <p className="text-[10px] text-muted-foreground text-right">
            {totalFill}/{totalRows} field<br />terisi
          </p>
        </div>
        {/* Segmented bar */}
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
          {allGroups.map((g) => {
            const gFill  = g.rows.filter((r) => r.filled).length;
            const gTotal = g.rows.length;
            const gPct   = Math.round((gFill / gTotal) * 100);
            const share  = `${(gTotal / totalRows) * 100}%`;
            return (
              <div key={g.id} className="rounded-full overflow-hidden bg-muted" style={{ width: share }}>
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: `${gPct}%`, backgroundColor: g.color }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-1.5 flex-wrap">
          {allGroups.map((g) => (
            <div key={g.id} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color }} />
              <span className="text-[9px] text-muted-foreground">{g.title}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">Klik grup untuk detail</p>
      </div>

      {/* Groups */}
      {loading ? (
        <div className="flex items-center gap-2 py-3 text-muted-foreground text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghubungkan ke Firestore...
        </div>
      ) : (
        allGroups.map((group) => (
          <StatBlock key={group.id} group={group} />
        ))
      )}

    </div>
  );
}