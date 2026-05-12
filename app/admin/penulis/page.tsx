"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DataTable } from "@/components/admin/DataTable";
import { FormModal } from "@/components/admin/FormModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FileUploader } from "@/components/admin/FileUploader";
import { useAuthors, useMinistries, type Author, type Ministry } from "@/lib/hooks/useFirestoreData";
import { deleteUploadThingFile } from "@/lib/uploadthing-client";
import { Loader2, UserCircle, Calendar } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthorRow = Author & { id: string };

const EMPTY: AuthorRow = {
  id: "", code: "", name: "", title: "Pendeta",
  ministries: [], servedFrom: "", servedUntil: "Sekarang",
  photoUrl: "", ministry: "",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => {
  const y = String(CURRENT_YEAR - i);
  return { value: y, label: y };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dictToArray(dict: Record<string, any>): AuthorRow[] {
  return Object.entries(dict).map(([code, a]) => ({
    id:          code,
    code,
    name:        a.name        ?? "",
    title:       a.title       ?? "",
    ministries:  Array.isArray(a.ministries) ? a.ministries
                   : a.ministry ? [a.ministry] : [],
    servedFrom:  a.servedFrom  ?? "",
    servedUntil: a.servedUntil ?? "Sekarang",
    photoUrl:    a.photoUrl    ?? "",
    ministry:    a.ministry    ?? "",
  }));
}

function arrayToDict(arr: AuthorRow[]): Record<string, any> {
  return arr.reduce<Record<string, any>>((acc, a) => {
    acc[a.code] = {
      name:        a.name,
      title:       a.title,
      ministries:  a.ministries,
      servedFrom:  a.servedFrom,
      servedUntil: a.servedUntil,
      photoUrl:    a.photoUrl,
    };
    return acc;
  }, {});
}

function formatServicePeriod(a: AuthorRow): string {
  if (!a.servedFrom) return "";
  return `${a.servedFrom} – ${a.servedUntil || "Sekarang"}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPenulis() {
  const { data: authorsDict, loading: authLoading, save: saveDict } = useAuthors();
  const { data: ministries,  loading: minLoading  }                 = useMinistries();

  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState<AuthorRow | null>(null);
  const [form,    setForm]    = useState<AuthorRow>(EMPTY);
  const [target,  setTarget]  = useState<AuthorRow | null>(null);
  const [saving,  setSaving]  = useState(false);

  // URL foto lama yang akan dihapus dari UploadThing saat form di-submit.
  // Di-set saat user hapus/ganti foto — bukan langsung dihapus,
  // supaya kalau user cancel modal, file asli tidak ikut kehapus.
  const [pendingDeleteUrl, setPendingDeleteUrl] = useState("");

  useEffect(() => {
    if (!authLoading) setAuthors(dictToArray(authorsDict as Record<string, any>));
  }, [authLoading, authorsDict]);

  const persist = async (updated: AuthorRow[]) => {
    setSaving(true);
    setAuthors(updated);
    await saveDict(arrayToDict(updated) as any);
    setSaving(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setPendingDeleteUrl("");
    setModal(true);
  };

  const openEdit = (a: AuthorRow) => {
    setEditing(a);
    setForm(a);
    setPendingDeleteUrl("");
    setModal(true);
  };

  const openDelete = (a: AuthorRow) => { setTarget(a); setConfirm(true); };

  // Tutup modal tanpa save → buang pendingDeleteUrl (jangan hapus file asli)
  const handleModalOpenChange = (open: boolean) => {
    if (!open) setPendingDeleteUrl("");
    setModal(open);
  };

  const handleSubmit = async () => {
    // Baru hapus file lama dari UploadThing setelah user klik Save
    if (pendingDeleteUrl) {
      await deleteUploadThingFile(pendingDeleteUrl);
      setPendingDeleteUrl("");
    }
    const next = editing
      ? authors.map((a) => (a.id === editing.id ? { ...form, id: editing.id } : a))
      : [...authors, { ...form, id: form.code || `${Date.now()}` }];
    setModal(false);
    await persist(next);
  };

  const handleDelete = async () => {
    if (!target) return;
    // Simpan dulu sebelum di-null-kan
    const deletedId       = target.id;
    const deletedPhotoUrl = target.photoUrl;
    setTarget(null);
    if (deletedPhotoUrl) await deleteUploadThingFile(deletedPhotoUrl);
    await persist(authors.filter((a) => a.id !== deletedId));
  };

  const ministryOptions = useMemo(() =>
    ministries.map((m) => ({ value: m.id, label: m.name, group: m.category })),
    [ministries]
  );

  const getMinistryName = (id: string) =>
    ministries.find((m) => m.id === id)?.name ?? id;

  const filtered = useMemo(() =>
    authors.filter((a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    ),
    [authors, search]
  );

  const loading = authLoading || minLoading;

  return (
    <AdminGuard>
      <AdminLayout title="Penulis">
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {loading ? "Memuat..." : `${authors.length} penulis terdaftar`}
          </p>
          {saving && (
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--brand)" }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
            </span>
          )}
          {!loading && !saving && (
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
              Live Firestore
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-10">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "photoUrl", label: "Foto", width: "56px",
                render: (a) => a.photoUrl
                  ? <img src={a.photoUrl} alt={a.name} className="w-8 h-8 rounded-full object-cover border border-border" />
                  : <UserCircle className="w-8 h-8 text-muted-foreground" />,
              },
              {
                key: "code", label: "Kode", width: "72px",
                render: (a) => (
                  <span className="font-bold text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: "var(--brand-muted)", color: "var(--brand)" }}>
                    {a.code}
                  </span>
                ),
              },
              { key: "title", label: "Gelar", width: "80px" },
              {
                key: "name", label: "Nama",
                render: (a) => <span className="font-medium">{a.name}</span>,
              },
              {
                key: "ministries", label: "Pelayanan di",
                render: (a) => (
                  <div className="flex flex-wrap gap-1">
                    {a.ministries.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    ) : (
                      a.ministries.slice(0, 2).map((id) => (
                        <span key={id} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                          {getMinistryName(id)}
                        </span>
                      ))
                    )}
                    {a.ministries.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{a.ministries.length - 2}</span>
                    )}
                  </div>
                ),
              },
              {
                key: "servedFrom", label: "Periode", width: "130px",
                render: (a) => a.servedFrom ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {formatServicePeriod(a)}
                  </span>
                ) : <span className="text-xs text-muted-foreground italic">—</span>,
              },
            ]}
            data={filtered}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={openDelete}
            addLabel="Tambah Penulis"
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama atau kode..."
            emptyText="Belum ada penulis."
          />
        )}

        {/* ── Form modal ─────────────────────────────────────────────────── */}
        <FormModal
          open={modal}
          onOpenChange={handleModalOpenChange}
          title="Penulis"
          isEdit={!!editing}
          fields={[
            { key: "code",  label: "Kode (contoh: IWM)", placeholder: "IWM",             required: true },
            {
              key: "title", label: "Gelar", type: "select",
              options: [
                { value: "Pendeta",  label: "Pendeta"     },
                { value: "Vikaris",  label: "Vikaris"     },
                { value: "Ev.",      label: "Evangelis"   },
                { value: "Pnt.",     label: "Penatua"     },
                { value: "",         label: "Tanpa gelar" },
              ],
            },
            { key: "name",  label: "Nama Lengkap", placeholder: "I Wayan Mariasa",       required: true },
            {
              key:     "ministries",
              label:   "Unit Pelayanan",
              type:    "multi-select",
              options: ministryOptions,
            },
          ]}
          values={form}
          onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
          onSubmit={handleSubmit}
        >
          {/* Periode pelayanan */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--gold)" }}>
              Periode Pelayanan
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <select
                  value={form.servedFrom}
                  onChange={(e) => setForm((f) => ({ ...f, servedFrom: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                >
                  <option value="">Tahun mulai</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>
              <span className="text-muted-foreground text-sm shrink-0">sampai</span>
              <div className="flex-1">
                <select
                  value={form.servedUntil}
                  onChange={(e) => setForm((f) => ({ ...f, servedUntil: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                >
                  <option value="Sekarang">Sekarang</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Upload foto */}
          <div className="mt-1">
            <FileUploader
              endpoint="imageUploader"
              label="Foto Penulis (opsional)"
              accept="image/jpeg,image/png,image/webp"
              isImage
              currentUrl={form.photoUrl}
              onUploadComplete={(res) => {
                // Kalau ada foto lama (ganti foto), tandai untuk dihapus saat save
                if (form.photoUrl) setPendingDeleteUrl(form.photoUrl);
                setForm((f) => ({ ...f, photoUrl: res.url }));
              }}
              onRemove={() => {
                // Tandai untuk dihapus saat save — jangan langsung hapus
                // supaya kalau user cancel, file asli aman
                if (form.photoUrl) setPendingDeleteUrl(form.photoUrl);
                setForm((f) => ({ ...f, photoUrl: "" }));
              }}
            />
          </div>
        </FormModal>

        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          description={`Hapus penulis "${target?.name}" (${target?.code})? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={handleDelete}
        />
      </AdminLayout>
    </AdminGuard>
  );
}