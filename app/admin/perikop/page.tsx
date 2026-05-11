"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout }    from "@/components/admin/AdminLayout";
import { AdminGuard }     from "@/components/admin/AdminGuard";
import { DataTable }      from "@/components/admin/DataTable";
import { ConfirmDialog }  from "@/components/admin/ConfirmDialog";
import { PerikopModal }   from "@/components/ui/PerikopModal";
import { usePerikop }     from "@/lib/hooks/useFirestoreData";
import { BIBLE_BOOKS, formatRef } from "@/lib/bible-books";
import { Loader2, BookOpen, Eye, Plus, Pencil, Trash2, X } from "lucide-react";
import type { BiblePassageResponse } from "@/app/api/bible/route";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Perikop {
  id:        string;
  bookSlug:  string;   // "1samuel"
  bookName:  string;   // "1 Samuel"
  chapter:   number;
  verseFrom: number;
  verseTo:   number;
  heading:   string;
}

const EMPTY: Perikop = {
  id: "", bookSlug: "", bookName: "", chapter: 1, verseFrom: 1, verseTo: 1, heading: "",
};

// ─── Inline Form (bukan modal — lebih nyaman untuk Perikop picker) ────────────
function PerikopForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Perikop;
  onSave: (p: Perikop) => Promise<void>;
  onCancel: () => void;
}) {
  const [form,    setForm]    = useState<Perikop>(initial);
  const [preview, setPreview] = useState<BiblePassageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [preErr,  setPreErr]  = useState("");

  const selectedBook = BIBLE_BOOKS.find((b) => b.slug === form.bookSlug);
  const chapterMax   = selectedBook?.chapters ?? 1;

  const set = (key: keyof Perikop, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleBookChange = (slug: string) => {
    const book = BIBLE_BOOKS.find((b) => b.slug === slug);
    setForm((f) => ({
      ...f,
      bookSlug: slug,
      bookName: book?.name ?? "",
      chapter: 1,
      verseFrom: 1,
      verseTo: 1,
    }));
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!form.bookSlug) return;
    setLoading(true);
    setPreErr("");
    setPreview(null);
    try {
      const url = `/api/bible?book=${form.bookSlug}&chapter=${form.chapter}&from=${form.verseFrom}&to=${form.verseTo}`;
      const res  = await fetch(url);
      const json = await res.json();
      if (!res.ok || json.error) { setPreErr(json.error ?? "Gagal memuat."); return; }
      setPreview(json);
    } catch { setPreErr("Tidak dapat menghubungi server."); }
    finally  { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.bookSlug || !form.heading) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const ref = form.bookSlug
    ? formatRef(form.bookName, form.chapter, form.verseFrom, form.verseTo)
    : "—";

  const PLbooks = BIBLE_BOOKS.filter((b) => b.testament === "PL");
  const PBbooks = BIBLE_BOOKS.filter((b) => b.testament === "PB");

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
            {initial.id ? "Edit Perikop" : "Tambah Perikop"}
          </p>
          <button onClick={onCancel} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pilih kitab */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Kitab
          </label>
          <select
            value={form.bookSlug}
            onChange={(e) => handleBookChange(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
          >
            <option value="">— Pilih kitab —</option>
            <optgroup label="Perjanjian Lama">
              {PLbooks.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </optgroup>
            <optgroup label="Perjanjian Baru">
              {PBbooks.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Chapter + verse range */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Pasal
            </label>
            <input
              type="number" min={1} max={chapterMax}
              value={form.chapter}
              onChange={(e) => set("chapter", Number(e.target.value))}
              disabled={!form.bookSlug}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50"
            />
            {selectedBook && (
              <p className="text-[10px] text-muted-foreground mt-1">maks {chapterMax}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Ayat mulai
            </label>
            <input
              type="number" min={1}
              value={form.verseFrom}
              onChange={(e) => set("verseFrom", Number(e.target.value))}
              disabled={!form.bookSlug}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Ayat selesai
            </label>
            <input
              type="number" min={form.verseFrom}
              value={form.verseTo}
              onChange={(e) => set("verseTo", Number(e.target.value))}
              disabled={!form.bookSlug}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Judul perikop */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Judul Perikop
          </label>
          <input
            type="text"
            placeholder="contoh: Puji-pujian Hana"
            value={form.heading}
            onChange={(e) => set("heading", e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
          />
        </div>

        {/* Referensi preview */}
        {form.bookSlug && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border">
            <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--brand)" }}>{ref}</span>
          </div>
        )}

        {/* Tombol Preview */}
        {form.bookSlug && (
          <div>
            <button
              onClick={handlePreview}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
              style={{ borderColor: "var(--brand-border)", color: "var(--brand)" }}
            >
              {loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat...</>
                : <><Eye className="h-3.5 w-3.5" /> Pratinjau Teks</>
              }
            </button>
            {preErr && <p className="text-xs text-red-500 mt-2">{preErr}</p>}
          </div>
        )}

        {/* Teks preview (inline, bukan modal) */}
        {preview && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p className="text-xs font-bold" style={{ color: "var(--brand)" }}>{ref}</p>
              {form.heading && <p className="text-xs text-muted-foreground">{form.heading}</p>}
            </div>
            <div className="px-4 py-3 max-h-52 overflow-y-auto space-y-2">
              {preview.verses.map((v) => (
                <p key={v.verse} className="text-sm leading-relaxed">
                  <span className="text-xs font-semibold mr-1.5 select-none"
                    style={{ color: "var(--brand)", opacity: 0.7 }}>
                    {form.chapter}:{v.verse}
                  </span>
                  {v.text}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!form.bookSlug || !form.heading || saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--brand)" }}
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan"}
          </button>
          <button onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPerikop() {
  const { data: raw, loading, save: saveFirestore } = usePerikop();

  const [items,   setItems]   = useState<Perikop[]>([]);
  const [search,  setSearch]  = useState("");
  const [form,    setForm]    = useState(false);   // show inline form
  const [editing, setEditing] = useState<Perikop | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [target,  setTarget]  = useState<Perikop | null>(null);
  const [saving,  setSaving]  = useState(false);
  // Perikop modal untuk preview dari tabel
  const [viewItem, setViewItem] = useState<Perikop | null>(null);

  useEffect(() => {
    if (!loading) {
      setItems(
        (raw as any[]).map((p: any, i) => ({
          id:        p.id ?? `p-${i}`,
          bookSlug:  p.bookSlug  ?? "",
          bookName:  p.bookName  ?? p.book ?? "",
          chapter:   Number(p.chapter   ?? 1),
          verseFrom: Number(p.verseFrom ?? p.verses?.split("-")[0] ?? 1),
          verseTo:   Number(p.verseTo   ?? p.verses?.split("-")[1] ?? p.verses?.split("-")[0] ?? 1),
          heading:   p.heading ?? "",
        }))
      );
    }
  }, [loading, raw]);

  const persist = async (updated: Perikop[]) => {
    setSaving(true);
    setItems(updated);
    await saveFirestore(updated as any);
    setSaving(false);
  };

  const handleSave = async (p: Perikop) => {
    const next = editing
      ? items.map((x) => (x.id === editing.id ? { ...p, id: editing.id } : x))
      : [...items, { ...p, id: `${Date.now()}` }];
    setForm(false);
    setEditing(null);
    await persist(next);
  };

  const handleDelete = async () => {
    if (!target) return;
    setTarget(null);
    await persist(items.filter((x) => x.id !== target.id));
  };

  const filtered = useMemo(() =>
    items.filter((p) =>
      !search ||
      p.bookName.toLowerCase().includes(search.toLowerCase()) ||
      p.heading.toLowerCase().includes(search.toLowerCase())
    ),
    [items, search]
  );

  const openAdd = () => { setEditing(null); setForm(true); };
  const openEdit = (p: Perikop) => { setEditing(p); setForm(true); };

  return (
    <AdminGuard>
      <AdminLayout title="Perikop">
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {loading ? "Memuat..." : `${items.length} perikop`}
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

        {/* Inline form */}
        {form && (
          <div className="mb-5">
            <PerikopForm
              initial={editing ?? { ...EMPTY }}
              onSave={handleSave}
              onCancel={() => { setForm(false); setEditing(null); }}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-10">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "bookName", label: "Kitab", width: "120px",
                render: (p) => <span className="font-semibold text-sm" style={{ color: "var(--brand)" }}>{p.bookName}</span>,
              },
              { key: "chapter", label: "Pasal", width: "60px" },
              {
                key: "verseFrom", label: "Ayat", width: "80px",
                render: (p) => (
                  <span className="text-sm text-muted-foreground">
                    {p.verseFrom === p.verseTo ? p.verseFrom : `${p.verseFrom}–${p.verseTo}`}
                  </span>
                ),
              },
              {
                key: "heading", label: "Judul Perikop",
                render: (p) => <span className="text-sm">{p.heading}</span>,
              },
              {
                key: "preview", label: "Teks", width: "70px",
                render: (p) => p.bookSlug ? (
                  <button
                    onClick={() => setViewItem(p)}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border hover:bg-muted transition-colors"
                    style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
                  >
                    <BookOpen className="h-3 w-3" /> TB
                  </button>
                ) : null,
              },
            ]}
            data={filtered}
            onAdd={!form ? openAdd : undefined}
            onEdit={openEdit}
            onDelete={(p) => { setTarget(p); setConfirm(true); }}
            addLabel="Tambah Perikop"
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari kitab atau judul..."
            emptyText="Belum ada perikop."
          />
        )}

        {/* Confirm delete */}
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          description={`Hapus perikop "${target?.bookName} ${target?.chapter}:${target?.verseFrom}"?`}
          onConfirm={handleDelete}
        />

        {/* Preview modal dari tabel */}
        {viewItem && (
          <PerikopModal
            open={!!viewItem}
            onOpenChange={(v) => { if (!v) setViewItem(null); }}
            bookSlug={viewItem.bookSlug}
            bookName={viewItem.bookName}
            chapter={viewItem.chapter}
            verseFrom={viewItem.verseFrom}
            verseTo={viewItem.verseTo}
            heading={viewItem.heading}
          />
        )}
      </AdminLayout>
    </AdminGuard>
  );
}