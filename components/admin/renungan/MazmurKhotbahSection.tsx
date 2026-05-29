"use client";

import React, { useState } from "react";
import {
  useMazmurMinggu, useBahanKhotbah,
  type MazmurMinggu, type BahanKhotbah,
} from "@/lib/hooks/useSupabaseData";
import {
  BibleVerseSelector, emptySelection, refLabel, effectiveVerses,
  type VerseSelection,
} from "@/components/admin/ayat/BibleVerseSelector";
import { selToRef } from "@/lib/utils/adminAyat";
import { showToast } from "@/lib/utils/toast";
import {
  BookMarked, BookOpen, CalendarDays,
  Check, Eye, EyeOff, Loader2, Save, RotateCcw,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { FieldLabel, SectionCard, SaveButton } from "./shared";
import {
  format, addWeeks, subWeeks, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, addMonths, subMonths, isSameDay,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useDate } from "@/lib/context/DateContext";

const HARI_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;
const HARI_FULL   = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

function getSunday(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

// ─── Day-of-Week Checkbox Row ─────────────────────────────────────────────────

function DayOfWeekPicker({
  visibleDays,
  onChange,
  disabled,
}: {
  visibleDays: number[];
  onChange:    (days: number[]) => void;
  disabled?:   boolean;
}) {
  const toggle = (day: number) => {
    if (disabled) return;
    if (visibleDays.includes(day)) {
      if (visibleDays.length === 1) return;
      onChange(visibleDays.filter((d) => d !== day));
    } else {
      onChange([...visibleDays, day].sort());
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap">
        {([0,1,2,3,4,5,6] as const).map((day) => {
          const active = visibleDays.includes(day);
          return (
            <button
              key={day}
              onClick={() => toggle(day)}
              disabled={disabled}
              title={HARI_FULL[day]}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50",
                active
                  ? "text-white border-transparent"
                  : "border-border text-muted-foreground hover:bg-muted",
              ].join(" ")}
              style={active ? { backgroundColor: day === 0 ? "var(--brand)" : "var(--gold)" } : {}}
            >
              {active && <Check className="h-3 w-3 shrink-0" />}
              {HARI_LABELS[day]}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Konten tampil pada hari yang dicentang. Untuk hari raya Kristen, tambahkan hari selain Minggu.
      </p>
    </div>
  );
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

function MonthCalendar({
  referenceDate,
  visibleDays,
}: {
  referenceDate: Date;
  visibleDays:   number[];
}) {
  const [month, setMonth] = useState(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1));
  const today    = new Date();
  const days     = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstDay = getDay(startOfMonth(month));

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-xs font-bold" style={{ color: "var(--brand)" }}>
          {format(month, "MMMM yyyy", { locale: localeId })}
        </p>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {HARI_LABELS.map((h) => (
          <p key={h} className="text-center text-[9px] font-bold text-muted-foreground py-1">{h}</p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map((day) => {
          const dow       = getDay(day);
          const isVisible = visibleDays.includes(dow);
          const isToday   = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={[
                "flex items-center justify-center h-7 rounded-lg text-[10px] font-semibold relative",
                isToday ? "ring-1 ring-offset-1 ring-current" : "",
              ].join(" ")}
              style={
                isVisible
                  ? { backgroundColor: dow === 0 ? "var(--brand)" : "var(--gold)", color: "white" }
                  : { color: "var(--muted-foreground)" }
              }
              title={`${format(day, "d MMMM yyyy", { locale: localeId })} — ${HARI_FULL[dow]}`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "var(--brand)" }} />
          <span className="text-[9px] text-muted-foreground">Minggu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "var(--gold)" }} />
          <span className="text-[9px] text-muted-foreground">Hari lain</span>
        </div>
      </div>
    </div>
  );
}

// ─── Week Picker (enhanced) ───────────────────────────────────────────────────

function WeekPicker({
  date,
  onChange,
  visibleDays,
}: {
  date:        Date;
  onChange:    (d: Date) => void;
  visibleDays: number[];
}) {
  const [expanded, setExpanded] = useState(false);
  const sunday   = getSunday(date);
  const saturday = new Date(sunday);
  saturday.setDate(saturday.getDate() + 6);

  const sunLabel = format(sunday,   "d MMM",      { locale: localeId });
  const satLabel = format(saturday, "d MMM yyyy", { locale: localeId });
  const isThisWeek = getSunday(new Date()).toDateString() === sunday.toDateString();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border w-fit">
        <button
          onClick={() => onChange(subWeeks(date, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
          title="Minggu sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border min-w-[180px] justify-center">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
            {sunLabel} — {satLabel}
          </span>
          {isThisWeek && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: "var(--brand)" }}>
              INI
            </span>
          )}
        </div>

        <button
          onClick={() => onChange(addWeeks(date, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
          title="Minggu berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {!isThisWeek && (
          <button
            onClick={() => onChange(new Date())}
            className="ml-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-background transition-colors"
            style={{ color: "var(--brand)" }}
            title="Kembali ke minggu ini"
          >
            Sekarang
          </button>
        )}

        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-all text-muted-foreground hover:text-foreground ml-0.5"
          title={expanded ? "Tutup kalender bulan" : "Buka kalender bulan (persiapan)"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && <MonthCalendar referenceDate={date} visibleDays={visibleDays} />}
    </div>
  );
}

// ─── Sub-section: Mazmur ──────────────────────────────────────────────────────
function MazmurSubSection({ date }: { date: Date }) {
  const { data, loading, save, clear } = useMazmurMinggu(date);
  const [sel,           setSel]           = useState<VerseSelection>(emptySelection());
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [resetting,     setResetting]     = useState(false);
  const [previewVerses, setPreviewVerses] = useState<{ number: string; text: string }[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  const isVisible   = data.visible !== false;
  const visibleDays: number[] = data.visibleDays ?? [0];

  const handleSelChange = async (newSel: VerseSelection) => {
    setSel(newSel);
    setPreviewVerses([]);
    if (!newSel.bookSlug || !newSel.chapter) return;
    setLoadingVerses(true);
    try {
      const { from, to } = effectiveVerses(newSel);
      const res  = await fetch(`/api/bible?book=${newSel.bookSlug}&chapter=${newSel.chapter}&from=${from}&to=${to}`);
      const json = await res.json();
      if (res.ok && !json.error) {
        setPreviewVerses((json.verses as { verse: number; text: string }[]).map((v) => ({
          number: `${newSel.chapter}:${v.verse}`,
          text:   v.text,
        })));
      }
    } catch {}
    setLoadingVerses(false);
  };

  const handleDayToggle = async (days: number[]) => {
    setSaving(true);
    try {
      await save({ ...data, visibleDays: days }, date);
      showToast.success("Hari tampil diperbarui.");
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await clear(date);
      setSel(emptySelection());
      setPreviewVerses([]);
      showToast.success("Mazmur Minggu berhasil direset.");
    } catch { showToast.error("Gagal mereset. Coba lagi."); }
    setResetting(false);
  };

  const handleSave = async () => {
    if (!sel.bookSlug) { showToast.error("Pilih ayat Mazmur terlebih dahulu."); return; }
    setSaving(true);
    try {
      const { from, to } = effectiveVerses(sel);
      const res    = await fetch(`/api/bible?book=${sel.bookSlug}&chapter=${sel.chapter}&from=${from}&to=${to}`);
      const json   = await res.json();
      const verses: MazmurMinggu["verses"] = res.ok && !json.error
        ? (json.verses as { verse: number; text: string }[]).map((v) => ({ number: `${sel.chapter}:${v.verse}`, text: v.text }))
        : [];
      await save({ reference: selToRef(sel), title: "", verses, visible: isVisible, visibleDays }, date);
      showToast.success("Mazmur Minggu disimpan.");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { showToast.error("Gagal menyimpan. Coba lagi."); }
    setSaving(false);
  };

  const handleToggleVisible = async () => {
    const next = !isVisible;
    setSaving(true);
    try {
      await save({ ...data, visible: next }, date);
      showToast.success(next ? "Mazmur Minggu ditampilkan." : "Mazmur Minggu disembunyikan.");
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground text-sm py-3"><Loader2 className="h-4 w-4 animate-spin" /> Memuat Mazmur...</div>;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Mazmur Minggu</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleToggleVisible} disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60 ${
              isVisible
                ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {isVisible ? <><Eye className="h-3 w-3" /> Tampil</> : <><EyeOff className="h-3 w-3" /> Disembunyikan</>}
          </button>
          <button onClick={handleReset} disabled={saving || resetting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 disabled:opacity-60 transition-all"
          >
            {resetting ? <><Loader2 className="h-3 w-3 animate-spin" /> Reset...</> : <><RotateCcw className="h-3 w-3" /> Reset</>}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
            style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
          >
            {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>
              : saved ? <><Check className="h-3 w-3" /> Tersimpan ✓</>
              : <><Save className="h-3 w-3" /> Simpan</>}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {!isVisible && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <EyeOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">Section ini <strong>disembunyikan</strong> di halaman Puji &amp; Janji.</p>
          </div>
        )}

        {data.reference && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
            <BookMarked className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Aktif minggu ini</p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--brand)" }}>{data.reference}</p>
            </div>
          </div>
        )}

        {/* Hari Tampil */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--brand)" }}>Hari Tampil di Halaman Publik</p>
          </div>
          <DayOfWeekPicker visibleDays={visibleDays} onChange={handleDayToggle} disabled={saving} />
        </div>

        <div>
          <FieldLabel>Pilih Mazmur Minggu</FieldLabel>
          <BibleVerseSelector value={sel} onChange={handleSelChange} showPreview lockedBook="mazmur" />
          <p className="text-[10px] text-muted-foreground mt-2">Teks otomatis diambil dari API Alkitab saat disimpan.</p>

          {previewVerses.length > 0 && (
            <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--gold)" }}>
                Pratinjau — {selToRef(sel)}
              </p>
              {loadingVerses ? (
                <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat ayat...</div>
              ) : (
                previewVerses.map((v, i) => (
                  <p key={i} className="text-sm leading-relaxed">
                    <span className="font-bold text-xs mr-2" style={{ color: "var(--brand)" }}>{v.number}</span>
                    {v.text}
                  </p>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-section: Bahan Khotbah ───────────────────────────────────────────────
function BahanKhotbahSubSection({ date }: { date: Date }) {
  const { data, loading, save, clear } = useBahanKhotbah(date);
  const [sel,       setSel]       = useState<VerseSelection>(emptySelection());
  const [synced,    setSynced]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [resetting, setResetting] = useState(false);

  const isVisible   = data.visible !== false;
  const visibleDays: number[] = data.visibleDays ?? [0];

  // Reset synced state when date changes (ganti minggu)
  const dateKey = date.toISOString().slice(0, 10);
  React.useEffect(() => {
    setSynced(false);
    setSel(emptySelection());
  }, [dateKey]);

  // Sync dari Firestore ke sel saat data pertama kali load
  React.useEffect(() => {
    if (!loading && !synced) {
      setSynced(true);
      if (data.bookSlug) {
        setSel({
          bookSlug:  data.bookSlug,
          bookName:  data.bookName,
          chapter:   data.chapter,
          verseFrom: data.verseFrom,
          verseTo:   data.verseTo,
        });
      }
    }
  }, [loading, synced, data]);

  const handleDayToggle = async (days: number[]) => {
    setSaving(true);
    try {
      await save({ ...data, visibleDays: days }, date);
      showToast.success("Hari tampil diperbarui.");
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await clear(date);
      setSel(emptySelection());
      showToast.success("Bahan Khotbah berhasil direset.");
    } catch { showToast.error("Gagal mereset. Coba lagi."); }
    setResetting(false);
  };

  const handleSave = async () => {
    if (!sel.bookSlug) { showToast.error("Pilih ayat Bahan Khotbah terlebih dahulu."); return; }
    setSaving(true);
    try {
      const next: BahanKhotbah = {
        bookSlug:    sel.bookSlug,
        bookName:    sel.bookName,
        chapter:     sel.chapter,
        verseFrom:   sel.verseFrom,
        verseTo:     sel.verseTo,
        reference:   refLabel(sel),
        visible:     isVisible,
        visibleDays: visibleDays,
      };
      await save(next, date);
      setSaved(true); showToast.success("Bahan Khotbah disimpan.");
      setTimeout(() => setSaved(false), 2500);
    } catch { showToast.error("Gagal menyimpan. Coba lagi."); }
    setSaving(false);
  };

  const handleToggleVisible = async () => {
    const next = !isVisible;
    setSaving(true);
    try {
      await save({ ...data, visible: next }, date);
      showToast.success(next ? "Bahan Khotbah ditampilkan." : "Bahan Khotbah disembunyikan.");
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  if (loading) return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3 text-muted-foreground text-sm">
      <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--brand)" }} />
      Memuat Bahan Khotbah...
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-border"
        style={{ backgroundColor: "var(--brand-muted)" }}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <div>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
              Bahan Khotbah
            </p>
            {data.reference && (
              <p className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                {data.reference}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleVisible}
            disabled={saving}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-60 ${
              isVisible
                ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {isVisible ? <><Eye className="h-3 w-3" /> Tampil</> : <><EyeOff className="h-3 w-3" /> Hidden</>}
          </button>
          <button
            onClick={handleReset}
            disabled={saving || resetting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-800 dark:text-red-400 disabled:opacity-60 transition-all"
          >
            {resetting ? <><Loader2 className="h-3 w-3 animate-spin" /> Reset...</> : <><RotateCcw className="h-3 w-3" /> Reset</>}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-60 hover:opacity-90"
            style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
          >
            {saving
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>
              : saved
              ? <><Check className="h-3 w-3" /> Tersimpan ✓</>
              : <><Save className="h-3 w-3" /> Simpan</>}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 space-y-5">

        {/* Warning: hidden */}
        {!isVisible && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <EyeOff className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Section ini <strong>disembunyikan</strong> dari halaman publik.
            </p>
          </div>
        )}

        {/* Hari Tampil */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
              Hari Tampil
            </p>
          </div>
          <DayOfWeekPicker visibleDays={visibleDays} onChange={handleDayToggle} disabled={saving} />
        </div>

        {/* Pilih Ayat */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
              Pilih Ayat
            </p>
          </div>
          <BibleVerseSelector value={sel} onChange={(v) => setSel(v)} showPreview />
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
interface MazmurKhotbahSectionProps {
  onDateChange?: (date: Date) => void;
}

export function MazmurKhotbahSection({ onDateChange }: MazmurKhotbahSectionProps = {}) {
  const { date: globalDate } = useDate();
  const [targetDate, setTargetDate] = useState<Date>(globalDate ?? new Date());

  const { data: mazmurData } = useMazmurMinggu(targetDate);
  const previewVisibleDays: number[] = mazmurData.visibleDays ?? [0];

  const handleDateChange = (d: Date) => {
    setTargetDate(d);
    onDateChange?.(d);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--gold)" }}>
          Pilih Minggu
        </p>
        <WeekPicker date={targetDate} onChange={handleDateChange} visibleDays={previewVisibleDays} />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Klik tombol ↕ untuk lihat kalender bulan penuh (persiapan hari raya).
        </p>
      </div>

      <MazmurSubSection       date={targetDate} />
      <BahanKhotbahSubSection date={targetDate} />
    </div>
  );
}