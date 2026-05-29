"use client";

import React, { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DataTable } from "@/components/admin/DataTable";
import { FormModal } from "@/components/admin/FormModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FileUploader } from "@/components/admin/FileUploader";
import { usePustakaBooks, type PustakaBook } from "@/lib/hooks/useSupabaseData";
import { deleteUploadThingFile } from "@/lib/uploadthing-client";
import { Loader2, ExternalLink } from "lucide-react";
import { showToast } from "@/lib/utils/toast";

const EMPTY: Omit<PustakaBook, "id"> = {
  title: "", year: new Date().getFullYear(), category: "BUKU",
  description: "", pages: 0, previewText: "", fileUrl: "", fileStoragePath: "",
};

export default function AdminPustaka() {
  const { data: books, loading, add, update, remove } = usePustakaBooks();
  const [search, setSearch]                 = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterYear, setFilterYear]         = useState("");
  const [modal, setModal]     = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState<PustakaBook | null>(null);
  const [form, setForm]       = useState<any>({ ...EMPTY });
  const [target, setTarget]   = useState<PustakaBook | null>(null);

  // URL file lama yang akan dihapus dari UploadThing saat form di-submit.
  // Di-set saat user hapus/ganti file — bukan langsung dihapus,
  // supaya kalau user cancel modal, file asli tidak ikut kehapus.
  const [pendingDeleteUrl, setPendingDeleteUrl] = useState("");

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
    setPendingDeleteUrl("");
    setModal(true);
  };

  const openEdit = (b: PustakaBook) => {
    setEditing(b);
    setForm({ ...b });
    setPendingDeleteUrl("");
    setModal(true);
  };

  // Tutup modal tanpa save → buang pendingDeleteUrl (jangan hapus file asli)
  const handleModalOpenChange = (open: boolean) => {
    if (!open) setPendingDeleteUrl("");
    setModal(open);
  };

  const handleSubmit = async () => {
    const isEdit = !!editing;
    // Baru hapus file lama dari UploadThing setelah user klik Save
    if (pendingDeleteUrl) {
      await deleteUploadThingFile(pendingDeleteUrl);
      setPendingDeleteUrl("");
    }
    const entry = { ...form, pages: Number(form.pages), year: Number(form.year) };
    try {
      if (isEdit) {
        await update(editing!.id, entry);
        showToast.success(`Buku "${form.title}" berhasil diperbarui.`);
      } else {
        await add(entry);
        showToast.success(`Buku "${form.title}" berhasil ditambahkan.`);
      }
    } catch {
      showToast.error("Gagal menyimpan buku. Coba lagi.");
    }
    setModal(false);
  };

  const handleDelete = async () => {
    if (!target) return;
    const deletedId      = target.id;
    const deletedTitle   = target.title;
    const deletedFileUrl = target.fileUrl;
    setTarget(null);
    try {
      if (deletedFileUrl) await deleteUploadThingFile(deletedFileUrl);
      await remove(deletedId);
      showToast.success(`Buku "${deletedTitle}" berhasil dihapus.`);
    } catch {
      showToast.error("Gagal menghapus buku. Coba lagi.");
    }
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
          onOpenChange={handleModalOpenChange}
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
                // Kalau ada file lama (ganti file), tandai untuk dihapus saat save
                if (form.fileUrl) setPendingDeleteUrl(form.fileUrl);
                setForm((f: any) => ({
                  ...f,
                  fileUrl:         result.url,
                  fileStoragePath: result.name,
                }));
              }}
              onRemove={() => {
                // Tandai untuk dihapus saat save — jangan langsung hapus
                // supaya kalau user cancel, file asli aman
                if (form.fileUrl) setPendingDeleteUrl(form.fileUrl);
                setForm((f: any) => ({ ...f, fileUrl: "", fileStoragePath: "" }));
              }}
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