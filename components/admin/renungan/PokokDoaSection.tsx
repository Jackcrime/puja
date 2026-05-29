"use client";

import React, { useState, useRef } from "react";
import { usePokokDoaHarian, type PokokDoa } from "@/lib/hooks/useSupabaseData";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { showToast } from "@/lib/utils/toast";
import { Download, Eye, EyeOff, HandHeart, Info, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { INPUT_CLS, FieldLabel, SectionCard, SaveButton } from "./shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exportPokokDoa(items: PokokDoa[]) {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "pokok-doa.json"; a.click();
  URL.revokeObjectURL(url);
}

const HARI_OPTIONS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// ─── Import Modal ─────────────────────────────────────────────────────────────

interface ImportModalProps {
  onClose:  () => void;
  onImport: (items: PokokDoa[]) => void;
}

function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");
  const fileRef       = useRef<HTMLInputElement>(null);

  const EXAMPLE = JSON.stringify([
    { hari: "Minggu", topik: "Kebangunan Rohani",  detail: "Doakan jiwa-jiwa yang belum percaya..." },
    { hari: "Senin",  topik: "Keluarga Jemaat",    detail: "Doakan setiap keluarga dalam jemaat..." },
    { hari: "Selasa", topik: "Pelayanan & Hamba Tuhan", detail: "Doakan para pelayan dan gembala..." },
  ], null, 2);

  const parse = () => {
    setErr("");
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) throw new Error("Harus berupa array JSON (dimulai dengan [).");
      for (const [i, item] of arr.entries()) {
        if (typeof item !== "object" || Array.isArray(item))
          throw new Error(`Item ke-${i + 1} bukan object.`);
        if (!item.hari || !item.topik)
          throw new Error(`Item ke-${i + 1} harus punya "hari" dan "topik".`);
        if (!HARI_OPTIONS.includes(item.hari))
          throw new Error(`Item ke-${i + 1}: "hari" harus salah satu dari ${HARI_OPTIONS.join(", ")}.`);
      }
      onImport(arr as PokokDoa[]);
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "JSON tidak valid.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>Import Pokok Doa (JSON)</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="h-3 w-3" style={{ color: "var(--brand)" }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
                Format JSON — array of &#123; hari, topik, detail &#125;
              </p>
            </div>
            <pre className="text-[11px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">{EXAMPLE}</pre>
            <p className="text-[10px] text-muted-foreground">
              Hari valid: {HARI_OPTIONS.join(", ")}. Import akan <strong>mengganti</strong> seluruh data yang ada.
            </p>
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
            <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8}
              placeholder={'[\n  { "hari": "Minggu", "topik": "...", "detail": "..." }\n]'}
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

export function PokokDoaSection() {
  const { data, loading, save } = usePokokDoaHarian();

  const [items,        setItems]        = useState<PokokDoa[] | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [showImport,   setShowImport]   = useState(false);
  const [showPreview,  setShowPreview]  = useState(false);

  const current: PokokDoa[] = items ?? data;

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(current);
      showToast.success("Pokok Doa Harian berhasil disimpan.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      showToast.error("Gagal menyimpan.");
    }
    setSaving(false);
  };

  const handleImport = (imported: PokokDoa[]) => {
    setItems(imported);
    showToast.success("Pokok doa diimport — klik Simpan untuk menyimpan ke database.");
  };

  const updateItem = (i: number, key: keyof PokokDoa, val: string) =>
    setItems((prev) => (prev ?? data).map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));

  const addItem = () =>
    setItems((prev) => [...(prev ?? data), { hari: "Minggu", topik: "", detail: "" }]);

  const removeItem = (i: number) =>
    setItems((prev) => (prev ?? data).filter((_, idx) => idx !== i));

  if (loading)
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-8">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
          style={{ color: "var(--brand)" }}
        >
          {showPreview ? <><EyeOff className="h-3.5 w-3.5" /> Tutup Preview</> : <><Eye className="h-3.5 w-3.5" /> Live Preview</>}
        </button>
        <button
          onClick={() => exportPokokDoa(current)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
          style={{ color: "var(--brand)" }}
        >
          <Download className="h-3.5 w-3.5" /> Export JSON
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
          style={{ color: "var(--brand)" }}
        >
          <Upload className="h-3.5 w-3.5" /> Import JSON
        </button>
      </div>

      <SectionCard title="Pokok Doa Harian" icon={HandHeart}>
        <p className="text-xs text-muted-foreground">
          Doa harian per hari dalam seminggu yang ditampilkan kepada jemaat.
        </p>

        <div className="space-y-3">
          {current.map((item, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-white"
                  style={{ backgroundColor: "var(--brand)" }}
                >
                  {item.hari}
                </span>
                <button
                  onClick={() => setDeleteTarget(i)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Hari</FieldLabel>
                  <select
                    value={item.hari}
                    onChange={(e) => updateItem(i, "hari", e.target.value)}
                    className={INPUT_CLS}
                  >
                    {HARI_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Topik Doa</FieldLabel>
                  <input
                    value={item.topik}
                    onChange={(e) => updateItem(i, "topik", e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Detail / Panduan Doa</FieldLabel>
                <textarea
                  rows={3}
                  value={item.detail}
                  onChange={(e) => updateItem(i, "detail", e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
            </div>
          ))}

          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border hover:bg-muted transition-colors w-full justify-center"
            style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Pokok Doa
          </button>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} label="Simpan Pokok Doa" />
      </div>

      {/* Live Preview Pokok Doa */}
      {showPreview && current.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden text-sm">
          <div className="h-1 w-full" style={{ backgroundColor: "var(--brand)" }} />
          <div className="p-5 space-y-3">
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
              Pratinjau Pokok Doa
            </p>
            <div className="grid gap-2">
              {current.map((item, i) => (
                <div key={i} className="flex gap-3 p-3 border border-border rounded-lg">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-white shrink-0 h-fit mt-0.5"
                    style={{ backgroundColor: "var(--brand)" }}
                  >
                    {item.hari}
                  </span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--brand)" }}>{item.topik}</p>
                    {item.detail && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Hapus Pokok Doa?"
        description={`Hapus pokok doa "${current[deleteTarget ?? 0]?.topik || "—"}"?`}
        onConfirm={() => { removeItem(deleteTarget!); setDeleteTarget(null); }}
      />

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />
      )}
    </div>
  );
}