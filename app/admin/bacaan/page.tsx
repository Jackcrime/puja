"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout }   from "@/components/admin/AdminLayout";
import { AdminGuard }    from "@/components/admin/AdminGuard";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useBibleReadings, type BibleReading } from "@/lib/hooks/useFirestoreData";
import { BIBLE_BOOKS, formatRef } from "@/lib/bible-books";
import type { BiblePassageResponse } from "@/app/api/bible/route";
import {
  Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  X, Eye, BookOpen, AlertCircle,
} from "lucide-react";

// ─── Reading Form (Bible API picker) ─────────────────────────────────────────
interface ReadingDraft {
  bookSlug:  string;
  bookName:  string;
  chapter:   number;
  verseFrom: number;
  verseTo:   number;
  title:     string;
}

const EMPTY_DRAFT: ReadingDraft = {
  bookSlug: "", bookName: "", chapter: 1, verseFrom: 1, verseTo: 1, title: "",
};

function ReadingForm({
  initial, onSave, onCancel,
}: {
  initial?: BibleReading;
  onSave: (r: BibleReading) => Promise<void>;
  onCancel: () => void;
}) {
  // Parse initial BibleReading back to draft if editing
  const initDraft: ReadingDraft = initial
    ? { bookSlug: "", bookName: initial.reference.split(" ")[0] ?? "", chapter: 1, verseFrom: 1, verseTo: 1, title: initial.title }
    : { ...EMPTY_DRAFT };

  const [draft,   setDraft]   = useState<ReadingDraft>(initDraft);
  const [preview, setPreview] = useState<BiblePassageResponse | null>(null);
  const [preErr,  setPreErr]  = useState("");
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [noKey,   setNoKey]   = useState(false);

  const PLbooks = BIBLE_BOOKS.filter((b) => b.testament === "PL");
  const PBbooks = BIBLE_BOOKS.filter((b) => b.testament === "PB");
  const selectedBook  = BIBLE_BOOKS.find((b) => b.slug === draft.bookSlug);
  const chapterMax    = selectedBook?.chapters ?? 1;

  const set = (key: keyof ReadingDraft, val: any) =>
    setDraft((f) => ({ ...f, [key]: val }));

  const handleBookChange = (slug: string) => {
    const book = BIBLE_BOOKS.find((b) => b.slug === slug);
    setDraft({ ...EMPTY_DRAFT, bookSlug: slug, bookName: book?.name ?? "", title: draft.title });
    setPreview(null); setPreErr("");
  };

  const refLabel = draft.bookSlug
    ? formatRef(draft.bookName, draft.chapter, draft.verseFrom, draft.verseTo)
    : "—";

  const handlePreview = async () => {
    if (!draft.bookSlug) return;
    setLoading(true); setPreErr(""); setPreview(null); setNoKey(false);
    try {
      const url = `/api/bible?book=${draft.bookSlug}&chapter=${draft.chapter}&from=${draft.verseFrom}&to=${draft.verseTo}`;
      const res  = await fetch(url);
      const json = await res.json();
      if (!res.ok || json.error) {
        if (res.status === 503) setNoKey(true);
        setPreErr(json.error ?? "Gagal memuat.");
        return;
      }
      setPreview(json);
    } catch { setPreErr("Tidak dapat menghubungi server."); }
    finally  { setLoading(false); }
  };

  const handleSave = async () => {
    if (!preview && !draft.bookSlug) return;
    setSaving(true);

    const reading: BibleReading = preview
      ? {
          reference: refLabel,
          title:     draft.title,
          verses:    preview.verses.map((v) => ({
            number: `${draft.chapter}:${v.verse}`,
            text:   v.text,
          })),
        }
      : initial ?? { reference: "", title: "", verses: [] };

    await onSave(reading);
    setSaving(false);
  };

  const canSave = (preview || initial) && draft.bookSlug || (initial && !draft.bookSlug);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
            {initial ? "Edit Bacaan" : "Tambah Bacaan"}
          </p>
          <button onClick={onCancel} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* No API Key warning */}
        {noKey && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-semibold">LAI_BIBLE_API_KEY</span> belum di-set di <code>.env.local</code>. 
              Tambah dulu setelah email dibalas LAI. Preview tidak tersedia sementara.
            </p>
          </div>
        )}

        {/* Pilih kitab */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Kitab</label>
          <select value={draft.bookSlug} onChange={(e) => handleBookChange(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none">
            <option value="">— Pilih kitab —</option>
            <optgroup label="Perjanjian Lama">
              {PLbooks.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </optgroup>
            <optgroup label="Perjanjian Baru">
              {PBbooks.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </optgroup>
          </select>
        </div>

        {/* Pasal + ayat */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Pasal</label>
            <input type="number" min={1} max={chapterMax} value={draft.chapter}
              onChange={(e) => set("chapter", Number(e.target.value))}
              disabled={!draft.bookSlug}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50" />
            {selectedBook && <p className="text-[10px] text-muted-foreground mt-1">maks {chapterMax}</p>}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Ayat mulai</label>
            <input type="number" min={1} value={draft.verseFrom}
              onChange={(e) => set("verseFrom", Number(e.target.value))}
              disabled={!draft.bookSlug}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Ayat selesai</label>
            <input type="number" min={draft.verseFrom} value={draft.verseTo}
              onChange={(e) => set("verseTo", Number(e.target.value))}
              disabled={!draft.bookSlug}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none disabled:opacity-50" />
          </div>
        </div>

        {/* Judul */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Judul Bacaan</label>
          <input type="text" placeholder="Kebenaran yang Memerdekakan" value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none" />
        </div>

        {/* Referensi badge */}
        {draft.bookSlug && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border">
            <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--brand)" }}>{refLabel}</span>
          </div>
        )}

        {/* Preview button */}
        {draft.bookSlug && (
          <div>
            <button onClick={handlePreview} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
              style={{ borderColor: "var(--brand-border)", color: "var(--brand)" }}>
              {loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat...</>
                : <><Eye className="h-3.5 w-3.5" /> Pratinjau Teks</>}
            </button>
            {preErr && !noKey && <p className="text-xs text-red-500 mt-2">{preErr}</p>}
          </div>
        )}

        {/* Preview teks */}
        {preview && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p className="text-xs font-bold" style={{ color: "var(--brand)" }}>{refLabel}</p>
              {draft.title && <p className="text-xs text-muted-foreground">{draft.title}</p>}
            </div>
            <div className="px-4 py-3 max-h-52 overflow-y-auto space-y-2">
              {preview.verses.map((v) => (
                <p key={v.verse} className="text-sm leading-relaxed">
                  <span className="text-xs font-semibold mr-1.5 select-none" style={{ color: "var(--brand)", opacity: 0.7 }}>
                    {draft.chapter}:{v.verse}
                  </span>
                  {v.text}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={(!preview && !initial) || saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--brand)" }}>
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
export default function AdminBacaan() {
  const { data, loading, save } = useBibleReadings();
  const [items, setItems]       = useState<BibleReading[]>([]);
  const [synced, setSynced]     = useState(false);
  const [form, setForm]         = useState(false);
  const [editing, setEditing]   = useState<{ index: number; data: BibleReading } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirm, setConfirm]   = useState(false);
  const [target, setTarget]     = useState<number | null>(null);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");

  useEffect(() => { if (!loading && !synced) { setItems(data); setSynced(true); } }, [loading, data, synced]);

  const filtered = useMemo(() =>
    items.filter((r) => !search || r.reference.toLowerCase().includes(search.toLowerCase()) || r.title.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const persist = async (updated: BibleReading[]) => {
    setSaving(true); setItems(updated); await save(updated); setSaving(false);
  };

  const handleSave = async (r: BibleReading) => {
    const next = editing !== null
      ? items.map((x, i) => i === editing.index ? r : x)
      : [...items, r];
    setForm(false); setEditing(null);
    await persist(next);
  };

  const handleDelete = async () => {
    if (target === null) return;
    await persist(items.filter((_, i) => i !== target));
    setTarget(null);
  };

  const toggleExpand = (i: number) =>
    setExpanded((prev) => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });

  return (
    <AdminGuard>
      <AdminLayout title="Bacaan Alkitab">
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">{loading ? "Memuat..." : `${items.length} bacaan`}</p>
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
          {!form && (
            <button onClick={() => { setEditing(null); setForm(true); }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: "var(--brand)" }}>
              <Plus className="h-4 w-4" /> Tambah Bacaan
            </button>
          )}
        </div>

        {/* Search */}
        {!form && items.length > 0 && (
          <div className="mb-4">
            <input type="text" placeholder="Cari referensi atau judul..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none" />
          </div>
        )}

        {form && (
          <ReadingForm
            initial={editing?.data}
            onSave={handleSave}
            onCancel={() => { setForm(false); setEditing(null); }}
          />
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-10">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{items.length === 0 ? "Belum ada bacaan." : "Tidak ditemukan."}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((reading, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggleExpand(i)} className="flex-1 flex items-center gap-3 text-left">
                    <div className="flex-1">
                      <p className="font-serif font-semibold text-sm" style={{ color: "var(--brand)" }}>{reading.reference}</p>
                      {reading.title && <p className="text-xs text-muted-foreground">{reading.title}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{reading.verses.length} ayat</span>
                    {expanded.has(i) ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  <button onClick={() => { setEditing({ index: i, data: reading }); setForm(true); }}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { setTarget(i); setConfirm(true); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {expanded.has(i) && (
                  <div className="px-4 pb-4 pt-1 border-t border-border space-y-2 bg-muted/20">
                    {reading.verses.map((v, vi) => (
                      <div key={vi} className="flex items-start gap-3">
                        <span className="text-xs font-bold min-w-[2.5rem] pt-0.5 shrink-0" style={{ color: "var(--brand)" }}>{v.number}</span>
                        <p className="text-sm text-foreground leading-relaxed">{v.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={confirm} onOpenChange={setConfirm}
          description={target !== null ? `Hapus bacaan "${items[target]?.reference}"?` : ""}
          onConfirm={handleDelete}
        />
      </AdminLayout>
    </AdminGuard>
  );
}