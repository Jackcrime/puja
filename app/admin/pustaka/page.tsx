"use client";

import React, { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DataTable } from "@/components/admin/DataTable";
import { FormModal } from "@/components/admin/FormModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FileUploader } from "@/components/admin/FileUploader";
import { usePustakaBooks, type PustakaBook } from "@/lib/hooks/useFirestoreData";
import { Loader2, ExternalLink } from "lucide-react";

const EMPTY: Omit<PustakaBook, "id"> = {
  title: "", year: new Date().getFullYear(), category: "BUKU",
  description: "", pages: 0, previewText: "", fileUrl: "", fileStoragePath: "",
};

export default function AdminPustaka() {
  const { data: books, loading, add, update, remove } = usePustakaBooks();
  const [search, setSearch]           = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterYear, setFilterYear]   = useState("");
  const [modal, setModal]     = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState<PustakaBook | null>(null);
  const [form, setForm]       = useState<any>({ ...EMPTY });
  const [target, setTarget]   = useState<PustakaBook | null>(null);

  // Derive unique years from data for the year dropdown
  const yearOptions = useMemo(() =>
    [...new Set(books.map((b) => b.year))].sort((a, b) => b - a),
    [books]
  );

  const filtered = useMemo(() =>
    books.filter((b) => {
      if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory && b.category !== filterCategory) return false;
      if (filterYear && b.year !== Number(filterYear)) return false;
      return true;
    }),
    [books, search, filterCategory, filterYear]
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setModal(true);
  };

  const openEdit = (b: PustakaBook) => {
    setEditing(b);
    setForm({ ...b });
    setModal(true);
  };

  const handleSubmit = async () => {
    const entry = { ...form, pages: Number(form.pages), year: Number(form.year) };
    if (editing) {
      await update(editing.id, entry);
    } else {
      await add(entry);
    }
    setModal(false);
  };

  const handleDelete = async () => {
    if (!target) return;
    await remove(target.id);
    setTarget(null);
  };

  return (
    <AdminGuard>
      <AdminLayout title="Pustaka Digital">

        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "category", label: "Kategori", width: "90px",
                render: (r) => (
                  <span className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: "var(--gold-muted)", color: "var(--gold)" }}>
                    {r.category}
                  </span>
                ),
              },
              {
                key: "title", label: "Judul",
                render: (r) => (
                  <span className="font-serif font-semibold text-sm" style={{ color: "var(--brand)" }}>
                    {r.title}
                  </span>
                ),
              },
              { key: "year",  label: "Tahun", width: "70px" },
              { key: "pages", label: "Hal.",  width: "55px" },
              {
                key: "fileUrl", label: "PDF", width: "80px",
                render: (r) => r.fileUrl ? (
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: "var(--brand)" }}>
                    <ExternalLink className="h-3 w-3" /> Buka
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                ),
              },
            ]}
            data={filtered}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={(b) => { setTarget(b); setConfirm(true); }}
            addLabel="Tambah Dokumen"
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari judul..."
            emptyText="Belum ada dokumen."
            filters={
              <>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1"
                >
                  <option value="">Semua Kategori</option>
                  <option value="BUKU">BUKU</option>
                  <option value="MATERI">MATERI</option>
                  <option value="PANDUAN">PANDUAN</option>
                </select>

                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1"
                >
                  <option value="">Semua Tahun</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </>
            }
          />
        )}

        <FormModal
          open={modal}
          onOpenChange={setModal}
          title="Dokumen Pustaka"
          isEdit={!!editing}
          fields={[
            {
              key: "category", label: "Kategori", type: "select", required: true,
              options: [
                { value: "BUKU",    label: "BUKU"    },
                { value: "MATERI",  label: "MATERI"  },
                { value: "PANDUAN", label: "PANDUAN" },
              ],
            },
            { key: "title",       label: "Judul Dokumen",  required: true },
            { key: "year",        label: "Tahun Terbit",   type: "number" },
            { key: "pages",       label: "Jumlah Halaman", type: "number" },
            { key: "description", label: "Deskripsi",      type: "textarea", rows: 2 },
            { key: "previewText", label: "Teks Pratinjau", type: "textarea", rows: 3 },
          ]}
          values={form}
          onChange={(k, v) => setForm((f: any) => ({ ...f, [k]: v }))}
          onSubmit={handleSubmit}
        >
          {/* Upload PDF via Uploadthing */}
          <div className="mt-1">
            <FileUploader
              endpoint="pustakaUploader"
              label="File PDF (Uploadthing — gratis)"
              accept=".pdf,application/pdf"
              currentUrl={form.fileUrl}
              currentName={form.fileStoragePath}
              onUploadComplete={(result) => {
                setForm((f: any) => ({
                  ...f,
                  fileUrl:          result.url,
                  fileStoragePath:  result.name,
                }));
              }}
              onRemove={() => setForm((f: any) => ({ ...f, fileUrl: "", fileStoragePath: "" }))}
            />
          </div>
        </FormModal>

        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          description={`Hapus dokumen "${target?.title}"?`}
          onConfirm={handleDelete}
        />
      </AdminLayout>
    </AdminGuard>
  );
}