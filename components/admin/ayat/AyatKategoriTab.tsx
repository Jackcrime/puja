"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DataTable }    from "@/components/admin/DataTable";
import { FormModal }    from "@/components/admin/FormModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAyatCategories } from "@/lib/hooks/useFirestoreData";
import { Loader2 } from "lucide-react";

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

// ─── Component ────────────────────────────────────────────────────────────────
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
    await saveCategories(flatToCategories(updated) as any);
    setSaving(false);
  };

  const openAdd    = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (v: Verse) => { setEditing(v); setForm(v); setModal(true); };
  const openDelete = (v: Verse) => { setTarget(v); setConfirm(true); };

  const handleSubmit = async () => {
    const next = editing
      ? verses.map((v) => (v.id === editing.id ? { ...form, id: editing.id } : v))
      : [...verses, { ...form, id: `${Date.now()}` }];
    setModal(false);
    await persist(next);
  };

  const handleDelete = async () => {
    if (!target) return;
    setTarget(null);
    await persist(verses.filter((v) => v.id !== target.id));
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

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-10">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
      </div>
    );
  }

  return (
    <>
      {/* Status bar */}
      <div className="mb-4 flex items-center gap-3">
        <p className="text-sm text-muted-foreground">{verses.length} ayat tersimpan</p>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--brand)" }}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
          </span>
        )}
        {!saving && (
          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
            Live Firestore
          </span>
        )}
      </div>

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
          { key: "reference", label: "Referensi",                    placeholder: "Yohanes 3:16",          required: true },
          { key: "text",      label: "Isi Ayat", type: "textarea",  placeholder: "Tuliskan isi ayat...", rows: 4, required: true },
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
  );
}