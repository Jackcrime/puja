"use client";

import React, { useState } from "react";
import { useMazmurMinggu } from "@/lib/hooks/useFirestoreData";
import {
  BibleVerseSelector,
  type VerseSelection,
  emptySelection,
} from "@/components/admin/ayat/BibleVerseSelector";
import { showToast } from "@/lib/utils/toast";
import { BookMarked, Check, Eye, EyeOff, Loader2, Save, CalendarDays } from "lucide-react";
import { FieldLabel } from "./shared";
import { selToRef } from "@/lib/utils/adminAyat";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Dapatkan Minggu dari tanggal
function getSunday(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

export function MazmurMingguSection() {
  const [targetDate, setTargetDate]   = useState<Date>(new Date());
  const { data, loading, save }       = useMazmurMinggu(targetDate);
  const [sel,         setSel]         = useState<VerseSelection>(emptySelection());
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVerses, setPreviewVerses] = useState<{ number: string; text: string }[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [calOpen,     setCalOpen]     = useState(false);

  const sundayLabel = format(getSunday(targetDate), "d MMMM yyyy", { locale: localeId });


  // Ambil ayat preview ketika selector berubah
  const handleSelChange = async (newSel: VerseSelection) => {
    setSel(newSel);
    if (!newSel.bookSlug || !newSel.chapter || !newSel.verseFrom) {
      setPreviewVerses([]);
      return;
    }
    setLoadingVerses(true);
    try {
      const res  = await fetch(
        `/api/bible?book=${newSel.bookSlug}&chapter=${newSel.chapter}&from=${newSel.verseFrom}&to=${newSel.verseTo}`
      );
      const json = await res.json();
      if (res.ok && !json.error) {
        setPreviewVerses(
          (json.verses as { verse: number; text: string }[]).map((v) => ({
            number: `${newSel.chapter}:${v.verse}`,
            text: v.text,
          }))
        );
      }
    } catch {}
    setLoadingVerses(false);
  };

  const handleSave = async () => {
    if (!sel.bookSlug) {
      showToast.error("Pilih ayat terlebih dahulu.");
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch(
        `/api/bible?book=${sel.bookSlug}&chapter=${sel.chapter}&from=${sel.verseFrom}&to=${sel.verseTo}`
      );
      const json = await res.json();
      const verses: { number: string; text: string }[] =
        res.ok && !json.error
          ? (json.verses as { verse: number; text: string }[]).map((v) => ({
              number: `${sel.chapter}:${v.verse}`,
              text: v.text,
            }))
          : [];

      await save({ reference: selToRef(sel), title: data.title ?? "", verses }, targetDate);
      showToast.success("Mazmur Minggu berhasil disimpan.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      showToast.error("Gagal menyimpan. Coba lagi.");
    }
    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat Mazmur Minggu...
      </div>
    );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-border"
        style={{ backgroundColor: "var(--brand-muted)" }}
      >
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
            Mazmur Minggu
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
        >
          {saving ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>
          ) : saved ? (
            <><Check className="h-3 w-3" /> Tersimpan ✓</>
          ) : (
            <><Save className="h-3 w-3" /> Simpan</>
          )}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Pilih Minggu */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--gold)" }}>
            Minggu / Tanggal
          </p>
          <Dialog open={calOpen} onOpenChange={setCalOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                <CalendarDays className="h-4 w-4" />
                Minggu {sundayLabel}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif" style={{ color: "var(--brand)" }}>
                  Pilih Minggu
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground px-1">Data akan disimpan untuk Minggu di minggu yang dipilih.</p>
              <div className="flex justify-center p-4">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={(d) => { if (d) { setTargetDate(d); } setCalOpen(false); }}
                  className="rounded-lg border"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Aktif saat ini */}
        {data.reference && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
            <BookMarked className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                Aktif saat ini
              </p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--brand)" }}>
                {data.reference}
              </p>
            </div>
          </div>
        )}

        {/* Selector */}
        <div>
          <FieldLabel>Pilih Mazmur Minggu</FieldLabel>
          <BibleVerseSelector value={sel} onChange={handleSelChange} showPreview />
          <p className="text-[10px] text-muted-foreground mt-2">
            Pilih kitab, pasal, dan ayat — teks otomatis diambil dari API Alkitab saat disimpan.
          </p>

          {/* Tombol preview */}
          {sel.bookSlug && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border hover:bg-muted transition-colors"
              style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
            >
              {showPreview ? <><EyeOff className="h-3.5 w-3.5" /> Tutup Preview</> : <><Eye className="h-3.5 w-3.5" /> Preview Ayat</>}
            </button>
          )}

          {/* Live preview ayat */}
          {showPreview && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
                Pratinjau — {selToRef(sel)}
              </p>
              {loadingVerses ? (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat ayat...
                </div>
              ) : previewVerses.length > 0 ? (
                <div className="space-y-2">
                  {previewVerses.map((v, i) => (
                    <p key={i} className="text-sm leading-relaxed">
                      <span className="font-bold text-xs mr-2" style={{ color: "var(--brand)" }}>
                        {v.number}
                      </span>
                      {v.text}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Ayat tidak ditemukan.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}