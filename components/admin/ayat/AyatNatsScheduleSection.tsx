"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarDays, Shuffle, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Trash2, Loader2, Info, Plus, Minus,
} from "lucide-react";
import { useAyatNats, useAyatNatsSchedule, type AyatNatsItem } from "@/lib/hooks/useSupabaseData";
import { showToast } from "@/lib/utils/toast";

// ─── helpers ─────────────────────────────────────────────────────────────────

const HARI_ID  = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const HARI_FULL = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const BULAN_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function formatDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function autoPickIndex(items: AyatNatsItem[], date: Date): number {
  if (items.length === 0) return 0;
  const epoch = new Date(2025, 0, 1).getTime();
  const daysSince = Math.floor((date.getTime() - epoch) / (1000 * 60 * 60 * 24));
  return ((daysSince % items.length) + items.length) % items.length;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AyatNatsScheduleSection() {
  const { data: pool,  loading: loadPool  } = useAyatNats();
  const { data: sched, loading: loadSched, toggleItemForDate } = useAyatNatsSchedule();

  const today = new Date();
  const [open,      setOpen]      = useState(false);
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected,  setSelected]  = useState<string | null>(null);
  const [toggling,  setToggling]  = useState<string | null>(null); // item id being toggled

  const items = pool.items ?? [];

  // Calendar grid
  const calDays = useMemo(() => {
    const count    = daysInMonth(viewYear, viewMonth);
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const days: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= count; d++) days.push(new Date(viewYear, viewMonth, d));
    return days;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelected(null);
  };

  const handleToggle = async (dateKey: string, itemId: string | null) => {
    setToggling(itemId ?? "__reset__");
    try {
      await toggleItemForDate(dateKey, itemId);
      if (itemId === null) {
        showToast.success("Jadwal dihapus — kembali ke auto-rotate.");
      } else {
        const wasScheduled = (sched.schedule?.[dateKey] ?? []).includes(itemId);
        if (wasScheduled) {
          showToast.success("Ayat dilepas dari jadwal hari ini.");
        } else {
          showToast.success("Jadwal berhasil disimpan.");
        }
      }
    } catch {
      showToast.error("Gagal menyimpan jadwal. Coba lagi.");
    }
    setToggling(null);
  };

  const selectedDate     = selected ? new Date(selected + "T00:00:00") : null;
  const scheduledIdsForSelected: string[] = selected ? (sched.schedule?.[selected] ?? []) : [];
  const isManual         = scheduledIdsForSelected.length > 0;
  const autoIdx          = selectedDate ? autoPickIndex(items, selectedDate) : 0;

  if (loadPool || loadSched) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-6 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat jadwal...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
        <Info className="h-5 w-5 mx-auto mb-2 opacity-40" />
        Belum ada Ayat Nats di pool. Tambahkan dulu di bagian Ayat Nats di atas.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
      {/* Header — klik untuk buka/tutup */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/30"
        style={{ backgroundColor: "var(--brand-muted)" }}
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
            Jadwal Harian Ayat Nats
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
            {items.length} ayat di pool
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Auto-rotate jika tidak dijadwal</span>
          </div>
          {open
            ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="p-5 flex flex-col gap-5 lg:flex-row lg:gap-6">

        {/* ── Kalender ── */}
        <div className="flex-1 min-w-0">
          {/* Nav bulan */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>
              {BULAN_ID[viewMonth]} {viewYear}
            </p>
            <button onClick={nextMonth} className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {HARI_ID.map(h => (
              <div key={h} className="text-center text-[10px] font-bold text-muted-foreground py-1">{h}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />;

              const key        = formatDateKey(d);
              const isToday    = key === formatDateKey(today);
              const isPast     = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isSelected = key === selected;
              const ids        = sched.schedule?.[key] ?? [];
              const hasManual  = ids.length > 0;
              const count      = hasManual ? ids.length : 1; // auto = 1

              return (
                <button
                  key={key}
                  onClick={() => setSelected(isSelected ? null : key)}
                  className="flex flex-col items-center py-1.5 rounded-lg text-center transition-all border"
                  style={{
                    borderColor: isSelected
                      ? "var(--brand)"
                      : hasManual ? "var(--gold)" : "transparent",
                    backgroundColor: isSelected
                      ? "var(--brand-muted)"
                      : isToday ? "var(--muted)" : "transparent",
                    opacity: isPast ? 0.45 : 1,
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isSelected || isToday ? "var(--brand)" : "inherit" }}
                  >
                    {d.getDate()}
                  </span>
                  <span
                    className="text-[9px] leading-tight mt-0.5 font-medium"
                    style={{ color: hasManual ? "var(--gold)" : "var(--muted-foreground)" }}
                  >
                    {hasManual ? `★${count > 1 ? ` ×${count}` : ""}` : "·"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded border" style={{ borderColor: "var(--gold)" }} />
              Dijadwal manual
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-muted" />
              Auto-rotate
            </div>
          </div>
        </div>

        {/* ── Panel Detail ── */}
        <div className="lg:w-72 flex-shrink-0">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground text-sm py-10 border border-dashed border-border rounded-xl">
              <CalendarDays className="h-8 w-8 mb-2 opacity-30" />
              <p className="font-medium">Pilih tanggal</p>
              <p className="text-xs mt-1 px-4">Klik tanggal untuk atur ayat nats-nya. Bisa pilih lebih dari 1.</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              {/* Panel header */}
              <div className="px-4 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
                <p className="text-xs font-bold" style={{ color: "var(--brand)" }}>
                  {HARI_FULL[selectedDate?.getDay() ?? 0]}, {selectedDate?.getDate()} {BULAN_ID[selectedDate?.getMonth() ?? 0]} {selectedDate?.getFullYear()}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isManual
                    ? `${scheduledIdsForSelected.length} ayat dijadwal manual`
                    : "Auto-rotate aktif"}
                </p>
              </div>

              {/* Active list preview */}
              {isManual && (
                <div className="px-4 py-3 border-b border-border bg-muted/30">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                    Ayat yang tampil hari ini
                  </p>
                  <div className="flex flex-col gap-1">
                    {scheduledIdsForSelected.map((id) => {
                      const it = items.find(x => x.id === id);
                      if (!it) return null;
                      return (
                        <div key={id} className="flex items-start gap-1.5">
                          <span className="text-[10px] font-bold mt-0.5" style={{ color: "var(--brand)" }}>·</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold" style={{ color: "var(--brand)" }}>{it.reference}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{it.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Item picker */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {isManual ? "Centang/hapus ayat" : "Pilih ayat (bisa lebih dari 1)"}
                  </p>
                  {isManual && (
                    <button
                      onClick={() => handleToggle(selected, null)}
                      disabled={toggling !== null}
                      className="flex items-center gap-1 text-[10px] text-destructive hover:opacity-80 transition-opacity disabled:opacity-40"
                    >
                      <Trash2 className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Auto-rotate info row */}
                {!isManual && (
                  <div
                    className="flex items-start gap-2 px-3 py-2 mb-1.5 rounded-lg border text-xs"
                    style={{ borderColor: "var(--brand)", backgroundColor: "var(--brand-muted)" }}
                  >
                    <Shuffle className="h-3 w-3 shrink-0 mt-0.5" style={{ color: "var(--brand)" }} />
                    <div className="min-w-0">
                      <p className="font-semibold" style={{ color: "var(--brand)" }}>Auto: {items[autoIdx]?.reference}</p>
                      <p className="text-muted-foreground text-[10px] line-clamp-1">{items[autoIdx]?.text}</p>
                    </div>
                  </div>
                )}

                {/* Pool list — checkable */}
                <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                  {items.map((it) => {
                    const isChecked  = scheduledIdsForSelected.includes(it.id);
                    const isAuto     = !isManual && items[autoIdx]?.id === it.id;
                    const isLoading  = toggling === it.id;

                    return (
                      <button
                        key={it.id}
                        onClick={() => handleToggle(selected, it.id)}
                        disabled={toggling !== null}
                        className="flex items-start gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all hover:bg-muted disabled:opacity-60"
                        style={{
                          borderColor: isChecked ? "var(--gold)" : isAuto ? "var(--brand)" : "var(--border)",
                          backgroundColor: isChecked
                            ? "rgba(212,175,55,0.08)"
                            : isAuto ? "var(--brand-muted)" : "transparent",
                        }}
                      >
                        {/* Checkbox visual */}
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border transition-all"
                          style={{
                            borderColor: isChecked ? "var(--gold)" : "var(--border)",
                            backgroundColor: isChecked ? "var(--gold)" : "transparent",
                          }}
                        >
                          {isLoading
                            ? <Loader2 className="h-2.5 w-2.5 animate-spin text-white" />
                            : isChecked
                              ? <Check className="h-2.5 w-2.5 text-white" />
                              : null}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold truncate"
                            style={{ color: isChecked ? "var(--gold)" : isAuto ? "var(--brand)" : undefined }}
                          >
                            {it.reference}
                            {isAuto && !isManual && (
                              <span className="ml-1.5 text-[9px] font-normal text-muted-foreground">(auto hari ini)</span>
                            )}
                          </p>
                          <p className="text-muted-foreground line-clamp-1 mt-0.5 text-[10px]">{it.text}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </div>
      )}
    </div>
  );
}