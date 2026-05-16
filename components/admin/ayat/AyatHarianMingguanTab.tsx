"use client";

import React, { useState, useRef } from "react";
import { useAyatKhusus }           from "@/lib/hooks/useFirestoreData";
import { BibleVerseSelector, type VerseSelection, emptySelection } from "./BibleVerseSelector";
import { showToast }               from "@/lib/utils/toast";
import {
  CalendarDays, Sun, Plus, Trash2, Save, Loader2,
  Upload, Download, Calendar, Info,
} from "lucide-react";
import { todayISO, selToRef, fetchVerseText, exportJSON } from "@/lib/utils/adminAyat";
// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${day} ${months[Number(m) - 1]} ${y}`;
}

function nearestSunday(): string {
  const d   = new Date();
  const day = d.getDay();
  if (day !== 0) d.setDate(d.getDate() + (7 - day));
  return d.toISOString().split("T")[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewEntry { date: string; sel: VerseSelection; }

// ─── Shared Import Modal ──────────────────────────────────────────────────────

interface ImportModalProps {
  title:    string;
  onClose:  () => void;
  onImport: (entries: Record<string, { reference: string; text: string }>) => void;
  example:  Record<string, { reference: string; text: string }>;
}

function ImportModal({ title, onClose, onImport, example }: ImportModalProps) {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");
  const fileRef       = useRef<HTMLInputElement>(null);

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
            <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>{title}</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="h-3 w-3" style={{ color: "var(--brand)" }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
                Format JSON — key = tanggal (YYYY-MM-DD)
              </p>
            </div>
            <pre className="text-[11px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(example, null, 2)}
            </pre>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-muted-foreground">Upload file .json</label>
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

// ─── Harian Panel ─────────────────────────────────────────────────────────────

function HarianPanel() {
  const { data, loading, save } = useAyatKhusus();
  const [newEntries, setNewEntries] = useState<NewEntry[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [showImport, setShowImport] = useState(false);
  const today = todayISO();

  const addEntry    = () => setNewEntries((e) => [...e, { date: today, sel: emptySelection() }]);
  const removeEntry = (i: number) => setNewEntries((e) => e.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (newEntries.length === 0) { showToast.info("Tidak ada entry baru."); return; }
    setSaving(true);
    const existing = { ...(data.harian ?? {}) };
    await Promise.all(newEntries.map(async ({ date, sel }) => {
      if (!date || !sel.bookSlug) return;
      existing[date] = { reference: selToRef(sel), text: await fetchVerseText(sel) };
    }));
    try {
      await save({ ...data, harian: existing });
      showToast.success(`${newEntries.filter(e => e.sel.bookSlug && e.date).length} ayat harian disimpan.`);
      setNewEntries([]);
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  const handleDelete = async (dateKey: string) => {
    const next = { ...(data.harian ?? {}) };
    delete next[dateKey];
    try { await save({ ...data, harian: next }); showToast.success(`Ayat ${dateKey} dihapus.`); }
    catch { showToast.error("Gagal menghapus."); }
  };

  const handleImport = async (entries: Record<string, { reference: string; text: string }>) => {
    setSaving(true);
    try {
      await save({ ...data, harian: { ...(data.harian ?? {}), ...entries } });
      showToast.success(`${Object.keys(entries).length} ayat diimport.`);
    } catch { showToast.error("Gagal mengimport."); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-3 text-muted-foreground py-10"><Loader2 className="h-5 w-5 animate-spin" /> Memuat...</div>;

  const harianSorted = Object.entries(data.harian ?? {}).sort(([a], [b]) => a.localeCompare(b));

  const EXAMPLE_HARIAN = {
    "2026-06-01": { reference: "Filipi 4:13", text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
    "2026-06-02": { reference: "Yohanes 3:16", text: "Karena begitu besar kasih Allah akan dunia ini..." },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Kelola ayat per tanggal. Hari ini (<span className="font-semibold" style={{ color: "var(--brand)" }}>{fmtDate(today)}</span>) ditandai khusus.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {harianSorted.length > 0 && (
            <button onClick={() => exportJSON(data.harian!, `ayat-harian-${today}.json`)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
              style={{ color: "var(--brand)" }}
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          )}
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
            style={{ color: "var(--brand)" }}
          >
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </button>
        </div>
      </div>

      {/* Saved */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center px-5 py-3 border-b border-border gap-2" style={{ backgroundColor: "var(--brand-muted)" }}>
          <CalendarDays className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
            Tersimpan ({harianSorted.length} tanggal)
          </p>
        </div>
        {harianSorted.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Belum ada ayat harian tersimpan.</div>
        ) : (
          <div className="divide-y divide-border">
            {harianSorted.map(([dateKey, val]) => {
              const isToday  = dateKey === today;
              const isFuture = dateKey > today;
              return (
                <div key={dateKey} className={`flex items-start gap-3 px-4 py-3 ${isToday ? "bg-brand-muted/30" : ""}`}>
                  <div className="shrink-0 w-28">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      isToday ? "text-white" : isFuture ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/60"
                    }`} style={isToday ? { backgroundColor: "var(--brand)" } : {}}>
                      <Calendar className="h-2.5 w-2.5" />
                      {isToday ? "Hari Ini" : isFuture ? "Mendatang" : "Lalu"}
                    </div>
                    <p className="text-xs font-bold mt-1" style={{ color: isToday ? "var(--brand)" : undefined }}>{dateKey}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtDate(dateKey)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--brand)" }}>{val.reference}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{val.text}</p>
                  </div>
                  <button onClick={() => handleDelete(dateKey)}
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
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Tambah Ayat Baru</p>
          </div>
          <button onClick={addEntry}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
            style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Tanggal
          </button>
        </div>
        <div className="p-5 space-y-4">
          {newEntries.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              Klik "Tambah Tanggal" untuk menambah, atau gunakan Import JSON untuk batch.
            </div>
          ) : (
            newEntries.map(({ date, sel }, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--gold, #b8860b)" }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold, #b8860b)" }}>Tanggal</span>
                    {date === today && <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-bold" style={{ backgroundColor: "var(--brand)" }}>Hari Ini</span>}
                    {date > today  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">Persiapan</span>}
                  </div>
                  <button onClick={() => removeEntry(i)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Hapus</button>
                </div>
                <input type="date" value={date}
                  onChange={(e) => setNewEntries((ent) => ent.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x))}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
                />
                <BibleVerseSelector value={sel}
                  onChange={(newSel) => setNewEntries((ent) => ent.map((x, idx) => idx === i ? { ...x, sel: newSel } : x))}
                  showPreview
                />
              </div>
            ))
          )}
          {newEntries.length > 0 && (
            <div className="flex justify-end pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
                style={{ backgroundColor: "var(--brand)" }}
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="h-4 w-4" /> Simpan ({newEntries.length})</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {showImport && (
        <ImportModal
          title="Import Ayat Harian (JSON)"
          example={EXAMPLE_HARIAN}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}

// ─── Mingguan Panel ───────────────────────────────────────────────────────────

function MingguanPanel() {
  const { data, loading, save } = useAyatKhusus();
  const [newEntries, setNewEntries] = useState<NewEntry[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [showImport, setShowImport] = useState(false);

  const today      = todayISO();
  const thisSunday = nearestSunday();

  const addEntry    = () => setNewEntries((e) => [...e, { date: thisSunday, sel: emptySelection() }]);
  const removeEntry = (i: number) => setNewEntries((e) => e.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (newEntries.length === 0) { showToast.info("Tidak ada entry baru."); return; }
    setSaving(true);
    const existing = { ...(data.mingguan ?? {}) };
    await Promise.all(newEntries.map(async ({ date, sel }) => {
      if (!date || !sel.bookSlug) return;
      existing[date] = { reference: selToRef(sel), text: await fetchVerseText(sel) };
    }));
    try {
      await save({ ...data, mingguan: existing });
      showToast.success(`${newEntries.filter(e => e.sel.bookSlug && e.date).length} ayat mingguan disimpan.`);
      setNewEntries([]);
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  const handleDelete = async (dateKey: string) => {
    const next = { ...(data.mingguan ?? {}) };
    delete next[dateKey];
    try { await save({ ...data, mingguan: next }); showToast.success(`Ayat minggu ${dateKey} dihapus.`); }
    catch { showToast.error("Gagal menghapus."); }
  };

  const handleImport = async (entries: Record<string, { reference: string; text: string }>) => {
    setSaving(true);
    try {
      await save({ ...data, mingguan: { ...(data.mingguan ?? {}), ...entries } });
      showToast.success(`${Object.keys(entries).length} ayat mingguan diimport.`);
    } catch { showToast.error("Gagal mengimport."); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-3 text-muted-foreground py-10"><Loader2 className="h-5 w-5 animate-spin" /> Memuat...</div>;

  const mingguanSorted = Object.entries(data.mingguan ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const currentWeek    = mingguanSorted.find(([k]) => k === thisSunday);

  const EXAMPLE_MINGGUAN = {
    "2026-06-01": { reference: "Yohanes 15:5", text: "Akulah pokok anggur dan kamulah ranting-rantingnya." },
    "2026-06-08": { reference: "Mazmur 23:1",  text: "TUHAN adalah gembalaku, takkan kekurangan aku." },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Kelola ayat per Minggu. Minggu ini:{" "}
            <span className="font-semibold" style={{ color: "var(--brand)" }}>{fmtDate(thisSunday)}</span>
          </p>
          {currentWeek && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Ayat aktif:{" "}
              <span className="font-semibold" style={{ color: "var(--brand)" }}>{currentWeek[1].reference}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {mingguanSorted.length > 0 && (
            <button onClick={() => exportJSON(data.mingguan!, `ayat-mingguan-${today}.json`)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
              style={{ color: "var(--brand)" }}
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          )}
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
            style={{ color: "var(--brand)" }}
          >
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </button>
        </div>
      </div>

      {/* Saved */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center px-5 py-3 border-b border-border gap-2" style={{ backgroundColor: "var(--brand-muted)" }}>
          <Sun className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
            Tersimpan ({mingguanSorted.length} minggu)
          </p>
        </div>
        {mingguanSorted.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Belum ada ayat mingguan tersimpan.</div>
        ) : (
          <div className="divide-y divide-border">
            {mingguanSorted.map(([dateKey, val]) => {
              const isThis   = dateKey === thisSunday;
              const isFuture = dateKey > today;
              return (
                <div key={dateKey} className={`flex items-start gap-3 px-4 py-3 ${isThis ? "bg-brand-muted/30" : ""}`}>
                  <div className="shrink-0 w-28">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      isThis ? "text-white" : isFuture ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/60"
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
                  <button onClick={() => handleDelete(dateKey)}
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
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>Tambah Ayat Mingguan</p>
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
              Klik "Tambah Minggu" untuk menambah, atau gunakan Import JSON untuk batch.
            </div>
          ) : (
            newEntries.map(({ date, sel }, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--gold, #b8860b)" }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold, #b8860b)" }}>Tanggal Minggu</span>
                    {date === thisSunday && <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-bold" style={{ backgroundColor: "var(--brand)" }}>Minggu Ini</span>}
                  </div>
                  <button onClick={() => removeEntry(i)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Hapus</button>
                </div>
                <div>
                  <input type="date" value={date}
                    onChange={(e) => setNewEntries((ent) => ent.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x))}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Pilih tanggal hari Minggu (Senin–Sabtu juga diterima sebagai referensi mingguan)
                  </p>
                </div>
                <BibleVerseSelector value={sel}
                  onChange={(newSel) => setNewEntries((ent) => ent.map((x, idx) => idx === i ? { ...x, sel: newSel } : x))}
                  showPreview
                />
              </div>
            ))
          )}
          {newEntries.length > 0 && (
            <div className="flex justify-end pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
                style={{ backgroundColor: "var(--brand)" }}
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="h-4 w-4" /> Simpan ({newEntries.length})</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {showImport && (
        <ImportModal
          title="Import Ayat Mingguan (JSON)"
          example={EXAMPLE_MINGGUAN}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

type SubTab = "harian" | "mingguan";

export function AyatHarianMingguanTab() {
  const [sub, setSub] = useState<SubTab>("harian");

  return (
    <div className="space-y-5">
      {/* Sub-tab toggle */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border w-fit">
        <button
          onClick={() => setSub("harian")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={sub === "harian"
            ? { backgroundColor: "var(--brand)", color: "white" }
            : { color: "hsl(var(--muted-foreground))" }
          }
        >
          <CalendarDays className="h-4 w-4" />
          Harian
        </button>
        <button
          onClick={() => setSub("mingguan")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={sub === "mingguan"
            ? { backgroundColor: "var(--brand)", color: "white" }
            : { color: "hsl(var(--muted-foreground))" }
          }
        >
          <Sun className="h-4 w-4" />
          Mingguan
        </button>
      </div>

      {sub === "harian"   && <HarianPanel />}
      {sub === "mingguan" && <MingguanPanel />}
    </div>
  );
}