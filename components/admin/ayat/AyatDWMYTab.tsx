"use client";

import React, { useState, useEffect } from "react";
import { useAyatKhusus, type AyatKhusus } from "@/lib/hooks/useFirestoreData";
import { BibleVerseSelector, type VerseSelection, emptySelection } from "./BibleVerseSelector";
import { Loader2, Save, Calendar, Star, Sun, CalendarDays, Plus, Trash2 } from "lucide-react";
import { showToast } from "@/lib/utils/toast";
import { formatRef } from "@/lib/bible-books";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BULAN_NAMES = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
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

// ─── Types ────────────────────────────────────────────────────────────────────
type DWMYForm = {
  tahunYear:   number;
  tahunSel:    VerseSelection;
  mingguDate:  string;
  mingguSel:   VerseSelection;
  bulanSels:   Record<string, VerseSelection>;
  // Harian: date-linked { "YYYY-MM-DD": VerseSelection }
  harianEntries: { date: string; sel: VerseSelection }[];
};

const DEFAULT_BULAN_SELS: Record<string, VerseSelection> = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [String(i + 1), emptySelection()])
);

function initForm(data: AyatKhusus): DWMYForm {
  return {
    tahunYear:    data.tahun?.year ?? new Date().getFullYear(),
    tahunSel:     emptySelection(),
    mingguDate:   data.minggu?.date ?? "",
    mingguSel:    emptySelection(),
    bulanSels:    DEFAULT_BULAN_SELS,
    harianEntries: [], // user tambah entry baru
  };
}

function selToRef(sel: VerseSelection): string {
  if (!sel.bookSlug) return "";
  return formatRef(sel.bookName, sel.chapter, sel.verseFrom, sel.verseTo);
}

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

// Today formatted as YYYY-MM-DD
const todayISO = new Date().toISOString().split("T")[0];

