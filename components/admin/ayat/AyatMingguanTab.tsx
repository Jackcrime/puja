"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAyatKhusus, useMazmurMinggu } from "@/lib/hooks/useFirestoreData";
import { BibleVerseSelector, type VerseSelection, emptySelection } from "./BibleVerseSelector";
import { showToast }                from "@/lib/utils/toast";
import {
  Sun, Plus, Trash2, Save, Loader2,
  Upload, Download, Calendar, Info, BookMarked,
  FileJson, Check, AlertCircle, Heart,
} from "lucide-react";
import { formatRef } from "@/lib/bible-books";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().split("T")[0]; }

/** Cari tanggal Minggu terdekat (hari ini jika sudah Minggu) */
function nearestSunday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day); // mundur ke Minggu
  return d.toISOString().split("T")[0];
}

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${day} ${months[Number(m) - 1]} ${y}`;
}

function selToRef(sel: VerseSelection) {
  if (!sel.bookSlug) return "";
  return formatRef(sel.bookName, sel.chapter, sel.verseFrom, sel.verseTo);
}

async function fetchVerseText(sel: VerseSelection): Promise<string> {
  if (!sel.bookSlug) return "";
  try {
    const res  = await fetch(`/api/bible?book=${sel.bookSlug}&chapter=${sel.chapter}&from=${sel.verseFrom}&to=${sel.verseTo}`);
    const json = await res.json();
    if (!res.ok || json.error) return "";
    return (json.verses as { verse: number; text: string }[]).map((v) => v.text).join(" ");
  } catch { return ""; }
}

function exportJSON(data: Record<string, { reference: string; text: string }>, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}


// ─── Mazmur Minggu Section ────────────────────────────────────────────────────

function MazmurMingguSection() {
  const { data, loading, save } = useMazmurMinggu();
  const [form,   setForm]   = useState<typeof data | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const current = form ?? data;
  const set = (key: keyof typeof data, value: any) =>
    setForm((f) => ({ ...(f ?? data), [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(current);
      showToast.success("Mazmur Minggu berhasil disimpan.");
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateVerse = (i: number, key: "number" | "text", val: string) =>
    set("verses", current.verses.map((v, idx) => idx === i ? { ...v, [key]: val } : v));

  const addVerse = () =>
    set("verses", [...current.verses, { number: "", text: "" }]);

  const removeVerse = (i: number) =>
    set("verses", current.verses.filter((_, idx) => idx !== i));

  if (loading) return (
    <div className="flex items-center gap-3 text-muted-foreground py-6">
      <Loader2 className="h-4 w-4 animate-spin" /> Memuat Mazmur Minggu...
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Mazmur Minggu</p>
        </div>
        <button
          onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
        >
          {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>
           : saved ? <><Save className="h-3 w-3" /> Tersimpan ✓</>
           :          <><Save className="h-3 w-3" /> Simpan</>}
        </button>
      </div>
      <div className="p-5 space-y-4">
        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold, #b8860b)" }}>Referensi</label>
            <input
              value={current.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="mis. Mazmur 98:1–9"
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold, #b8860b)" }}>Judul</label>
            <input
              value={current.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Judul perikop"
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
            />
          </div>
        </div>

        {/* Verses */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold, #b8860b)" }}>
              Ayat-ayat ({current.verses.length})
            </label>
            <button onClick={addVerse}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border hover:bg-muted transition-colors"
              style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}>
              <Plus className="h-3 w-3" /> Tambah Ayat
            </button>
          </div>
          <div className="space-y-2">
            {current.verses.map((v, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  value={v.number}
                  onChange={(e) => updateVerse(i, "number", e.target.value)}
                  placeholder="98:1"
                  className="w-20 shrink-0 px-2.5 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none font-mono"
                />
                <input
                  value={v.text}
                  onChange={(e) => updateVerse(i, "text", e.target.value)}
                  placeholder="Teks ayat..."
                  className="flex-1 px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none"
                />
                <button onClick={() => removeVerse(i)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600 transition-colors shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

interface ImportModalProps {
  onClose:  () => void;
  onImport: (entries: Record<string, { reference: string; text: string }>) => void;
}

function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");
  const fileRef       = useRef<HTMLInputElement>(null);

  const EXAMPLE = JSON.stringify({
    "2026-06-01": { "reference": "Yohanes 15:5", "text": "Akulah pokok anggur dan kamulah ranting-rantingnya." },
    "2026-06-08": { "reference": "Mazmur 23:1", "text": "TUHAN adalah gembalaku, takkan kekurangan aku." },
  }, null, 2);

  const parse = () => {
    setErr("");
    try {
      const obj = JSON.parse(raw);
      if (typeof obj !== "object" || Array.isArray(obj)) throw new Error("Harus berupa object JSON.");
      for (const [k, v] of Object.entries(obj)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) throw new Error(`Key "${k}" bukan format YYYY-MM-DD.`);
        const e = v as any;
        if (!e?.reference || !e?.text) throw new Error(`Entry "${k}" harus punya "reference" dan "text".`);
      }
      onImport(obj as Record<string, { reference: string; text: string }>);
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "JSON tidak valid.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>Import Ayat Mingguan (JSON)</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="h-3 w-3" style={{ color: "var(--brand)" }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
                Format JSON — key = tanggal Minggu (YYYY-MM-DD)
              </p>
            </div>
            <pre className="text-[11px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">{EXAMPLE}</pre>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-muted-foreground">
              Upload file .json
            </label>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const reader = new FileReader();
                reader.onload = (ev) => setRaw(ev.target?.result as string ?? "");
                reader.readAsText(f);
              }}
            />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-xs border border-dashed border-border rounded-xl hover:bg-muted transition-colors"
              style={{ color: "var(--brand)" }}
            >
              <Upload className="h-3.5 w-3.5" /> Pilih file JSON
            </button>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-muted-foreground">Atau paste JSON</label>
            <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={6}
              placeholder={'{\n  "YYYY-MM-DD": { "reference": "...", "text": "..." }\n}'}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background focus:outline-none font-mono resize-none"
            />
          </div>
          {err && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition-colors">Batal</button>
            <button onClick={parse} disabled={!raw.trim()}
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: "var(--brand)" }}
            >Import</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface NewEntry { date: string; sel: VerseSelection; }

export function AyatMingguanTab() {
  const { data, loading, save } = useAyatKhusus();

  const [newEntries, setNewEntries] = useState<NewEntry[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [showImport, setShowImport] = useState(false);

  const today      = todayISO();
  const thisSunday = nearestSunday();

  const addEntry = () =>
    setNewEntries((e) => [...e, { date: thisSunday, sel: emptySelection() }]);

  const removeEntry = (i: number) =>
    setNewEntries((e) => e.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (newEntries.length === 0) { showToast.info("Tidak ada entry baru."); return; }
    setSaving(true);
    const existing = { ...(data.mingguan ?? {}) };
    await Promise.all(newEntries.map(async ({ date, sel }) => {
      if (!date || !sel.bookSlug) return;
      const text = await fetchVerseText(sel);
      existing[date] = { reference: selToRef(sel), text };
    }));
    try {
      await save({ ...data, mingguan: existing });
      showToast.success(`${newEntries.filter(e => e.sel.bookSlug && e.date).length} ayat mingguan berhasil disimpan.`);
      setNewEntries([]);
    } catch {
      showToast.error("Gagal menyimpan. Coba lagi.");
    }
    setSaving(false);
  };

  const handleDelete = async (dateKey: string) => {
    const next = { ...(data.mingguan ?? {}) };
    delete next[dateKey];
    try {
      await save({ ...data, mingguan: next });
      showToast.success(`Ayat minggu ${dateKey} dihapus.`);
    } catch {
      showToast.error("Gagal menghapus.");
    }
  };

  const handleImport = async (entries: Record<string, { reference: string; text: string }>) => {
    setSaving(true);
    const merged = { ...(data.mingguan ?? {}), ...entries };
    try {
      await save({ ...data, mingguan: merged });
      showToast.success(`${Object.keys(entries).length} ayat mingguan diimport.`);
    } catch {
      showToast.error("Gagal mengimport.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-10">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
      </div>
    );
  }

  const mingguanSorted = Object.entries(data.mingguan ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const currentWeek    = mingguanSorted.find(([k]) => k === thisSunday);

  return (
    <div className="space-y-5">

      {/* ── Mazmur Minggu ─────────────────────────────────────────────────────── */}
      <MazmurMingguSection />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Kelola ayat per Minggu. Minggu ini:{" "}
            <span className="font-semibold" style={{ color: "var(--brand)" }}>{fmtDate(thisSunday)}</span>
          </p>
          {currentWeek && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Ayat aktif minggu ini:{" "}
              <span className="font-semibold" style={{ color: "var(--brand)" }}>{currentWeek[1].reference}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {mingguanSorted.length > 0 && (
            <button
              onClick={() => exportJSON(data.mingguan!, `ayat-mingguan-${today}.json`)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
              style={{ color: "var(--brand)" }}
            >
              <Download className="h-3.5 w-3.5" /> Export JSON
            </button>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
            style={{ color: "var(--brand)" }}
          >
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </button>
        </div>
      </div>

      {/* Saved mingguan */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
              Tersimpan ({mingguanSorted.length} minggu)
            </p>
          </div>
        </div>

        {mingguanSorted.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Belum ada ayat mingguan tersimpan.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {mingguanSorted.map(([dateKey, val]) => {
              const isThis   = dateKey === thisSunday;
              const isFuture = dateKey > today;
              return (
                <div key={dateKey} className={`flex items-start gap-3 px-4 py-3 ${isThis ? "bg-brand-muted/30" : ""}`}>
                  <div className="shrink-0 w-28">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      isThis   ? "text-white"                    :
                      isFuture ? "bg-muted text-muted-foreground" :
                                 "bg-muted/50 text-muted-foreground/60"
                    }`} style={isThis ? { backgroundColor: "var(--brand)" } : {}}>
                      <Sun className="h-2.5 w-2.5" />
                      {isThis ? "Minggu Ini" : isFuture ? "Mendatang" : "Lalu"}
                    </div>
                    <p className="text-xs font-bold mt-1" style={{ color: isThis ? "var(--brand)" : undefined }}>{dateKey}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtDate(dateKey)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--brand)" }}>{val.reference}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{val.text}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(dateKey)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add new */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
              Tambah Ayat Mingguan
            </p>
          </div>
          <button onClick={addEntry}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
            style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Minggu
          </button>
        </div>
        <div className="p-5 space-y-4">
          {newEntries.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              Klik "Tambah Minggu" untuk menambah satu per satu, atau gunakan Import JSON.
            </div>
          ) : (
            newEntries.map(({ date, sel }, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--gold, #b8860b)" }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold, #b8860b)" }}>
                      Tanggal Minggu
                    </span>
                    {date === thisSunday && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-bold" style={{ backgroundColor: "var(--brand)" }}>
                        Minggu Ini
                      </span>
                    )}
                  </div>
                  <button onClick={() => removeEntry(i)} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                    Hapus
                  </button>
                </div>
                <div>
                  <input
                    type="date" value={date}
                    onChange={(e) => setNewEntries((ent) => ent.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x))}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Pilih tanggal hari Minggu (Senin–Sabtu juga diterima sebagai referensi mingguan)
                  </p>
                </div>
                <BibleVerseSelector
                  value={sel}
                  onChange={(newSel) => setNewEntries((ent) => ent.map((x, idx) => idx === i ? { ...x, sel: newSel } : x))}
                  showPreview
                />
              </div>
            ))
          )}

          {newEntries.length > 0 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
                style={{ backgroundColor: "var(--brand)" }}
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                  : <><Save className="h-4 w-4" /> Simpan ({newEntries.length})</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />
      )}

      {/* ── Bahan Khotbah ──────────────────────────────────────────────────── */}
      <BahanKhotbahAdminSection />

      {/* ── Pokok Doa Harian ───────────────────────────────────────────────── */}
      <PokokDoaAdminSection />
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// Inlined below-the-fold sections: BahanKhotbah + PokokDoa (with JSON import)
// ─────────────────────────────────────────────────────────────────────────────

