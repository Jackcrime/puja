"use client";

import React, { useState, useEffect } from "react";
import { useAyatKhusus, type AyatKhusus } from "@/lib/hooks/useFirestoreData";
import { BibleVerseSelector, type VerseSelection, refLabel, emptySelection } from "./BibleVerseSelector";
import { Loader2, Save, Calendar, Star, Sun, CalendarDays } from "lucide-react";
import { formatRef } from "@/lib/bible-books";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BULAN_NAMES = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
        <Icon className="h-4 w-4" style={{ color: "var(--brand)" }} />
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function parseToSelection(reference?: string): VerseSelection {
  // Kalau punya slug tersimpan bisa di-restore, tapi fallback ke empty
  return emptySelection();
}

// Konversi ayat_khusus ke VerseSelection per field
type DWMYForm = {
  tahunYear:   number;
  tahunSel:    VerseSelection;
  mingguDate:  string;
  mingguSel:   VerseSelection;
  harianSels:  VerseSelection[];  // pool hari (DWMY versi D)
  bulanSels:   Record<string, VerseSelection>; // key "1"–"12"
};

const DEFAULT_BULAN_SELS: Record<string, VerseSelection> = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [String(i + 1), emptySelection()])
);

function initForm(data: AyatKhusus): DWMYForm {
  return {
    tahunYear:  data.tahun?.year ?? new Date().getFullYear(),
    tahunSel:   emptySelection(), // user pilih ulang lewat selector
    mingguDate: data.minggu?.date ?? "",
    mingguSel:  emptySelection(),
    harianSels: data.harian?.length
      ? data.harian.map(() => emptySelection())
      : [],
    bulanSels:  DEFAULT_BULAN_SELS,
  };
}

// Konversi VerseSelection ke objek ayat (reference string saja, text dari API)
function selToRef(sel: VerseSelection): string {
  if (!sel.bookSlug) return "";
  return formatRef(sel.bookName, sel.chapter, sel.verseFrom, sel.verseTo);
}

