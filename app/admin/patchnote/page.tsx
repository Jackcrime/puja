"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  usePatchNotesAdmin,
  PATCH_TYPE_LABEL, PATCH_TYPE_COLOR,
  type PatchNote, type PatchNoteItem, type PatchNoteType,
} from "@/lib/hooks/usePatchNotes";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus, Pencil, Trash2, Eye, EyeOff,
  ClipboardList, ChevronDown, X, GripVertical,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: PatchNoteType[] = ["new", "fix", "improve", "remove"];

const EMPTY_NOTE: Omit<PatchNote, "id"> = {
  version:   "",
  title:     "",
  date:      new Date().toISOString().slice(0, 10),
  items:     [{ type: "new", description: "" }],
  published: false,
};

// ─── Pill ─────────────────────────────────────────────────────────────────────

function TypePill({ type }: { type: PatchNoteType }) {
  const color = PATCH_TYPE_COLOR[type];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: `${color}50`, backgroundColor: `${color}12` }}
    >
      {PATCH_TYPE_LABEL[type]}
    </span>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormProps {
  initial: Omit<PatchNote, "id"> & { id?: string };
  onSave:  (data: Omit<PatchNote, "id">) => Promise<void>;
  onClose: () => void;
}

function PatchNoteForm({ initial, onSave, onClose }: FormProps) {
  const [form,    setForm]    = useState({ ...initial });
  const [saving,  setSaving]  = useState(false);

  const setField = (key: keyof typeof form, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  const setItem = (i: number, key: keyof PatchNoteItem, val: string) =>
    setForm((f) => {
      const items = [...f.items];
      items[i] = { ...items[i], [key]: val };
      return { ...f, items };
    });

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { type: "new", description: "" }] }));

  const removeItem = (i: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.version.trim()) { toast.error("Versi wajib diisi."); return; }
    if (!form.title.trim())   { toast.error("Judul wajib diisi.");  return; }
    if (!form.date)           { toast.error("Tanggal wajib diisi."); return; }
    const validItems = form.items.filter((it) => it.description.trim());
    if (validItems.length === 0) { toast.error("Minimal satu item perubahan."); return; }
    setSaving(true);
    await onSave({ ...form, items: validItems });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <ClipboardList className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
          <p className="font-bold flex-1">{initial.version ? `Edit v${initial.version}` : "Tambah Patch Note"}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Version + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Versi *</label>
              <input
                value={form.version}
                onChange={(e) => setField("version", e.target.value)}
                placeholder="contoh: 1.2.0"
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Tanggal *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Judul *</label>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="contoh: Pembaruan Konten & Perbaikan Bug"
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item Perubahan *</label>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                style={{ color: "var(--brand)", backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)" }}
              >
                <Plus className="h-3 w-3" /> Tambah
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-2.5 shrink-0" />
                  {/* Type select */}
                  <select
                    value={item.type}
                    onChange={(e) => setItem(i, "type", e.target.value)}
                    className="bg-muted/40 border border-border rounded-xl px-2 py-2 text-xs font-semibold focus:outline-none shrink-0"
                    style={{ color: PATCH_TYPE_COLOR[item.type] }}
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{PATCH_TYPE_LABEL[t]}</option>
                    ))}
                  </select>
                  <input
                    value={item.description}
                    onChange={(e) => setItem(i, "description", e.target.value)}
                    placeholder="Deskripsi perubahan..."
                    className="flex-1 bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  {form.items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors mt-0.5 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Published */}
          <label className="flex items-center gap-3 cursor-pointer select-none p-3 bg-muted/30 rounded-xl border border-border">
            <div
              onClick={() => setField("published", !form.published)}
              className="w-9 h-5 rounded-full relative transition-colors shrink-0"
              style={{ backgroundColor: form.published ? "var(--brand)" : "hsl(var(--muted))" }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                style={{ left: form.published ? "calc(100% - 18px)" : "2px" }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold">Publikasikan</p>
              <p className="text-[11px] text-muted-foreground">Tampilkan di halaman pengaturan publik</p>
            </div>
          </label>

        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted/50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--brand)" }}
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  note:     PatchNote;
  onEdit:   () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function PatchNoteCard({ note, onEdit, onDelete, onToggle }: CardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Version badge */}
        <div
          className="text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0"
          style={{ backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)", color: "var(--brand)" }}
        >
          v{note.version}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{note.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {note.date
              ? format(new Date(note.date), "d MMM yyyy", { locale: localeId })
              : "—"}{" "}
            · {note.items.length} perubahan
          </p>
        </div>

        {/* Published toggle */}
        <button
          onClick={onToggle}
          title={note.published ? "Dipublikasi — klik untuk sembunyikan" : "Draft — klik untuk publikasi"}
          className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
        >
          {note.published
            ? <Eye    className="h-4 w-4 text-green-500" />
            : <EyeOff className="h-4 w-4 text-muted-foreground" />
          }
        </button>
        <button onClick={onEdit}   className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0">
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </button>
        <button onClick={() => setExpanded((v) => !v)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0">
          <ChevronDown
            className="h-4 w-4 text-muted-foreground transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-1.5">
          {note.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <TypePill type={item.type} />
              <p className="text-sm text-muted-foreground leading-snug pt-0.5">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPatchNote() {
  const { data, loading, add, update, remove } = usePatchNotesAdmin();

  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<PatchNote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PatchNote | null>(null);

  const openAdd  = ()              => { setEditing(null); setShowForm(true); };
  const openEdit = (n: PatchNote)  => { setEditing(n);    setShowForm(true); };
  const closeForm = ()             => { setEditing(null); setShowForm(false); };

  const handleSave = async (formData: Omit<PatchNote, "id">) => {
    if (editing) {
      await update(editing.id, formData);
      toast.success("Patch note diperbarui.");
    } else {
      await add(formData);
      toast.success("Patch note ditambahkan.");
    }
  };

  const handleToggle = async (note: PatchNote) => {
    await update(note.id, { published: !note.published });
    toast.success(note.published ? "Disembunyikan dari publik." : "Dipublikasikan.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    toast.success("Patch note dihapus.");
    setDeleteTarget(null);
  };

  return (
    <AdminGuard>
      <AdminLayout title="Patch Note">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <ClipboardList className="h-4 w-4" style={{ color: "var(--gold)" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                  Kelola
                </p>
              </div>
              <h1 className="text-xl font-bold font-serif" style={{ color: "var(--brand)" }}>
                Patch Note
              </h1>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ backgroundColor: "var(--brand)" }}
            >
              <Plus className="h-4 w-4" /> Tambah
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Versi",    value: data.length },
              { label: "Dipublikasikan", value: data.filter((n) => n.published).length },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="text-2xl font-black tabular-nums" style={{ color: "var(--brand)" }}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada patch note.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.map((note) => (
                <PatchNoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => openEdit(note)}
                  onDelete={() => setDeleteTarget(note)}
                  onToggle={() => handleToggle(note)}
                />
              ))}
            </div>
          )}

        </div>
      </AdminLayout>

      {/* Form modal */}
      {showForm && (
        <PatchNoteForm
          initial={editing ?? EMPTY_NOTE}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Patch Note?"
        description={`Versi v${deleteTarget?.version} — ${deleteTarget?.title} akan dihapus permanen.`}
        onConfirm={handleDelete}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      />
    </AdminGuard>
  );
}