import { useBahanKhotbah, usePokokDoaHarian, type BahanKhotbah, type PokokDoa } from "@/lib/hooks/useFirestoreData";

// ── Shared mini import widget ─────────────────────────────────────────────────
function MiniImport({
  onImport, onExport, sampleFn, label,
}: {
  label:    string;
  onImport: (data: unknown) => Promise<void>;
  onExport: () => object;
  sampleFn: () => object;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status,   setStatus]   = useState<"idle" | "ok" | "err">("idle");
  const [errMsg,   setErrMsg]   = useState("");
  const [dragOver, setDragOver] = useState(false);

  const process = async (raw: string) => {
    setStatus("idle"); setErrMsg("");
    try {
      const parsed = JSON.parse(raw);
      await onImport(parsed);
      setStatus("ok");
    } catch (e: any) {
      setStatus("err"); setErrMsg(e.message ?? "JSON tidak valid.");
    }
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleFile = (files: FileList | null) => {
    const f = files?.[0]; if (!f) return;
    f.text().then(process);
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(onExport(), null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url;
    a.download = `${label.toLowerCase().replace(/\s+/g, "-")}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSample = () => {
    const blob = new Blob([JSON.stringify(sampleFn(), null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url;
    a.download = `sample-${label.toLowerCase().replace(/\s+/g, "-")}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-dashed border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "var(--brand-muted)" }}>
        <FileJson className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
          Import / Export — {label}
        </p>
      </div>
      <div className="p-3 space-y-2">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center gap-2 py-3 transition-all"
          style={{
            borderColor:     dragOver ? "var(--brand)" : "var(--border)",
            backgroundColor: dragOver ? "var(--brand-muted)" : "transparent",
          }}
        >
          <Upload className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Drag & drop atau klik pilih .json</p>
        </div>
        <input ref={fileRef} type="file" accept=".json" className="hidden"
          onChange={(e) => handleFile(e.target.files)} />

        {status === "ok" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
            <Check className="h-3.5 w-3.5" /> Import berhasil!
          </div>
        )}
        {status === "err" && (
          <div className="flex items-start gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{errMsg}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-muted"
            style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}>
            <Upload className="h-3 w-3" /> Pilih File
          </button>
          <button onClick={exportFile}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" /> Export
          </button>
          <button onClick={downloadSample}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ml-auto">
            <FileJson className="h-3 w-3" /> Contoh Format
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bahan Khotbah Section ─────────────────────────────────────────────────────
const BAHAN_SAMPLE = {
  reference:   "Lukas 24:36-49",
  title:       "Kristus Bangkit Hadir di Tengah Kita",
  thema:       "Kehadiran Kristus yang Bangkit",
  pendahuluan: "Setelah kebangkitan-Nya, Yesus tidak meninggalkan para murid...",
  poinUtama:   [
    { judul: "Damai yang melampaui ketakutan", isi: "Yesus mengucapkan 'Damai sejahtera bagi kamu'..." },
    { judul: "Bukti nyata kebangkitan",        isi: "Yesus menunjukkan tangan dan kaki-Nya..." },
  ],
  penutup: "Seperti para murid, kita pun dipanggil untuk menjadi saksi kebangkitan Kristus.",
};

export function BahanKhotbahAdminSection() {
  const { data, loading, save } = useBahanKhotbah();
  const [form,   setForm]   = useState<BahanKhotbah | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const current = form ?? data;
  const set = <K extends keyof BahanKhotbah>(key: K, val: BahanKhotbah[K]) =>
    setForm((f) => ({ ...(f ?? data), [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(current);
      showToast.success("Bahan Khotbah berhasil disimpan.");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  const addPoin = () =>
    set("poinUtama", [...current.poinUtama, { judul: "", isi: "" }]);

  const removePoin = (i: number) =>
    set("poinUtama", current.poinUtama.filter((_, idx) => idx !== i));

  const updatePoin = (i: number, key: "judul" | "isi", val: string) =>
    set("poinUtama", current.poinUtama.map((p, idx) => idx === i ? { ...p, [key]: val } : p));

  const handleImport = async (raw: unknown) => {
    const d = raw as BahanKhotbah;
    if (!d.reference || !d.title) throw new Error("Field 'reference' dan 'title' wajib ada.");
    await save(d); setForm(d);
    showToast.success("Bahan Khotbah diimport.");
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Memuat Bahan Khotbah...
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Bahan Khotbah</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}>
          {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>
           : saved ? <><Check className="h-3 w-3" /> Tersimpan ✓</>
           :          <><Save className="h-3 w-3" /> Simpan</>}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Meta fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["reference","title","thema"] as const).map((key) => (
            <div key={key}>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold, #b8860b)" }}>
                {key === "reference" ? "Referensi" : key === "title" ? "Judul" : "Tema"}
              </label>
              <input
                value={(current as any)[key] ?? ""}
                onChange={(e) => set(key as any, e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Pendahuluan */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold, #b8860b)" }}>Pendahuluan</label>
          <textarea rows={3} value={current.pendahuluan}
            onChange={(e) => set("pendahuluan", e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none resize-none" />
        </div>

        {/* Poin Utama */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold, #b8860b)" }}>
              Poin Utama ({current.poinUtama.length})
            </label>
            <button onClick={addPoin}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border hover:bg-muted transition-colors"
              style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}>
              <Plus className="h-3 w-3" /> Tambah Poin
            </button>
          </div>
          <div className="space-y-2">
            {current.poinUtama.map((p, i) => (
              <div key={i} className="border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: "var(--brand)" }}>Poin {i + 1}</span>
                  <button onClick={() => removePoin(i)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input value={p.judul} onChange={(e) => updatePoin(i, "judul", e.target.value)}
                  placeholder="Judul poin..." className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none font-semibold" />
                <textarea rows={2} value={p.isi} onChange={(e) => updatePoin(i, "isi", e.target.value)}
                  placeholder="Isi poin..." className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none resize-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Penutup */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold, #b8860b)" }}>Penutup</label>
          <textarea rows={3} value={current.penutup}
            onChange={(e) => set("penutup", e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none resize-none" />
        </div>

        {/* Import/Export */}
        <MiniImport
          label="Bahan Khotbah"
          onImport={handleImport}
          onExport={() => current}
          sampleFn={() => BAHAN_SAMPLE}
        />
      </div>
    </div>
  );
}

// ── Pokok Doa Harian Section ──────────────────────────────────────────────────
const HARI_ORDER = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const DOA_SAMPLE: PokokDoa[] = HARI_ORDER.map((hari) => ({
  hari,
  topik:  `Topik doa ${hari}`,
  detail: `Detail pokok doa untuk hari ${hari}...`,
}));

export function PokokDoaAdminSection() {
  const { data, loading, save } = usePokokDoaHarian();
  const [items,  setItems]  = useState<PokokDoa[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!loading) setItems(data.length ? data : DOA_SAMPLE);
  }, [loading, data]);

  const update = (i: number, key: keyof PokokDoa, val: string) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(items);
      showToast.success("Pokok Doa Harian berhasil disimpan.");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  const handleImport = async (raw: unknown) => {
    const rows = raw as PokokDoa[];
    if (!Array.isArray(rows)) throw new Error("Format harus berupa array.");
    rows.forEach((r, i) => {
      if (!r.hari)  throw new Error(`Item ${i + 1}: field 'hari' wajib.`);
      if (!r.topik) throw new Error(`Item ${i + 1}: field 'topik' wajib.`);
    });
    await save(rows); setItems(rows);
    showToast.success(`${rows.length} pokok doa diimport.`);
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Memuat Pokok Doa...
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Pokok Doa Harian</p>
          <span className="text-[10px] text-muted-foreground font-semibold">(7 hari / minggu)</span>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}>
          {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>
           : saved ? <><Check className="h-3 w-3" /> Tersimpan ✓</>
           :          <><Save className="h-3 w-3" /> Simpan</>}
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-3">
          {HARI_ORDER.map((hari) => {
            const idx  = items.findIndex((it) => it.hari === hari);
            const item = idx >= 0 ? items[idx] : { hari, topik: "", detail: "" };
            const realIdx = idx >= 0 ? idx : items.length;

            const upd = (key: keyof PokokDoa, val: string) => {
              if (idx >= 0) {
                update(idx, key, val);
              } else {
                setItems((prev) => [...prev, { ...item, [key]: val }]);
              }
            };

            return (
              <div key={hari} className="border border-border rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold, #b8860b)" }}>{hari}</p>
                <input
                  value={item.topik}
                  onChange={(e) => upd("topik", e.target.value)}
                  placeholder={`Topik doa ${hari}...`}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none font-semibold"
                  style={{ color: "var(--brand)" }}
                />
                <textarea
                  rows={2}
                  value={item.detail}
                  onChange={(e) => upd("detail", e.target.value)}
                  placeholder="Detail pokok doa..."
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none resize-none"
                />
              </div>
            );
          })}
        </div>

        <MiniImport
          label="Pokok Doa Harian"
          onImport={handleImport}
          onExport={() => items}
          sampleFn={() => DOA_SAMPLE}
        />
      </div>
    </div>
  );
}