// ─── Preview text fetcher ─────────────────────────────────────────────────────
async function fetchVerseText(sel: VerseSelection): Promise<string> {
  if (!sel.bookSlug) return "";
  try {
    const url = `/api/bible?book=${sel.bookSlug}&chapter=${sel.chapter}&from=${sel.verseFrom}&to=${sel.verseTo}`;
    const res  = await fetch(url);
    const json = await res.json();
    if (!res.ok || json.error) return "";
    return (json.verses as { verse: number; text: string }[]).map((v) => v.text).join(" ");
  } catch { return ""; }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AyatDWMYTab() {
  const { data, loading, save } = useAyatKhusus();
  const [form,   setForm]   = useState<DWMYForm>(() => initForm({} as AyatKhusus));
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Preview states per section
  const [tahunPreview,  setTahunPreview]  = useState<string | null>(null);
  const [mingguPreview, setMingguPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) setForm(initForm(data));
  }, [loading, data]);

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);

    // Fetch texts from API for each selection
    const tahunText  = tahunPreview  ?? await fetchVerseText(form.tahunSel);
    const mingguText = mingguPreview ?? await fetchVerseText(form.mingguSel);

    // Bulan texts
    const bulanEntries = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const key = String(i + 1);
        const sel = form.bulanSels[key];
        const text = await fetchVerseText(sel);
        return [key, { reference: selToRef(sel), text }] as [string, { reference: string; text: string }];
      })
    );

    // Harian texts
    const harianItems = await Promise.all(
      form.harianSels.map(async (sel) => ({
        reference: selToRef(sel),
        text:      await fetchVerseText(sel),
      }))
    );

    const next: AyatKhusus = {
      tahun:  { year: form.tahunYear,  reference: selToRef(form.tahunSel),  text: tahunText  },
      minggu: { date: form.mingguDate, reference: selToRef(form.mingguSel), text: mingguText },
      bulan:  Object.fromEntries(bulanEntries.filter(([, v]) => v.reference)),
      harian: harianItems.filter((h) => h.reference),
    };

    await save(next);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const SaveBtn = () => (
    <button
      onClick={handleSave}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
      style={{ backgroundColor: "var(--brand)" }}
    >
      {saving  ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan & Mengambil Teks...</>
       : saved  ? <><Save className="h-4 w-4" /> Tersimpan ✓</>
       :          <><Save className="h-4 w-4" /> Simpan Semua</>}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-10">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          Pilih ayat untuk tahun, minggu, hari, dan 12 bulan langsung dari Alkitab.
        </p>
        <SaveBtn />
      </div>

      <div className="space-y-5">

        {/* ── Ayat Tahun & Minggu (satu card, dua kolom) ─────────────────────── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
            <Star className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
              Ayat Tahun &amp; Minggu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">

            {/* ── Kiri: Ayat Tahun ───────────────────────────────────────────── */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                  Ayat Tahun
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
                  Tahun
                </label>
                <input
                  type="number"
                  value={form.tahunYear}
                  onChange={(e) => setForm((f) => ({ ...f, tahunYear: Number(e.target.value) }))}
                  className="w-28 px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
                />
              </div>

              <BibleVerseSelector
                value={form.tahunSel}
                onChange={(sel) => setForm((f) => ({ ...f, tahunSel: sel }))}
                onPreview={(d) => setTahunPreview(d ? d.verses.map((v) => v.text).join(" ") : null)}
              />

              {data.tahun?.reference && !form.tahunSel.bookSlug && (
                <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>
                    Tersimpan saat ini
                  </p>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{data.tahun.reference}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{data.tahun.text}</p>
                </div>
              )}
            </div>

            {/* ── Kanan: Ayat Minggu ─────────────────────────────────────────── */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sun className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                  Ayat Minggu Ini
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
                  Tanggal Minggu (opsional)
                </label>
                <input
                  type="date"
                  value={form.mingguDate}
                  onChange={(e) => setForm((f) => ({ ...f, mingguDate: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
                />
              </div>

              <BibleVerseSelector
                value={form.mingguSel}
                onChange={(sel) => setForm((f) => ({ ...f, mingguSel: sel }))}
                onPreview={(d) => setMingguPreview(d ? d.verses.map((v) => v.text).join(" ") : null)}
              />

              {data.minggu?.reference && !form.mingguSel.bookSlug && (
                <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>
                    Tersimpan saat ini
                  </p>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{data.minggu.reference}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{data.minggu.text}</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Ayat Harian (Pool D) ────────────────────────────────────────────── */}
        <SectionCard icon={CalendarDays} title={`Ayat Harian — Pool (${form.harianSels.length} ayat)`}>
          <p className="text-xs text-muted-foreground">
            Ayat dipilih otomatis berdasarkan hari dalam setahun. Tambah ayat ke pool untuk variasi lebih.
          </p>

          {/* Ayat yang sudah tersimpan */}
          {data.harian && data.harian.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                Pool tersimpan ({data.harian.length} ayat)
              </p>
              {data.harian.map((h, i) => (
                <div key={i} className="flex items-start gap-3 border border-border rounded-xl px-4 py-3 bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{h.reference}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{h.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tambah ayat baru ke pool */}
          <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
              Tambah Ayat ke Pool
            </p>
            <BibleVerseSelector
              value={form.harianSels[form.harianSels.length] ?? emptySelection()}
              onChange={(sel) => {
                // Tambah ke array kalau belum ada
                const copy = [...form.harianSels];
                copy[copy.length] = sel;
                setForm((f) => ({ ...f, harianSels: copy }));
              }}
              showPreview={true}
            />
            <button
              onClick={() => setForm((f) => ({ ...f, harianSels: [...f.harianSels, emptySelection()] }))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
              style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
            >
              + Slot Ayat Baru
            </button>
          </div>

          {form.harianSels.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                Ayat Baru ({form.harianSels.length})
              </p>
              {form.harianSels.map((sel, i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">Ayat #{i + 1}</p>
                    <button
                      onClick={() => setForm((f) => ({ ...f, harianSels: f.harianSels.filter((_, idx) => idx !== i) }))}
                      className="text-xs text-red-500 hover:text-red-600 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                  <BibleVerseSelector
                    value={sel}
                    onChange={(newSel) =>
                      setForm((f) => ({
                        ...f,
                        harianSels: f.harianSels.map((s, idx) => idx === i ? newSel : s),
                      }))
                    }
                    showPreview={true}
                  />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Ayat 12 Bulan ───────────────────────────────────────────────────── */}
        <SectionCard icon={Calendar} title="Ayat 12 Bulan">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BULAN_NAMES.map((name, idx) => {
              const key     = String(idx + 1);
              const sel     = form.bulanSels[key] ?? emptySelection();
              const saved   = data.bulan?.[key];
              return (
                <div key={key} className="border border-border rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                    {name}
                  </p>

                  {/* Tampilkan tersimpan */}
                  {saved && !sel.bookSlug && (
                    <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{saved.reference}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{saved.text}</p>
                    </div>
                  )}

                  <BibleVerseSelector
                    value={sel}
                    onChange={(newSel) =>
                      setForm((f) => ({
                        ...f,
                        bulanSels: { ...f.bulanSels, [key]: newSel },
                      }))
                    }
                    showPreview={true}
                    compact={true}
                  />
                </div>
              );
            })}
          </div>
        </SectionCard>

      </div>

      <div className="mt-6 flex justify-end">
        <SaveBtn />
      </div>
    </div>
  );
}