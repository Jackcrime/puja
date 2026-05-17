"use client";

import React, { useState } from "react";
import {
  useMazmurMinggu, useBahanKhotbah,
  type MazmurMinggu, type BahanKhotbah,
} from "@/lib/hooks/useFirestoreData";
import {
  BibleVerseSelector, emptySelection, refLabel,
  type VerseSelection,
} from "@/components/admin/ayat/BibleVerseSelector";
import { selToRef } from "@/lib/utils/adminAyat";
import { showToast } from "@/lib/utils/toast";
import {
  BookMarked, BookOpen, CalendarDays,
  Check, CheckCircle2 as CheckCircle2Icon, Eye, EyeOff, Loader2, Save, RotateCcw,
} from "lucide-react";
import { FieldLabel, SectionCard, SaveButton } from "./shared";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function getSunday(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

// ─── Sub-section: Mazmur ──────────────────────────────────────────────────────
function MazmurSubSection({ date }: { date: Date }) {
  const { data, loading, save, clear } = useMazmurMinggu(date);
  const [sel,           setSel]           = useState<VerseSelection>(emptySelection());
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [resetting,     setResetting]     = useState(false);
  const [showPreview,   setShowPreview]   = useState(false);
  const [previewVerses, setPreviewVerses] = useState<{ number: string; text: string }[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Visible state (default true jika belum ada data)
  const isVisible = data.visible !== false;

  const handleSelChange = async (newSel: VerseSelection) => {
    setSel(newSel);
    setPreviewVerses([]);
    if (!newSel.bookSlug || !newSel.chapter || !newSel.verseFrom) return;
    setLoadingVerses(true);
    try {
      const res  = await fetch(`/api/bible?book=${newSel.bookSlug}&chapter=${newSel.chapter}&from=${newSel.verseFrom}&to=${newSel.verseTo}`);
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

  const handleReset = async () => {
    setResetting(true);
    try {
      await clear(date);
      // Reset ke selection awal dengan bookSlug "mazmur" agar field tidak terkunci (lockedBook)
      setSel({ bookSlug: "mazmur", bookName: "Mazmur", chapter: 1, verseFrom: 1, verseTo: 1 });
      setPreviewVerses([]);
      showToast.success("Mazmur Minggu berhasil direset.");
    } catch { showToast.error("Gagal mereset. Coba lagi."); }
    setResetting(false);
  };

  const handleSave = async () => {
    if (!sel.bookSlug) { showToast.error("Pilih ayat Mazmur terlebih dahulu."); return; }
    setSaving(true);
    try {
      const res    = await fetch(`/api/bible?book=${sel.bookSlug}&chapter=${sel.chapter}&from=${sel.verseFrom}&to=${sel.verseTo}`);
      const json   = await res.json();
      const verses: MazmurMinggu["verses"] = res.ok && !json.error
        ? (json.verses as { verse: number; text: string }[]).map((v) => ({ number: `${sel.chapter}:${v.verse}`, text: v.text }))
        : [];
      await save({ reference: selToRef(sel), title: "", verses, visible: isVisible }, date);
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
          {/* Visible toggle */}
          <button
            onClick={handleToggleVisible}
            disabled={saving}
            title={isVisible ? "Sembunyikan dari halaman Puji & Janji" : "Tampilkan di halaman Puji & Janji"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60 ${
              isVisible
                ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {isVisible ? <><Eye className="h-3 w-3" /> Tampil</> : <><EyeOff className="h-3 w-3" /> Disembunyikan</>}
          </button>
          <button onClick={handleReset} disabled={saving || resetting}
            title="Hapus data Mazmur minggu ini"
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
        {/* Status visible */}
        {!isVisible && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <EyeOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Section ini <strong>disembunyikan</strong> di halaman Puji &amp; Janji. Klik tombol &ldquo;Disembunyikan&rdquo; untuk menampilkan kembali.
            </p>
          </div>
        )}

        {/* Aktif saat ini */}
        {data.reference && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
            <BookMarked className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Aktif minggu ini</p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--brand)" }}>{data.reference}</p>
            </div>
          </div>
        )}

        {/* Selector — locked ke Mazmur */}
        <div>
          <FieldLabel>Pilih Mazmur Minggu</FieldLabel>
          <BibleVerseSelector value={sel} onChange={handleSelChange} showPreview lockedBook="mazmur" />
          <p className="text-[10px] text-muted-foreground mt-2">Teks otomatis diambil dari API Alkitab saat disimpan.</p>

          {showPreview && (
            <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
                Pratinjau — {selToRef(sel)}
              </p>
              {loadingVerses ? (
                <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat ayat...</div>
              ) : previewVerses.length > 0 ? (
                <div className="space-y-2">
                  {previewVerses.map((v, i) => (
                    <p key={i} className="text-sm leading-relaxed">
                      <span className="font-bold text-xs mr-2" style={{ color: "var(--brand)" }}>{v.number}</span>
                      {v.text}
                    </p>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">Ayat tidak ditemukan.</p>}
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
  const [sel,       setSel]       = useState<VerseSelection | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [resetting, setResetting] = useState(false);

  const isVisible = data.visible !== false;

  const current: VerseSelection = sel ?? (data.reference
    ? { bookSlug: "", bookName: "", chapter: 0, verseFrom: 0, verseTo: 0 }
    : emptySelection()
  );

  const handleReset = async () => {
    setResetting(true);
    try {
      await clear(date);
      setSel(null);
      showToast.success("Bahan Khotbah berhasil direset.");
    } catch { showToast.error("Gagal mereset. Coba lagi."); }
    setResetting(false);
  };

  const handleSave = async () => {
    if (!sel?.bookSlug) { showToast.error("Pilih ayat Bahan Khotbah terlebih dahulu."); return; }
    setSaving(true);
    try {
      const next: BahanKhotbah = {
        bookSlug:  sel.bookSlug,
        bookName:  sel.bookName,
        chapter:   sel.chapter,
        verseFrom: sel.verseFrom,
        verseTo:   sel.verseTo,
        reference: refLabel(sel),
        visible:   isVisible,
        visibleFrom:  data.visibleFrom,
        visibleUntil: data.visibleUntil,
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

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground text-sm py-3"><Loader2 className="h-4 w-4 animate-spin" /> Memuat Bahan Khotbah...</div>;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Bahan Khotbah</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Visible toggle */}
          <button
            onClick={handleToggleVisible}
            disabled={saving}
            title={isVisible ? "Sembunyikan dari halaman Puji & Janji" : "Tampilkan di halaman Puji & Janji"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60 ${
              isVisible
                ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {isVisible ? <><Eye className="h-3 w-3" /> Tampil</> : <><EyeOff className="h-3 w-3" /> Disembunyikan</>}
          </button>
          <button onClick={handleReset} disabled={saving || resetting}
            title="Hapus data Bahan Khotbah minggu ini"
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
        {/* Status visible */}
        {!isVisible && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <EyeOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Section ini <strong>disembunyikan</strong> di halaman Puji &amp; Janji. Klik tombol &ldquo;Disembunyikan&rdquo; untuk menampilkan kembali.
            </p>
          </div>
        )}

        {/* Aktif saat ini */}
        {data.reference && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
            <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Aktif minggu ini</p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--brand)" }}>{data.reference}</p>
            </div>
          </div>
        )}

        <div>
          <FieldLabel>Pilih Ayat Bahan Khotbah</FieldLabel>
          <BibleVerseSelector value={current} onChange={(v) => setSel(v)} showPreview />
        </div>

        {/* ── Jadwal Tampil (date range) ── */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--brand)" }}>
              Jadwal Tampil di Halaman Publik
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Bahan khotbah hanya muncul dalam rentang tanggal ini. Kosongkan keduanya untuk tampil setiap hari.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
                Mulai Tampil
              </label>
              <input
                type="date"
                value={data.visibleFrom ?? ""}
                onChange={async (e) => {
                  await save({ ...data, visibleFrom: e.target.value || undefined }, date);
                }}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-1"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
                Selesai Tampil
              </label>
              <input
                type="date"
                value={data.visibleUntil ?? ""}
                onChange={async (e) => {
                  await save({ ...data, visibleUntil: e.target.value || undefined }, date);
                }}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-1"
              />
            </div>
          </div>
          {(data.visibleFrom || data.visibleUntil) && (
            <div className="flex items-center gap-2 text-[10px] text-green-700 dark:text-green-400">
              <CheckCircle2Icon className="h-3.5 w-3.5 shrink-0" />
              Tampil{data.visibleFrom ? ` dari ${data.visibleFrom}` : ""}{data.visibleUntil ? ` s/d ${data.visibleUntil}` : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Export: satu date picker, dua section ───────────────────────────────
interface MazmurKhotbahSectionProps {
  onDateChange?: (date: Date) => void;
}

export function MazmurKhotbahSection({ onDateChange }: MazmurKhotbahSectionProps = {}) {
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [calOpen,    setCalOpen]    = useState(false);
  const sundayLabel = format(getSunday(targetDate), "d MMMM yyyy", { locale: localeId });

  const handleDateSelect = (d: Date) => {
    setTargetDate(d);
    onDateChange?.(d);
    setCalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Date picker bersama */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--gold)" }}>
          Minggu / Tanggal
        </p>
        <Dialog open={calOpen} onOpenChange={setCalOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium hover:bg-muted transition-colors">
              <CalendarDays className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
              Minggu {sundayLabel}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-serif" style={{ color: "var(--brand)" }}>Pilih Minggu</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground px-1 mb-2">
              Mazmur dan Bahan Khotbah akan disimpan untuk Minggu di minggu yang dipilih.
            </p>
            <div className="flex justify-center p-4">
              <Calendar
                mode="single"
                selected={targetDate}
                onSelect={(d) => { if (d) handleDateSelect(d); }}
                className="rounded-lg border"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dua section di bawah, berbagi date yang sama */}
      <MazmurSubSection     date={targetDate} />
      <BahanKhotbahSubSection date={targetDate} />
    </div>
  );
}