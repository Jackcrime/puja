"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { DataTable }      from "@/components/admin/DataTable";
import { FormModal }      from "@/components/admin/FormModal";
import { ConfirmDialog }  from "@/components/admin/ConfirmDialog";
import { useAyatCategories, useAyatNats, type AyatNatsItem } from "@/lib/hooks/useFirestoreData";
import {
  Loader2, Flame, Plus, Trash2, Save, Check,
  Upload, Download, FileJson, AlertCircle, X, GripVertical,
} from "lucide-react";
import { showToast } from "@/lib/utils/toast";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Verse = {
  id:        string;
  label:     string;
  reference: string;
  text:      string;
  category:  string;
};

const ALL_CATEGORIES = [
  "Tuntunan",
  "Iman & Pengharapan",
  "Kasih & Pelayanan",
  "Kekuatan & Keberanian",
  "Damai & Istirahat",
  "Keadilan & Kebijaksanaan",
];

const EMPTY: Verse = { id: "", label: "", reference: "", text: "", category: "Tuntunan" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function categoriesToFlat(
  cats: { category: string; verses: { label: string; reference: string; text: string }[] }[]
): Verse[] {
  return cats.flatMap((cat) =>
    cat.verses.map((v, i) => ({
      id:        `${cat.category}-${i}-${v.reference}`,
      category:  cat.category,
      label:     v.label,
      reference: v.reference,
      text:      v.text,
    }))
  );
}

function flatToCategories(verses: Verse[]) {
  return ALL_CATEGORIES
    .map((catName) => ({
      category: catName,
      verses: verses
        .filter((v) => v.category === catName)
        .map(({ label, reference, text }) => ({ label, reference, text })),
    }))
    .filter((c) => c.verses.length > 0);
}

// ─── Ayat Nats Section ────────────────────────────────────────────────────────
const NATS_SAMPLE = [
  { id: "1", reference: "Lukas 24:48",   text: "Dan kamu adalah saksi dari semuanya ini." },
  { id: "2", reference: "Yohanes 15:5",  text: "Akulah pokok anggur dan kamulah ranting-rantingnya." },
  { id: "3", reference: "Filipi 4:13",   text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
];

function AyatNatsSection() {
  const { data, loading, save } = useAyatNats();
  const [items,   setItems]   = useState<AyatNatsItem[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "ok" | "err">("idle");
  const [importErr,    setImportErr]    = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) setItems(data.items ?? []);
  }, [loading, data]);

  const addItem = () =>
    setItems((prev) => [...prev, { id: Date.now().toString(), reference: "", text: "" }]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const updateItem = (id: string, key: keyof AyatNatsItem, val: string) =>
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, [key]: val } : it));

  const handleSave = async () => {
    const valid = items.filter((it) => it.reference.trim() && it.text.trim());
    if (valid.length === 0) { showToast.error("Isi minimal satu Ayat Nats."); return; }
    setSaving(true);
    try {
      await save({ items: valid });
      setItems(valid);
      showToast.success(`${valid.length} Ayat Nats berhasil disimpan.`);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  const processImport = async (raw: string) => {
    setImportStatus("idle"); setImportErr("");
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Format harus berupa array.");
      parsed.forEach((it: any, i: number) => {
        if (!it.reference) throw new Error(`Item ${i + 1}: field 'reference' wajib.`);
        if (!it.text)      throw new Error(`Item ${i + 1}: field 'text' wajib.`);
      });
      const withIds: AyatNatsItem[] = parsed.map((it: any, i: number) => ({
        id:        it.id ?? `${Date.now()}-${i}`,
        reference: it.reference,
        text:      it.text,
      }));
      await save({ items: withIds });
      setItems(withIds);
      setImportStatus("ok");
      showToast.success(`${withIds.length} Ayat Nats diimport.`);
    } catch (e: any) {
      setImportStatus("err");
      setImportErr(e.message ?? "JSON tidak valid.");
    }
    setTimeout(() => setImportStatus("idle"), 3500);
  };

  const handleFile = (files: FileList | null) => {
    const f = files?.[0]; if (!f) return;
    if (!f.name.endsWith(".json")) {
      setImportStatus("err"); setImportErr("File harus .json"); return;
    }
    f.text().then(processImport);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "ayat-nats.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSample = () => {
    const blob = new Blob([JSON.stringify(NATS_SAMPLE, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "sample-ayat-nats.json"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-4 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> Memuat Ayat Nats...
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-border"
        style={{ backgroundColor: "var(--brand-muted)" }}
      >
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
            Ayat Nats
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
            {items.length} nats — tampil di halaman renungan
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
            style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
          >
            {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>
             : saved ? <><Check className="h-3 w-3" /> Tersimpan ✓</>
             :          <><Save className="h-3 w-3" /> Simpan</>}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Nats list */}
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={it.id} className="flex gap-2 items-start group">
              <div className="flex items-center pt-2.5 text-muted-foreground/40 cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-2"
                style={{ backgroundColor: "var(--brand)" }}>
                {i + 1}
              </div>
              <input
                value={it.reference}
                onChange={(e) => updateItem(it.id, "reference", e.target.value)}
                placeholder="mis. Lukas 24:48"
                className="w-36 shrink-0 px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none font-semibold"
                style={{ color: "var(--brand)" }}
              />
              <input
                value={it.text}
                onChange={(e) => updateItem(it.id, "text", e.target.value)}
                placeholder="Teks ayat nats..."
                className="flex-1 px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none"
              />
              <button
                onClick={() => removeItem(it.id)}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600 transition-colors shrink-0 mt-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              Belum ada Ayat Nats. Tambah manual atau import JSON.
            </div>
          )}
        </div>

        <button
          onClick={addItem}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
          style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Nats
        </button>

        {/* Import/Export panel */}
        <div className="border border-dashed border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "var(--brand-muted)" }}>
            <FileJson className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
              Import / Export — Ayat Nats
            </p>
          </div>
          <div className="p-4 space-y-3">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center gap-2 py-5 px-4 text-center"
              style={{
                borderColor:     dragOver ? "var(--brand)" : "var(--border)",
                backgroundColor: dragOver ? "var(--brand-muted)" : "transparent",
              }}
            >
              <Upload className="h-5 w-5" style={{ color: dragOver ? "var(--brand)" : "var(--muted-foreground)" }} />
              <p className="text-xs font-medium text-muted-foreground">Drag & drop atau klik untuk pilih file .json</p>
            </div>
            <input ref={fileRef} type="file" accept=".json" className="hidden"
              onChange={(e) => handleFile(e.target.files)} />

            {/* Status */}
            {importStatus === "ok" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                <Check className="h-3.5 w-3.5" /> Import berhasil!
              </div>
            )}
            {importStatus === "err" && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{importErr}</span>
                <button onClick={() => setImportStatus("idle")} className="ml-auto shrink-0"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors hover:bg-muted"
                style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}>
                <Upload className="h-3.5 w-3.5" /> Pilih File
              </button>
              {items.length > 0 && (
                <button onClick={handleExport}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Download className="h-3.5 w-3.5" /> Export JSON
                </button>
              )}
              <button onClick={downloadSample}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ml-auto">
                <FileJson className="h-3.5 w-3.5" /> Contoh Format
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main AyatKategoriTab ─────────────────────────────────────────────────────
export function AyatKategoriTab() {
  const { data: categoryData, loading, save: saveCategories } = useAyatCategories();

  const [verses,  setVerses]  = useState<Verse[]>([]);
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState<Verse | null>(null);
  const [form,    setForm]    = useState<Verse>(EMPTY);
  const [target,  setTarget]  = useState<Verse | null>(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!loading) setVerses(categoriesToFlat(categoryData));
  }, [loading, categoryData]);

  const persist = async (updated: Verse[]) => {
    setSaving(true);
    setVerses(updated);
    try {
      await saveCategories(flatToCategories(updated) as any);
    } catch {
      showToast.error("Gagal menyimpan ayat. Coba lagi.");
    }
    setSaving(false);
  };

  const openAdd    = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (v: Verse) => { setEditing(v); setForm(v); setModal(true); };
  const openDelete = (v: Verse) => { setTarget(v); setConfirm(true); };

  const handleSubmit = async () => {
    const isEdit = !!editing;
    const next = isEdit
      ? verses.map((v) => (v.id === editing.id ? { ...form, id: editing.id } : v))
      : [...verses, { ...form, id: `${Date.now()}` }];
    setModal(false);
    await persist(next);
    showToast.success(isEdit ? "Ayat berhasil diperbarui." : "Ayat baru berhasil ditambahkan.");
  };

  const handleDelete = async () => {
    if (!target) return;
    const name = target.reference || target.label;
    setTarget(null);
    await persist(verses.filter((v) => v.id !== target.id));
    showToast.success(`Ayat "${name}" berhasil dihapus.`);
  };

  const filtered = useMemo(() =>
    verses.filter((v) =>
      !search ||
      v.reference.toLowerCase().includes(search.toLowerCase()) ||
      v.text.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase())
    ),
    [verses, search]
  );

  return (
    <>
      {/* ── Ayat Nats Section ───────────────────────────────────────────── */}
      <AyatNatsSection />

      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat dari Firestore...
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{verses.length} ayat tersimpan</p>
            {saving ? (
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--brand)" }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
              </span>
            ) : (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                Live Firestore
              </span>
            )}
          </>
        )}
      </div>

      {!loading && (
        <>
          <DataTable
            columns={[
              {
                key: "category", label: "Kategori", width: "150px",
                render: (r) => (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--gold-muted)", color: "var(--gold)" }}>
                    {r.category}
                  </span>
                ),
              },
              {
                key: "reference", label: "Referensi", width: "160px",
                render: (r) => (
                  <span className="font-serif font-semibold text-sm" style={{ color: "var(--brand)" }}>
                    {r.reference}
                  </span>
                ),
              },
              { key: "label", label: "Label", width: "120px" },
              {
                key: "text", label: "Isi Ayat",
                render: (r) => (
                  <span className="text-muted-foreground line-clamp-2 text-xs">{r.text}</span>
                ),
              },
            ]}
            data={filtered}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={openDelete}
            addLabel="Tambah Ayat"
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari referensi, teks, atau kategori..."
            emptyText="Belum ada ayat."
            pageSize={20}
          />

          <FormModal
            open={modal}
            onOpenChange={setModal}
            title="Ayat Kategori"
            isEdit={!!editing}
            fields={[
              {
                key: "category", label: "Kategori", type: "select", required: true,
                options: ALL_CATEGORIES.map((c) => ({ value: c, label: c })),
              },
              { key: "label",     label: "Label (contoh: AYAT MINGGU)", placeholder: "AYAT MINGGU",          required: true },
              { key: "reference", label: "Referensi",                   placeholder: "Yohanes 3:16",          required: true },
              { key: "text",      label: "Isi Ayat", type: "textarea", placeholder: "Tuliskan isi ayat...", rows: 4, required: true },
            ]}
            values={form}
            onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
            onSubmit={handleSubmit}
          />

          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            description={`Hapus ayat "${target?.reference}"? Tindakan ini tidak bisa dibatalkan.`}
            onConfirm={handleDelete}
          />
        </>
      )}
    </>
  );
}
