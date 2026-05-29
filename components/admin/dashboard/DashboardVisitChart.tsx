"use client";

import React, { useState, useMemo } from "react";
import { PieChart, PieSlice } from "./PieChart";
import { useVisitStats, shortDay, peakHour, dateKey } from "@/lib/hooks/useVisitStats";
import type { Devotional, AyatKhusus } from "@/lib/hooks/useSupabaseData";
import { TrendingUp, Clock } from "lucide-react";

// ─── Bar Chart (SVG, 7 hari) ──────────────────────────────────────────────────
function BarChart7({ data }: { data: { label: string; value: number; isToday: boolean }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 260; const H = 80;
  const barW = 24; const gap = (W - data.length * barW) / (data.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%" style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const x       = gap + i * (barW + gap);
        const barH    = Math.max((d.value / max) * H, d.value > 0 ? 4 : 2);
        const y       = H - barH;
        const color   = d.isToday ? "var(--brand)" : d.value > 0 ? "var(--gold)" : "hsl(var(--muted))";
        const opacity = d.isToday ? 1 : d.value > 0 ? 0.65 : 0.3;

        return (
          <g key={d.label}>
            {/* Bar */}
            <rect
              x={x} y={y} width={barW} height={barH}
              rx={4} fill={color} opacity={opacity}
              style={{ transition: "height 0.4s ease, y 0.4s ease" }}
            />
            {/* Value label on top */}
            {d.value > 0 && (
              <text
                x={x + barW / 2} y={y - 4}
                textAnchor="middle" fontSize={9} fontWeight="700"
                fill={d.isToday ? "var(--brand)" : "hsl(var(--muted-foreground))"}
                opacity={d.isToday ? 1 : 0.8}
              >
                {d.value}
              </text>
            )}
            {/* Day label */}
            <text
              x={x + barW / 2} y={H + 14}
              textAnchor="middle" fontSize={9} fontWeight={d.isToday ? "700" : "500"}
              fill={d.isToday ? "var(--brand)" : "hsl(var(--muted-foreground))"}
            >
              {d.label}
            </text>
            {/* Today dot */}
            {d.isToday && (
              <circle cx={x + barW / 2} cy={H + 19} r={2} fill="var(--brand)" />
            )}
          </g>
        );
      })}
      {/* Baseline */}
      <line x1={0} y1={H} x2={W} y2={H} stroke="hsl(var(--border))" strokeWidth={1} />
    </svg>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ["Kunjungan", "Kelengkapan"] as const;
