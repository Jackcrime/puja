"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ConfirmDialog }  from "@/components/admin/ConfirmDialog";
import { useBibleReadings, usePerikop, type BibleReading } from "@/lib/hooks/useFirestoreData";
import { BibleVerseSelector, type VerseSelection, refLabel, emptySelection } from "./BibleVerseSelector";
import { formatRef, BIBLE_BOOKS } from "@/lib/bible-books";
import type { BiblePassageResponse } from "@/app/api/bible/route";
import { showToast } from "@/lib/utils/toast";
import {
  Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  X, Eye, BookOpen, Link2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PerikopRef {
  id:        string;
  bookSlug:  string;
  bookName:  string;
  chapter:   number;
  verseFrom: number;
  verseTo:   number;
  heading:   string;
}

interface ReadingWithPerikop extends BibleReading {
  perikopRefs?: PerikopRef[];  // kaitan perikop per bacaan
}

// ─── Perikop mini form (inline dalam form bacaan) ─────────────────────────────
function PerikopInlineEntry({
  entry,
  index,
  onChange,
  onRemove,
}: {
  entry:    PerikopRef;
  index:    number;
  onChange: (i: number, val: PerikopRef) => void;
  onRemove: (i: number) => void;
}) {
  const [sel,     setSel]     = useState<VerseSelection>({
    bookSlug: entry.bookSlug, bookName: entry.bookName,
    chapter: entry.chapter, verseFrom: entry.verseFrom, verseTo: entry.verseTo,
  });
  const [heading, setHeading] = useState(entry.heading);

  const commit = (newSel: VerseSelection, newHeading?: string) => {
    onChange(index, {
      ...entry,
      bookSlug:  newSel.bookSlug,
      bookName:  newSel.bookName,
      chapter:   newSel.chapter,
      verseFrom: newSel.verseFrom,
      verseTo:   newSel.verseTo,
      heading:   newHeading ?? heading,
    });
  };

  return (
    <div className="border border-dashed border-border rounded-xl p-4 space-y-3 bg-muted/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
          Perikop #{index + 1}
        </p>
        <button
          onClick={() => onRemove(index)}
          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <BibleVerseSelector
        value={sel}
        onChange={(newSel) => { setSel(newSel); commit(newSel); }}
        showPreview={true}
        compact={true}
      />

      <div>
        <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
          Judul Perikop / Keterangan
        </label>
        <input
          type="text"
          value={heading}
          placeholder="cth: Kaitan dengan Yesaya 53 — Hamba yang Menderita"
          onChange={(e) => { setHeading(e.target.value); commit(sel, e.target.value); }}
          className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
        />
      </div>
    </div>
  );
}

// ─── Reading Form (Bible API picker + perikop) ────────────────────────────────
function ReadingForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?:  ReadingWithPerikop;
  onSave:    (r: ReadingWithPerikop) => Promise<void>;
  onCancel:  () => void;
}) {
  const [sel,      setSel]      = useState<VerseSelection>(emptySelection());
  const [title,    setTitle]    = useState(initial?.title ?? "");
  const [preview,  setPreview]  = useState<BiblePassageResponse | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [perikops, setPerikops] = useState<PerikopRef[]>(initial?.perikopRefs ?? []);

  const addPerikop = () =>
    setPerikops((p) => [
      ...p,
      { id: `${Date.now()}`, bookSlug: "", bookName: "", chapter: 1, verseFrom: 1, verseTo: 1, heading: "" },
    ]);

  const updatePerikop = (i: number, val: PerikopRef) =>
    setPerikops((p) => p.map((x, idx) => idx === i ? val : x));

  const removePerikop = (i: number) =>
    setPerikops((p) => p.filter((_, idx) => idx !== i));

  const ref = refLabel(sel);

  const handleSave = async () => {
    if (!preview && !initial) return;
    setSaving(true);

    const reading: ReadingWithPerikop = preview
      ? {
          reference:   ref,
          title,
          verses:      preview.verses.map((v) => ({
            number: `${sel.chapter}:${v.verse}`,
            text:   v.text,
          })),
          perikopRefs: perikops.filter((p) => p.bookSlug),
        }
      : { ...(initial ?? { reference: "", title: "", verses: [] }), perikopRefs: perikops.filter((p) => p.bookSlug) };

    await onSave(reading);
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
            {initial ? "Edit Bacaan" : "Tambah Bacaan"}
          </p>
          <button onClick={onCancel} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Bible API selector */}
        <BibleVerseSelector
          value={sel}
          onChange={setSel}
          onPreview={setPreview}
          showPreview={true}
        />

        {/* Judul */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Judul Bacaan
          </label>
          <input
            type="text"
            placeholder="Kebenaran yang Memerdekakan"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
          />
        </div>

        {/* ── Perikop Terkait ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                Perikop Terkait ({perikops.length})
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kaitkan dengan bagian Alkitab lain yang berkaitan (cross-reference).
              </p>
            </div>
            <button
              onClick={addPerikop}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
              style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Tambah
            </button>
          </div>

          {perikops.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Belum ada perikop terkait. Klik "Tambah" untuk menambahkan cross-reference.
            </p>
          )}

          {perikops.map((p, i) => (
            <PerikopInlineEntry
              key={p.id}
              entry={p}
              index={i}
              onChange={updatePerikop}
              onRemove={removePerikop}
            />
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={(!preview && !initial) || saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--brand)" }}
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BacaanTab() {
  const { data, loading, save } = useBibleReadings();
  const [items,    setItems]    = useState<ReadingWithPerikop[]>([]);
  // const [synced,   setSynced]   = useState(false);
  const [form,     setForm]     = useState(false);
  const [editing,  setEditing]  = useState<{ index: number; data: ReadingWithPerikop } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirm,  setConfirm]  = useState(false);
  const [target,   setTarget]   = useState<number | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    if (!loading) setItems(data as ReadingWithPerikop[]);
  }, [loading, data]);

  const filtered = useMemo(() =>
    items.filter((r) =>
      !search ||
      r.reference.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase())
    ),
    [items, search]
  );

  const persist = async (updated: ReadingWithPerikop[]) => {
    setSaving(true);
    setItems(updated);
    try {
      await save(updated as BibleReading[]);
    } catch {
      showToast.error("Gagal menyimpan bacaan. Coba lagi.");
    }
    setSaving(false);
  };

  const handleSave = async (r: ReadingWithPerikop) => {
    const isEdit = editing !== null;
    const next = isEdit
      ? items.map((x, i) => i === editing!.index ? r : x)
      : [...items, r];
    setForm(false);
    setEditing(null);
    await persist(next);
    showToast.success(isEdit ? "Bacaan berhasil diperbarui." : "Bacaan baru berhasil ditambahkan.");
  };

  const handleDelete = async () => {
    if (target === null) return;
    await persist(items.filter((_, i) => i !== target));
    setTarget(null);
    showToast.success("Bacaan berhasil dihapus.");
  };

  const toggleExpand = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-10">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">{items.length} bacaan</p>
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
        {!form && (
          <button
            onClick={() => { setEditing(null); setForm(true); }}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <Plus className="h-4 w-4" /> Tambah Bacaan
          </button>
        )}
      </div>

      {/* Search */}
      {!form && items.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Cari referensi atau judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none"
          />
        </div>
      )}

      {form && (
        <ReadingForm
          initial={editing?.data}
          onSave={handleSave}
          onCancel={() => { setForm(false); setEditing(null); }}
        />
      )}

      {filtered.length === 0 ? (
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
                    <p className="font-serif font-semibold text-sm" style={{ color: "var(--brand)" }}>
                      {reading.reference}
                    </p>
                    {reading.title && (
                      <p className="text-xs text-muted-foreground">{reading.title}</p>
                    )}
                    {/* Perikop badges */}
                    {reading.perikopRefs && reading.perikopRefs.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reading.perikopRefs.map((p, pi) => (
                          <span
                            key={pi}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: "var(--brand-muted)", color: "var(--brand)" }}
                          >
                            <Link2 className="h-2.5 w-2.5" />
                            {p.bookName} {p.chapter}:{p.verseFrom}
                            {p.verseTo !== p.verseFrom ? `–${p.verseTo}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{reading.verses.length} ayat</span>
                  {expanded.has(i)
                    ? <ChevronUp   className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>
                <button
                  onClick={() => { setEditing({ index: i, data: reading }); setForm(true); }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setTarget(i); setConfirm(true); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {expanded.has(i) && (
                <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/20 space-y-4">
                  {/* Ayat-ayat */}
                  <div className="space-y-2">
                    {reading.verses.map((v, vi) => (
                      <div key={vi} className="flex items-start gap-3">
                        <span className="text-xs font-bold min-w-[2.5rem] pt-0.5 shrink-0" style={{ color: "var(--brand)" }}>
                          {v.number}
                        </span>
                        <p className="text-sm text-foreground leading-relaxed">{v.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Perikop terkait */}
                  {reading.perikopRefs && reading.perikopRefs.length > 0 && (
                    <div className="border-t border-border pt-3 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                        Perikop Terkait
                      </p>
                      {reading.perikopRefs.map((p, pi) => (
                        <div key={pi} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                          <Link2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--brand)" }} />
                          <div>
                            <p className="text-xs font-bold" style={{ color: "var(--brand)" }}>
                              {p.bookName} {p.chapter}:{p.verseFrom}
                              {p.verseTo !== p.verseFrom ? `–${p.verseTo}` : ""}
                            </p>
                            {p.heading && (
                              <p className="text-xs text-muted-foreground">{p.heading}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        description={target !== null ? `Hapus bacaan "${items[target]?.reference}"?` : ""}
        onConfirm={handleDelete}
      />
    </>
  );
}