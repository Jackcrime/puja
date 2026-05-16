"use client";

import React, { useState, useRef } from "react";
import { useBahanKhotbah, type BahanKhotbah } from "@/lib/hooks/useFirestoreData";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { showToast } from "@/lib/utils/toast";
import { BookOpen, Download, FlameKindling, GripVertical, Info, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { INPUT_CLS, FieldLabel, SectionCard, SaveButton } from "./shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exportBahanKhotbah(data: BahanKhotbah) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "bahan-khotbah.json"; a.click();
  URL.revokeObjectURL(url);
}

const EMPTY_BAHAN: BahanKhotbah = {
  reference: "", title: "", thema: "", pendahuluan: "", poinUtama: [], penutup: "",
};

// ─── Import Modal ─────────────────────────────────────────────────────────────

interface ImportModalProps {
  onClose:  () => void;
  onImport: (data: BahanKhotbah) => void;
}

function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");
  const fileRef       = useRef<HTMLInputElement>(null);

  const EXAMPLE = JSON.stringify({
    reference:   "Lukas 24:36–49",
    title:       "Judul Khotbah",
    thema:       "Tema sentral",
    pendahuluan: "Paragraf pembuka...",
    poinUtama:   [{ judul: "Poin 1", isi: "Penjelasan..." }],
    penutup:     "Paragraf penutup...",
  }, null, 2);

  const parse = () => {
    setErr("");
    try {
      const obj = JSON.parse(raw) as Partial<BahanKhotbah>;
      if (typeof obj !== "object" || Array.isArray(obj)) throw new Error("Harus berupa object JSON.");
      if (!("title" in obj)) throw new Error('Field "title" wajib ada.');
      if (obj.poinUtama !== undefined && !Array.isArray(obj.poinUtama))
        throw new Error('"poinUtama" harus berupa array.');
      onImport({ ...EMPTY_BAHAN, ...obj });
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
            <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>Import Bahan Khotbah (JSON)</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="h-3 w-3" style={{ color: "var(--brand)" }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
                Format JSON — sesuai struktur Bahan Khotbah
              </p>
            </div>
            <pre className="text-[11px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">{EXAMPLE}</pre>
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
              placeholder={'{\n  "title": "...",\n  "reference": "..."\n}'}
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

export function BahanKhotbahSection() {
  const { data, loading, save } = useBahanKhotbah();

  const [form,         setForm]         = useState<BahanKhotbah | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [showImport,   setShowImport]   = useState(false);

  const current: BahanKhotbah = form ?? data;
  const set = <K extends keyof BahanKhotbah>(key: K, val: BahanKhotbah[K]) =>
    setForm((f) => ({ ...(f ?? data), [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(current);
      showToast.success("Bahan Khotbah berhasil disimpan.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      showToast.error("Gagal menyimpan.");
    }
    setSaving(false);
  };

  const handleImport = (imported: BahanKhotbah) => {
    setForm(imported);
    showToast.success("Data diimport — klik Simpan untuk menyimpan ke database.");
  };

  const addPoin    = () => set("poinUtama", [...current.poinUtama, { judul: "", isi: "" }]);
  const removePoin = (i: number) => set("poinUtama", current.poinUtama.filter((_, idx) => idx !== i));
  const updatePoin = (i: number, key: "judul" | "isi", val: string) =>
    set("poinUtama", current.poinUtama.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));

  if (loading)
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-8">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
      </div>
    );

  return (
    <div className="max-w-2xl space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => exportBahanKhotbah(current)}
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

      {/* Informasi Khotbah */}
      <SectionCard title="Informasi Khotbah" icon={BookOpen}>
        <div>
          <FieldLabel>Referensi Alkitab</FieldLabel>
          <input
            value={current.reference}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="mis. Lukas 24:36–49"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <FieldLabel>Judul Khotbah</FieldLabel>
          <input
            value={current.title}
            onChange={(e) => set("title", e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <FieldLabel>Thema / Tema Sentral</FieldLabel>
          <input
            value={current.thema}
            onChange={(e) => set("thema", e.target.value)}
            className={INPUT_CLS}
          />
        </div>
      </SectionCard>

      {/* Pendahuluan */}
      <SectionCard title="Pendahuluan" icon={BookOpen}>
        <textarea
          rows={4}
          value={current.pendahuluan}
          onChange={(e) => set("pendahuluan", e.target.value)}
          className={INPUT_CLS}
        />
      </SectionCard>

      {/* Poin Utama */}
      <SectionCard title="Poin-Poin Utama" icon={FlameKindling}>
        <div className="space-y-3">
          {current.poinUtama.map((poin, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                    Poin {i + 1}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteTarget(i)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div>
                <FieldLabel>Judul Poin</FieldLabel>
                <input
                  value={poin.judul}
                  onChange={(e) => updatePoin(i, "judul", e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <FieldLabel>Isi / Penjelasan</FieldLabel>
                <textarea
                  rows={3}
                  value={poin.isi}
                  onChange={(e) => updatePoin(i, "isi", e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
            </div>
          ))}

          <button
            onClick={addPoin}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border hover:bg-muted transition-colors w-full justify-center"
            style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Poin
          </button>
        </div>
      </SectionCard>

      {/* Penutup */}
      <SectionCard title="Penutup / Kesimpulan" icon={BookOpen}>
        <textarea
          rows={4}
          value={current.penutup}
          onChange={(e) => set("penutup", e.target.value)}
          className={INPUT_CLS}
        />
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} label="Simpan Bahan Khotbah" />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Hapus Poin?"
        description={`Hapus Poin ${(deleteTarget ?? 0) + 1}: "${current.poinUtama[deleteTarget ?? 0]?.judul || "—"}"?`}
        onConfirm={() => { removePoin(deleteTarget!); setDeleteTarget(null); }}
      />

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />
      )}
    </div>
  );
}