type Tab = typeof TABS[number];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  devotional:  Devotional;
  ayatKhusus:  AyatKhusus;
  lDevotional: boolean;
  lKhusus:     boolean;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DashboardVisitChart({ devotional, ayatKhusus, lDevotional, lKhusus }: Props) {
  const [tab, setTab] = useState<Tab>("Kunjungan");
  const { data: visits, loading: lVisits } = useVisitStats(7);

  const today = dateKey();

  // ── Bar data ────────────────────────────────────────────────────────────────
  const barData = useMemo(() =>
    visits.map((v) => ({
      label:   shortDay(v.date),
      value:   v.count,
      isToday: v.date === today,
    })),
  [visits, today]);

  const todayData  = visits.find((v) => v.date === today);
  const todayCount = todayData?.count ?? 0;
  const peak       = todayData ? peakHour(todayData.hours) : null;
  const weekTotal  = visits.reduce((s, v) => s + v.count, 0);

  // ── Kelengkapan slices ───────────────────────────────────────────────────────
  const kelengkapanSlices = useMemo((): PieSlice[] => {
    const devFields  = [devotional.title, devotional.authorCode, devotional.body, devotional.prayer];
    const devFilled  = devFields.filter(Boolean).length;
    const devMissing = devFields.length - devFilled;

    let ayatFilled = 0; let ayatTotal = 0;
    ayatTotal++; if (ayatKhusus.tahun?.reference) ayatFilled++;
    for (let m = 1; m <= 12; m++) {
      ayatTotal++; if (ayatKhusus.bulan?.[String(m)]?.reference) ayatFilled++;
    }
    const d = new Date(); d.setDate(d.getDate() - d.getDay());
    const sk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    ayatTotal++; if (ayatKhusus.mingguan?.[sk]?.reference) ayatFilled++;
    const ayatMissing = ayatTotal - ayatFilled;

    return [
      { label: `Renungan ✓ (${devFilled})`,  value: devFilled,   color: "var(--brand)" },
      { label: `Renungan ✗ (${devMissing})`, value: devMissing,  color: "#e07b3a"      },
      { label: `Ayat ✓ (${ayatFilled})`,     value: ayatFilled,  color: "var(--gold)"  },
      { label: `Ayat ✗ (${ayatMissing})`,    value: ayatMissing, color: "#7c5cbf"      },
    ].filter((s) => s.value > 0);
  }, [devotional, ayatKhusus]);

  const accent    = tab === "Kunjungan" ? "var(--brand)" : "var(--gold)";
  const isLoading = tab === "Kunjungan" ? lVisits : (lDevotional || lKhusus);

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4"
      style={{ animation: "fadeUp 0.5s ease 340ms both" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
          Statistik Realtime
          <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "var(--brand)", opacity: 0.7 }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: "var(--brand)" }} />
            LIVE
          </span>
        </p>
        <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
          {TABS.map((t) => (
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

      {/* ── Kunjungan tab ──────────────────────────────────────────────────── */}
      {tab === "Kunjungan" && (
        isLoading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="flex gap-4">
              <div className="h-12 w-20 rounded-xl bg-muted" />
              <div className="h-12 w-20 rounded-xl bg-muted" />
            </div>
            <div className="h-24 rounded-xl bg-muted" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Top stats row */}
            <div className="flex gap-3">
              {/* Hari ini */}
              <div
                className="flex-1 rounded-xl px-4 py-3"
                style={{ backgroundColor: "var(--brand-muted)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--brand)", opacity: 0.7 }}>
                  Hari Ini
                </p>
                <p className="text-2xl font-black leading-none" style={{ color: "var(--brand)" }}>
                  {todayCount}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">sesi unik</p>
              </div>

              {/* 7 hari */}
              <div
                className="flex-1 rounded-xl px-4 py-3"
                style={{ backgroundColor: "var(--gold-muted)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--gold)", opacity: 0.8 }}>
                  7 Hari
                </p>
                <p className="text-2xl font-black leading-none" style={{ color: "var(--gold)" }}>
                  {weekTotal}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">total sesi</p>
              </div>

              {/* Peak hour */}
              {peak && (
                <div className="flex-1 rounded-xl px-4 py-3 bg-muted/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground">
                    Jam Ramai
                  </p>
                  <p className="text-2xl font-black leading-none text-foreground">
                    {peak}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">hari ini</p>
                </div>
              )}
            </div>

            {/* Bar chart */}
            <div className="pt-1">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Tren 7 Hari Terakhir
              </p>
              {weekTotal === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  Belum ada data. Pasang <code className="font-mono text-[11px]">trackPageVisit()</code> di public layout.
                </p>
              ) : (
                <BarChart7 data={barData} />
              )}
            </div>
          </div>
        )
      )}

      {/* ── Kelengkapan tab ────────────────────────────────────────────────── */}
      {tab === "Kelengkapan" && (
        isLoading ? (
          <div className="flex gap-5 items-center animate-pulse">
            <div className="w-[160px] h-[160px] rounded-full bg-muted shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-3 rounded bg-muted" style={{ width: `${45+i*10}%` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-5 items-center">
            <div className="relative shrink-0 w-[160px] h-[160px]">
              <PieChart slices={kelengkapanSlices} size={160} innerRadius={48} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-2.5 leading-tight">Renungan &amp; Ayat</p>
              <div className="flex flex-col gap-1.5">
                {kelengkapanSlices.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[11px] text-muted-foreground leading-tight">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}