// ─── Component ────────────────────────────────────────────────────────────────
export function AyatDWMYTab() {
  const { data, loading, save } = useAyatKhusus();
  const [form,   setForm]   = useState<DWMYForm>(() => initForm({} as AyatKhusus));
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [tahunPreview,  setTahunPreview]  = useState<string | null>(null);
  const [mingguPreview, setMingguPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) setForm(initForm(data));
  }, [loading, data]);

  const handleSave = async () => {
    setSaving(true);

    const tahunText  = tahunPreview  ?? await fetchVerseText(form.tahunSel);
    const mingguText = mingguPreview ?? await fetchVerseText(form.mingguSel);

    // Bulan
    const bulanEntries = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const key  = String(i + 1);
        const sel  = form.bulanSels[key];
        const text = await fetchVerseText(sel);
        return [key, { reference: selToRef(sel), text }] as [string, { reference: string; text: string }];
      })
    );

    // Harian — merge existing + new entries
    const existingHarian = data.harian ?? {};
    const newHarian: Record<string, { reference: string; text: string }> = { ...existingHarian };

    await Promise.all(
      form.harianEntries.map(async ({ date, sel }) => {
        if (!date || !sel.bookSlug) return;
        const text = await fetchVerseText(sel);
        newHarian[date] = { reference: selToRef(sel), text };
      })
    );

    const next: AyatKhusus = {
      tahun:  form.tahunSel.bookSlug  ? { year: form.tahunYear, reference: selToRef(form.tahunSel), text: tahunText }   : data.tahun,
      minggu: form.mingguSel.bookSlug ? { date: form.mingguDate, reference: selToRef(form.mingguSel), text: mingguText } : data.minggu,
      bulan:  {
        ...data.bulan,
        ...Object.fromEntries(bulanEntries.filter(([, v]) => v.reference)),
      },
      harian: newHarian,
    };

    try {
      await save(next);
      showToast.success("Data DWMY berhasil disimpan.");
      setForm((f) => ({ ...f, harianEntries: [] })); // clear new entries
    } catch {
      showToast.error("Gagal menyimpan DWMY. Coba lagi.");
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addHarianEntry = () =>
    setForm((f) => ({ ...f, harianEntries: [...f.harianEntries, { date: todayISO, sel: emptySelection() }] }));

  const removeHarianEntry = (i: number) =>
    setForm((f) => ({ ...f, harianEntries: f.harianEntries.filter((_, idx) => idx !== i) }));

  const deleteExistingHarian = async (dateKey: string) => {
    const nextHarian = { ...data.harian };
    delete nextHarian[dateKey];
    try {
      await save({ ...data, harian: nextHarian });
      showToast.success(`Ayat tanggal ${dateKey} dihapus.`);
    } catch {
      showToast.error("Gagal menghapus.");
    }
  };

  const SaveBtn = () => (
    <button
      onClick={handleSave}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
      style={{ backgroundColor: "var(--brand)" }}
    >
      {saving
        ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
        : saved
        ? <><Save className="h-4 w-4" /> Tersimpan ✓</>
        :         <><Save className="h-4 w-4" /> Simpan Semua</>}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-10">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
      </div>
    );
  }

  // Harian tersimpan sorted by date
  const harianSorted = Object.entries(data.harian ?? {}).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          Pilih ayat untuk tahun, minggu, setiap tanggal harian, dan 12 bulan langsung dari Alkitab.
        </p>
        <SaveBtn />
      </div>

      <div className="space-y-5">

        {/* ── Ayat Tahun & Minggu ─────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
            <Star className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
              Ayat Tahun &amp; Minggu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Kiri: Ayat Tahun */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>Ayat Tahun</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Tahun</label>
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
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Tersimpan</p>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{data.tahun.reference}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{data.tahun.text}</p>
                </div>
              )}
            </div>

            {/* Kanan: Ayat Minggu */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sun className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>Ayat Minggu Ini</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Tanggal Minggu</label>
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
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Tersimpan</p>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{data.minggu.reference}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{data.minggu.text}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Ayat Harian (Date-linked) ───────────────────────────────────── */}
        <SectionCard icon={CalendarDays} title="Ayat Harian — Per Tanggal">
          <p className="text-xs text-muted-foreground">
            Setiap tanggal memiliki ayat berbeda. Pengguna akan melihat ayat sesuai tanggal yang dipilih di kalender.
          </p>

          {/* Tersimpan */}
          {harianSorted.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                Ayat Tersimpan ({harianSorted.length} tanggal)
              </p>
              <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                {harianSorted.map(([dateKey, val]) => (
                  <div key={dateKey} className="flex items-start gap-3 px-4 py-3">
                    <div className="shrink-0 min-w-[7rem]">
                      <p className="text-xs font-bold" style={{ color: "var(--brand)" }}>{dateKey}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--brand)" }}>{val.reference}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{val.text}</p>
                    </div>
                    <button
                      onClick={() => deleteExistingHarian(dateKey)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tambah entries baru */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                Tambah Ayat Baru
              </p>
              <button
                onClick={addHarianEntry}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
                style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Tanggal
              </button>
            </div>

            {form.harianEntries.map(({ date, sel }, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                      Tanggal
                    </label>
                  </div>
                  <button
                    onClick={() => removeHarianEntry(i)}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors"
                  >
                    Hapus
                  </button>
                </div>

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      harianEntries: f.harianEntries.map((entry, idx) =>
                        idx === i ? { ...entry, date: e.target.value } : entry
                      ),
                    }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
                />

                <BibleVerseSelector
                  value={sel}
                  onChange={(newSel) =>
                    setForm((f) => ({
                      ...f,
                      harianEntries: f.harianEntries.map((entry, idx) =>
                        idx === i ? { ...entry, sel: newSel } : entry
                      ),
                    }))
                  }
                  showPreview
                />
              </div>
            ))}

            {form.harianEntries.length === 0 && harianSorted.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                Belum ada ayat harian. Klik "Tambah Tanggal" untuk mulai.
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Ayat 12 Bulan ───────────────────────────────────────────────── */}
        <SectionCard icon={Calendar} title="Ayat 12 Bulan">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BULAN_NAMES.map((name, idx) => {
              const key   = String(idx + 1);
              const sel   = form.bulanSels[key] ?? emptySelection();
              const saved = data.bulan?.[key];
              return (
                <div key={key} className="border border-border rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                    {name}
                  </p>
                  {saved && !sel.bookSlug && (
                    <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{saved.reference}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{saved.text}</p>
                    </div>
                  )}
                  <BibleVerseSelector
                    value={sel}
                    onChange={(newSel) =>
                      setForm((f) => ({ ...f, bulanSels: { ...f.bulanSels, [key]: newSel } }))
                    }
                    showPreview
                    compact
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
