"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAyatKhusus, type AyatKhusus }     from "@/lib/hooks/useSupabaseData";
import { BibleVerseSelector, type VerseSelection, emptySelection } from "./BibleVerseSelector";
import { showToast }                           from "@/lib/utils/toast";
import {
  Calendar, Star, Save, Loader2,
  Upload, Download, Info,
} from "lucide-react";
import { todayISO, BULAN_NAMES, selToRef, fetchVerseText, exportJSON } from "@/lib/utils/adminAyat";

// ─── Import Modals ────────────────────────────────────────────────────────────

interface BulanImportProps { onClose: () => void; onImport: (d: Record<string, { reference: string; text: string }>) => void; }
function BulanImportModal({ onClose, onImport }: BulanImportProps) {
  const [raw, setRaw] = useState(""); const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const EXAMPLE = JSON.stringify({
    "1":  { "reference": "Ulangan 6:5",    "text": "Kasihilah TUHAN, Allahmu..." },
    "12": { "reference": "Wahyu 21:5",     "text": "Lihatlah, Aku menjadikan segala sesuatu baru!" },
  }, null, 2);

  const parse = () => {
    setErr("");
    try {
      const obj = JSON.parse(raw);
      if (typeof obj !== "object" || Array.isArray(obj)) throw new Error("Harus berupa object JSON.");
      for (const [k, v] of Object.entries(obj)) {
        const n = Number(k);
        if (isNaN(n) || n < 1 || n > 12) throw new Error(`Key "${k}" bukan angka bulan 1–12.`);
        const e = v as any;
        if (!e?.reference || !e?.text) throw new Error(`Bulan ${k} harus punya "reference" dan "text".`);
      }
      onImport(obj as Record<string, { reference: string; text: string }>);
      onClose();
    } catch (e: any) { setErr(e.message ?? "JSON tidak valid."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>Import Ayat 12 Bulan (JSON)</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="h-3 w-3" style={{ color: "var(--brand)" }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
                Format — key = nomor bulan (1–12)
              </p>
            </div>
            <pre className="text-[11px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">{EXAMPLE}</pre>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-muted-foreground">Upload .json</label>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => setRaw(ev.target?.result as string ?? ""); r.readAsText(f); }}
            />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-xs border border-dashed border-border rounded-xl hover:bg-muted transition-colors"
              style={{ color: "var(--brand)" }}
            ><Upload className="h-3.5 w-3.5" /> Pilih file JSON</button>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-muted-foreground">Atau paste JSON</label>
            <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={6}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background focus:outline-none font-mono resize-none"
            />
          </div>
          {err && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition-colors">Batal</button>
            <button onClick={parse} disabled={!raw.trim()} className="px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: "var(--brand)" }}>Import</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TahunImportProps { onClose: () => void; onImport: (d: { year: number; reference: string; text: string }) => void; }
function TahunImportModal({ onClose, onImport }: TahunImportProps) {
  const [raw, setRaw] = useState(""); const [err, setErr] = useState("");
  const EXAMPLE = JSON.stringify({ "year": 2026, "reference": "Wahyu 21:5", "text": "Lihatlah, Aku menjadikan segala sesuatu baru!" }, null, 2);

  const parse = () => {
    setErr("");
    try {
      const obj = JSON.parse(raw) as any;
      if (!obj.year || !obj.reference || !obj.text) throw new Error("Harus punya \"year\", \"reference\", dan \"text\".");
      if (typeof obj.year !== "number") throw new Error("\"year\" harus angka.");
      onImport(obj); onClose();
    } catch (e: any) { setErr(e.message ?? "JSON tidak valid."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>Import Ayat Tahun (JSON)</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="h-3 w-3" style={{ color: "var(--brand)" }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>Format</p>
            </div>
            <pre className="text-[11px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">{EXAMPLE}</pre>
          </div>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={5}
            className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background focus:outline-none font-mono resize-none"
          />
          {err && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition-colors">Batal</button>
            <button onClick={parse} disabled={!raw.trim()} className="px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: "var(--brand)" }}>Import</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

type BulanSels = Record<string, VerseSelection>;

const DEFAULT_BULAN_SELS: BulanSels = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [String(i + 1), emptySelection()])
);

// ─── Main Component ───────────────────────────────────────────────────────────

export function AyatBulanTahunTab() {
  const { data, loading, save } = useAyatKhusus();

  const [tahunYear,  setTahunYear]  = useState(new Date().getFullYear());
  const [tahunSel,   setTahunSel]   = useState<VerseSelection>(emptySelection());
  const [tahunPrev,  setTahunPrev]  = useState<string | null>(null);
  const [bulanSels,  setBulanSels]  = useState<BulanSels>(DEFAULT_BULAN_SELS);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [showBulanImport, setShowBulanImport] = useState(false);
  const [showTahunImport, setShowTahunImport] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTahunYear(data.tahun?.year ?? new Date().getFullYear());
    }
  }, [loading, data]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);

    const tahunText = tahunPrev ?? await fetchVerseText(tahunSel);
    const bulanEntries = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const key = String(i + 1);
        const sel = bulanSels[key];
        const text = await fetchVerseText(sel);
        return [key, { reference: selToRef(sel), text }] as [string, { reference: string; text: string }];
      })
    );

    const next: AyatKhusus = {
      ...data,
      tahun: tahunSel.bookSlug
        ? { year: tahunYear, reference: selToRef(tahunSel), text: tahunText }
        : data.tahun,
      bulan: {
        ...data.bulan,
        ...Object.fromEntries(bulanEntries.filter(([, v]) => v.reference)),
      },
    };

    try {
      await save(next);
      showToast.success("Ayat Bulan & Tahun berhasil disimpan.");
      setTahunSel(emptySelection());
      setBulanSels(DEFAULT_BULAN_SELS);
    } catch {
      showToast.error("Gagal menyimpan. Coba lagi.");
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Import bulan ──────────────────────────────────────────────────────────

  const handleBulanImport = async (entries: Record<string, { reference: string; text: string }>) => {
    setSaving(true);
    try {
      await save({ ...data, bulan: { ...data.bulan, ...entries } });
      showToast.success(`${Object.keys(entries).length} ayat bulan diimport.`);
    } catch { showToast.error("Gagal mengimport."); }
    setSaving(false);
  };

  const handleTahunImport = async (entry: { year: number; reference: string; text: string }) => {
    setSaving(true);
    try {
      await save({ ...data, tahun: entry });
      setTahunYear(entry.year);
      showToast.success(`Ayat Tahun ${entry.year} diimport.`);
    } catch { showToast.error("Gagal mengimport."); }
    setSaving(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-10">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
      </div>
    );
  }

  const SaveBtn = () => (
    <button onClick={handleSave} disabled={saving}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
      style={{ backgroundColor: "var(--brand)" }}
    >
      {saving
        ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
        : saved ? <><Save className="h-4 w-4" /> Tersimpan ✓</>
        : <><Save className="h-4 w-4" /> Simpan Bulan &amp; Tahun</>}
    </button>
  );

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          Kelola ayat tahunan dan 12 bulan. Gunakan BibleVerseSelector atau import JSON.
        </p>
        <SaveBtn />
      </div>

      {/* ── Ayat Tahun ───────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Ayat Tahun</p>
          </div>
          <div className="flex items-center gap-2">
            {data.tahun && (
              <button
                onClick={() => exportJSON(data.tahun, `ayat-tahun-${todayISO()}.json`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
                style={{ color: "var(--brand)" }}
              >
                <Download className="h-3 w-3" /> Export
              </button>
            )}
            <button
              onClick={() => setShowTahunImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
              style={{ color: "var(--brand)" }}
            >
              <Upload className="h-3 w-3" /> Import
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Saved */}
          {data.tahun && !tahunSel.bookSlug && (
            <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--gold, #b8860b)" }}>
                Tersimpan — Tahun {data.tahun.year}
              </p>
              <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{data.tahun.reference}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{data.tahun.text}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold, #b8860b)" }}>Tahun</label>
            <input
              type="number" value={tahunYear}
              onChange={(e) => setTahunYear(Number(e.target.value))}
              className="w-28 px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
            />
          </div>

          <BibleVerseSelector
            value={tahunSel}
            onChange={setTahunSel}
            onPreview={(d) => setTahunPrev(d ? d.verses.map((v) => v.text).join(" ") : null)}
          />
        </div>
      </div>

      {/* ── Ayat 12 Bulan ────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Ayat 12 Bulan</p>
          </div>
          <div className="flex items-center gap-2">
            {data.bulan && (
              <button
                onClick={() => exportJSON(data.bulan, `ayat-bulan-${todayISO()}.json`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
                style={{ color: "var(--brand)" }}
              >
                <Download className="h-3 w-3" /> Export
              </button>
            )}
            <button
              onClick={() => setShowBulanImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
              style={{ color: "var(--brand)" }}
            >
              <Upload className="h-3 w-3" /> Import
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BULAN_NAMES.map((name, idx) => {
              const key  = String(idx + 1);
              const sel  = bulanSels[key] ?? emptySelection();
              const savedBulan = data.bulan?.[key];
              return (
                <div key={key} className="border border-border rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold, #b8860b)" }}>
                    {name}
                  </p>
                  {savedBulan && !sel.bookSlug && (
                    <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{savedBulan.reference}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{savedBulan.text}</p>
                    </div>
                  )}
                  <BibleVerseSelector
                    value={sel}
                    onChange={(newSel) => setBulanSels((b) => ({ ...b, [key]: newSel }))}
                    showPreview
                    compact
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <SaveBtn />
      </div>

      {showBulanImport && (
        <BulanImportModal onClose={() => setShowBulanImport(false)} onImport={handleBulanImport} />
      )}
      {showTahunImport && (
        <TahunImportModal onClose={() => setShowTahunImport(false)} onImport={handleTahunImport} />
      )}
    </div>
  );
}