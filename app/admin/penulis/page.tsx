"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Image from "next/image";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FileUploader } from "@/components/admin/FileUploader";
import { useAuthors, useMinistries, type Author, type ServiceEntry } from "@/lib/hooks/useSupabaseData";
import { deleteFileByUrl } from "@/lib/storage";
import { TITLE_OPTIONS } from "@/lib/constants/authorOptions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, UserCircle, Plus, X, GripVertical } from "lucide-react";
import { showToast } from "@/lib/utils/toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthorRow = Author & { id: string };

const EMPTY_SERVICE: ServiceEntry = { ministryId: "", from: "", until: "Sekarang" };

const EMPTY: AuthorRow = {
  id: "", code: "", name: "", titles: [], photoUrl: "", serviceHistory: [{ ...EMPTY_SERVICE }],
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 60 }, (_, i) => String(CURRENT_YEAR - i));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dictToArray(dict: Record<string, any>): AuthorRow[] {
  return Object.entries(dict).map(([code, a]) => ({
    id:             code,
    code,
    name:           a.name           ?? "",
    // Migrasi legacy: title string → titles array
    titles:         Array.isArray(a.titles) ? a.titles
                      : a.title ? [a.title] : [],
    photoUrl:       a.photoUrl       ?? "",
    // Migrasi legacy: ministries + servedFrom/Until → serviceHistory
    serviceHistory: Array.isArray(a.serviceHistory) && a.serviceHistory.length > 0
                      ? a.serviceHistory
                      : Array.isArray(a.ministries) && a.ministries.length > 0
                        ? a.ministries.map((m: string) => ({
                            ministryId: m,
                            from:       a.servedFrom  ?? "",
                            until:      a.servedUntil ?? "Sekarang",
                          }))
                        : [{ ...EMPTY_SERVICE }],
  }));
}

function arrayToDict(arr: AuthorRow[]): Record<string, any> {
  return arr.reduce<Record<string, any>>((acc, a) => {
    acc[a.code] = {
      name:           a.name,
      titles:         a.titles,
      photoUrl:       a.photoUrl,
      serviceHistory: a.serviceHistory,
    };
    return acc;
  }, {});
}

