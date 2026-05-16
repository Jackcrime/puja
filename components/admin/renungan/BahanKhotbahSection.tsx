"use client";

import React, { useState } from "react";
import { useBahanKhotbah, type BahanKhotbah } from "@/lib/hooks/useFirestoreData";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { showToast } from "@/lib/utils/toast";
import { BookOpen, FlameKindling, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { INPUT_CLS, FieldLabel, SectionCard, SaveButton } from "./shared";

export function BahanKhotbahSection() {
  const { data, loading, save } = useBahanKhotbah();

  const [form,         setForm]         = useState<BahanKhotbah | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

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
    </div>
  );
}