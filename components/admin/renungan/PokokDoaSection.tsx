"use client";

import React, { useState } from "react";
import { usePokokDoaHarian, type PokokDoa } from "@/lib/hooks/useFirestoreData";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { showToast } from "@/lib/utils/toast";
import { HandHeart, Loader2, Plus, Trash2 } from "lucide-react";
import { INPUT_CLS, FieldLabel, SectionCard, SaveButton } from "./shared";

const HARI_OPTIONS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function PokokDoaSection() {
  const { data, loading, save } = usePokokDoaHarian();

  const [items,        setItems]        = useState<PokokDoa[] | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

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
    <div className="max-w-2xl space-y-4">
      <SectionCard title="Pokok Doa Harian" icon={HandHeart}>
        <p className="text-xs text-muted-foreground">
          Doa harian per hari dalam seminggu yang ditampilkan kepada jemaat.
        </p>

        <div className="space-y-3">
          {current.map((item, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3">
              {/* Row header */}
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Hapus Pokok Doa?"
        description={`Hapus pokok doa "${current[deleteTarget ?? 0]?.topik || "—"}"?`}
        onConfirm={() => { removeItem(deleteTarget!); setDeleteTarget(null); }}
      />
    </div>
  );
}