// ─── Service History Row ──────────────────────────────────────────────────────
function ServiceRow({
  entry, index, ministryOptions, onChange, onRemove, canRemove,
}: {
  entry:           ServiceEntry;
  index:           number;
  ministryOptions: { value: string; label: string }[];
  onChange:        (i: number, field: keyof ServiceEntry, val: string) => void;
  onRemove:        (i: number) => void;
  canRemove:       boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <select
          value={entry.ministryId}
          onChange={(e) => onChange(index, "ministryId", e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none mb-1.5"
        >
          <option value="">Pilih lokasi pelayanan...</option>
          {ministryOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <select
            value={entry.from}
            onChange={(e) => onChange(index, "from", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background focus:outline-none"
          >
            <option value="">Mulai...</option>
            {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-muted-foreground text-xs shrink-0">–</span>
          <select
            value={entry.until}
            onChange={(e) => onChange(index, "until", e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background focus:outline-none"
          >
            <option value="Sekarang">Sekarang</option>
            {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPenulis() {
  const { data: authorsDict, loading: authLoading, save: saveDict, remove: removeAuthor } = useAuthors();
  const { data: ministries,  loading: minLoading  }                 = useMinistries();

  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState<AuthorRow | null>(null);
  const [form,    setForm]    = useState<AuthorRow>(EMPTY);
  const [target,  setTarget]  = useState<AuthorRow | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [pendingDeleteUrl, setPendingDeleteUrl] = useState("");

  useEffect(() => {
    if (!authLoading) setAuthors(dictToArray(authorsDict as Record<string, any>));
  }, [authLoading, authorsDict]);

  const persist = async (updated: AuthorRow[]) => {
    setSaving(true);
    setAuthors(updated);
    try {
      await saveDict(arrayToDict(updated) as any);
    } catch {
      showToast.error("Gagal menyimpan data penulis. Coba lagi.");
    }
    setSaving(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, serviceHistory: [{ ...EMPTY_SERVICE }] });
    setPendingDeleteUrl("");
    setModal(true);
  };

  const openEdit = (a: AuthorRow) => {
    setEditing(a);
    setForm({ ...a, serviceHistory: a.serviceHistory.length > 0 ? a.serviceHistory : [{ ...EMPTY_SERVICE }] });
    setPendingDeleteUrl("");
    setModal(true);
  };

  const openDelete = (a: AuthorRow) => { setTarget(a); setConfirm(true); };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) setPendingDeleteUrl("");
    setModal(open);
  };

  const handleSubmit = async () => {
    const isEdit = !!editing;
    if (pendingDeleteUrl) {
      try { await deleteFileByUrl(pendingDeleteUrl); } catch { /* tidak kritis */ }
      setPendingDeleteUrl("");
    }
    const next = isEdit
      ? authors.map((a) => (a.id === editing!.id ? { ...form, id: editing!.id } : a))
      : [...authors, { ...form, id: form.code || `${Date.now()}` }];
    setModal(false);
    await persist(next);
    showToast.success(isEdit ? `Penulis "${form.name}" berhasil diperbarui.` : `Penulis "${form.name}" berhasil ditambahkan.`);
  };

  const handleDelete = async () => {
    if (!target) return;
    const deletedCode     = target.code ?? target.id;
    const deletedName     = target.name;
    const deletedPhotoUrl = target.photoUrl;
    setTarget(null);
    try {
      if (deletedPhotoUrl) {
        try { await deleteFileByUrl(deletedPhotoUrl); } catch { /* foto tidak kritis */ }
      }
      await removeAuthor(deletedCode);
      showToast.success(`Penulis "${deletedName}" berhasil dihapus.`);
    } catch {
      showToast.error("Gagal menghapus penulis. Coba lagi.");
    }
  };

  // ─── Service history helpers ───────────────────────────────────────────────
  const updateService = (i: number, field: keyof ServiceEntry, val: string) => {
    const next = form.serviceHistory.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    setForm((f) => ({ ...f, serviceHistory: next }));
  };

  const addService = () =>
    setForm((f) => ({ ...f, serviceHistory: [...f.serviceHistory, { ...EMPTY_SERVICE }] }));

  const removeService = (i: number) =>
    setForm((f) => ({ ...f, serviceHistory: f.serviceHistory.filter((_, idx) => idx !== i) }));

  // ─── Title helpers ─────────────────────────────────────────────────────────
  const toggleTitle = (val: string) =>
    setForm((f) => ({
      ...f,
      titles: f.titles.includes(val) ? f.titles.filter((t) => t !== val) : [...f.titles, val],
    }));

  const ministryOptions = useMemo(() =>
    ministries.map((m) => ({ value: m.id, label: m.name })),
    [ministries],
  );

  const getMinistryName = (id: string) =>
    ministries.find((m) => m.id === id)?.name ?? id;

  const filtered = useMemo(() =>
    authors.filter((a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()),
    ),
    [authors, search],
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
              Live Supabase
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-10">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat data penulis...
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "photoUrl", label: "Foto", width: "56px",
                render: (a) => a.photoUrl
                  ? <Image src={a.photoUrl} alt={a.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-border" />
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
              {
                key: "titles", label: "Gelar",
                render: (a) => (
                  <div className="flex flex-wrap gap-1">
                    {a.titles.length === 0
                      ? <span className="text-xs text-muted-foreground italic">—</span>
                      : a.titles.map((t) => (
                          <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                            {t}
                          </span>
                        ))}
                  </div>
                ),
              },
              {
                key: "name", label: "Nama",
                render: (a) => <span className="font-medium">{a.name}</span>,
              },
              {
                key: "serviceHistory", label: "Riwayat Pelayanan",
                render: (a) => (
                  <div className="flex flex-col gap-0.5">
                    {a.serviceHistory.length === 0
                      ? <span className="text-xs text-muted-foreground italic">—</span>
                      : a.serviceHistory.slice(0, 2).map((s, i) => (
                          <span key={i} className="text-[10px] text-muted-foreground">
                            {getMinistryName(s.ministryId)} ({s.from || "?"} – {s.until})
                          </span>
                        ))}
                    {a.serviceHistory.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{a.serviceHistory.length - 2} lainnya</span>
                    )}
                  </div>
                ),
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

        {/* ── Form modal ───────────────────────────────────────────────────── */}
        <Dialog open={modal} onOpenChange={handleModalOpenChange}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Tambah"} Penulis</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              {/* Kode */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--gold)" }}>
                  Kode <span className="text-destructive">*</span>
                </label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="Contoh: IWM"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  disabled={!!editing}
                />
              </div>

              {/* Nama */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--gold)" }}>
                  Nama Lengkap <span className="text-destructive">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="I Wayan Mariasa"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                />
              </div>

              {/* Gelar — multiple toggle */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--gold)" }}>
                  Gelar (pilih semua yang sesuai)
                </p>
                <div className="flex flex-wrap gap-2">
                  {TITLE_OPTIONS.map((opt) => {
                    const active = form.titles.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleTitle(opt.value)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          active
                            ? "border-transparent text-white"
                            : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                        style={active ? { backgroundColor: "var(--brand)" } : {}}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {form.titles.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Dipilih: {form.titles.join(", ")}
                  </p>
                )}
              </div>

              {/* Riwayat Pelayanan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                    Riwayat Pelayanan
                  </p>
                  <button
                    type="button"
                    onClick={addService}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-border hover:border-foreground/30 text-muted-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Tambah Lokasi
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {form.serviceHistory.map((s, i) => (
                    <ServiceRow
                      key={i}
                      entry={s}
                      index={i}
                      ministryOptions={ministryOptions}
                      onChange={updateService}
                      onRemove={removeService}
                      canRemove={form.serviceHistory.length > 1}
                    />
                  ))}
                </div>
              </div>

              {/* Foto */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--gold)" }}>
                  Foto Penulis (opsional)
                </p>
                <FileUploader
                  folder="images"
                  currentUrl={form.photoUrl}
                  onUploadDone={(url) => {
                    if (form.photoUrl) setPendingDeleteUrl(form.photoUrl);
                    setForm((f) => ({ ...f, photoUrl: url }));
                  }}
                  onRemove={() => {
                    if (form.photoUrl) setPendingDeleteUrl(form.photoUrl);
                    setForm((f) => ({ ...f, photoUrl: "" }));
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => handleModalOpenChange(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!form.code || !form.name}
                className="px-4 py-2 text-sm rounded-lg text-white font-medium transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "var(--brand)" }}
              >
                {editing ? "Simpan Perubahan" : "Tambah Penulis"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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