"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useBibleReadings, type BibleReading } from "@/lib/hooks/useFirestoreData";
import {
  BibleVerseSelector,
  emptySelection,
  refLabel,
  type VerseSelection,
} from "@/components/admin/ayat/BibleVerseSelector";
import { selToRef } from "@/lib/utils/adminAyat";
import { showToast } from "@/lib/utils/toast";
import {
  BookOpen, Plus, Trash2, Save, Check, Loader2,
  ChevronDown, ChevronUp, Link2, GripVertical,
  X, RefreshCw,
} from "lucide-react";
import { FieldLabel, SectionCard, SaveButton } from "./shared";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CrossRef {
  reference: string;
  note:      string;
}

interface ReadingDraft {
  id:        string;     // internal UI key
  reference: string;
  title:     string;
  verses:    { number: string; text: string }[];
  crossRefs: CrossRef[];
  sel:       VerseSelection;
  expanded:  boolean;
  loading:   boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newDraft(): ReadingDraft {
  return {
    id:        crypto.randomUUID(),
    reference: "",
    title:     "",
    verses:    [],
    crossRefs: [],
    sel:       emptySelection(),
    expanded:  true,
    loading:   false,
  };
}

function draftFromSaved(r: BibleReading): ReadingDraft {
  return {
    id:        crypto.randomUUID(),
    reference: r.reference,
    title:     r.title,
    verses:    r.verses,
    crossRefs: (r.crossRefs ?? []).map((c) => ({ reference: c.reference, note: c.note ?? "" })),
    sel:       emptySelection(),
    expanded:  false,
    loading:   false,
  };
}

// ─── CrossRefRow ──────────────────────────────────────────────────────────────

function CrossRefRow({
  crossRef,
  onChange,
  onDelete,
}: {
  crossRef: CrossRef;
  onChange: (updated: CrossRef) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={crossRef.reference}
        onChange={(e) => onChange({ ...crossRef, reference: e.target.value })}
        placeholder="mis. Roma 6:23"
        className="w-32 px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-1 shrink-0"
        style={{ focusRingColor: "var(--brand)" } as React.CSSProperties}
      />
      <input
        value={crossRef.note}
        onChange={(e) => onChange({ ...crossRef, note: e.target.value })}
        placeholder="Catatan singkat (opsional)"
        className="flex-1 px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-1"
      />
      <button
        onClick={onDelete}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── ReadingCard ──────────────────────────────────────────────────────────────

function ReadingCard({
  draft,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  draft:      ReadingDraft;
  index:      number;
  total:      number;
  onChange:   (updated: ReadingDraft) => void;
  onDelete:   () => void;
  onMoveUp:   () => void;
  onMoveDown: () => void;
}) {
  const hasContent = draft.reference.trim() !== "";

  // When selector changes, auto-fetch verses
  const handleSelChange = useCallback(async (sel: VerseSelection) => {
    const ref = selToRef(sel);
    onChange({ ...draft, sel, reference: ref, verses: [], loading: !!sel.bookSlug });
    if (!sel.bookSlug || !sel.chapter || !sel.verseFrom) return;

    try {
      const res  = await fetch(`/api/bible?book=${sel.bookSlug}&chapter=${sel.chapter}&from=${sel.verseFrom}&to=${sel.verseTo}`);
      const json = await res.json();
      if (res.ok && !json.error) {
        const verses = (json.verses as { verse: number; text: string }[]).map((v) => ({
          number: `${sel.chapter}:${v.verse}`,
          text:   v.text,
        }));
        onChange({ ...draft, sel, reference: ref, verses, loading: false });
      } else {
        onChange({ ...draft, sel, reference: ref, verses: [], loading: false });
      }
    } catch {
      onChange({ ...draft, sel, reference: ref, verses: [], loading: false });
    }
  }, [draft, onChange]);

  const addCrossRef = () => onChange({
    ...draft,
    crossRefs: [...draft.crossRefs, { reference: "", note: "" }],
  });

  const updateCrossRef = (i: number, updated: CrossRef) => {
    const next = [...draft.crossRefs];
    next[i] = updated;
    onChange({ ...draft, crossRefs: next });
  };

  const deleteCrossRef = (i: number) => {
    onChange({ ...draft, crossRefs: draft.crossRefs.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Card header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        style={{ backgroundColor: "var(--brand-muted)" }}
        onClick={() => onChange({ ...draft, expanded: !draft.expanded })}
      >
        {/* Drag handle (visual only) */}
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />

        {/* Index badge */}
        <span
          className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {index + 1}
        </span>

        {/* Title/reference */}
        <div className="flex-1 min-w-0">
          {hasContent ? (
            <p className="text-sm font-semibold truncate" style={{ color: "var(--brand)" }}>
              {draft.reference}{draft.title ? ` — ${draft.title}` : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">Bacaan baru (belum dipilih)</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-30"
            title="Pindah ke atas"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-30"
            title="Pindah ke bawah"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
            title="Hapus bacaan"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {draft.expanded
            ? <ChevronUp   className="h-4 w-4 text-muted-foreground ml-1" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />}
        </div>
      </div>

      {/* Expanded body */}
      {draft.expanded && (
        <div className="p-4 space-y-4 border-t border-border">

          {/* Selector perikop */}
          <div>
            <FieldLabel>Pilih Perikop</FieldLabel>
            <BibleVerseSelector
              value={draft.sel}
              onChange={handleSelChange}
              showPreview={false}
              compact
            />
          </div>

          {/* Preview referensi */}
          {draft.reference && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
              <span className="font-semibold" style={{ color: "var(--brand)" }}>{draft.reference}</span>
              {draft.loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              {!draft.loading && draft.verses.length > 0 && (
                <span className="text-xs text-muted-foreground">({draft.verses.length} ayat)</span>
              )}
            </div>
          )}

          {/* Judul perikop */}
          <div>
            <FieldLabel>Judul Perikop</FieldLabel>
            <input
              value={draft.title}
              onChange={(e) => onChange({ ...draft, title: e.target.value })}
              placeholder="mis. Kebenaran yang Memerdekakan"
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
            />
          </div>

          {/* Preview ayat */}
          {draft.verses.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5 max-h-40 overflow-y-auto">
              {draft.verses.map((v, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="font-bold shrink-0 pt-0.5" style={{ color: "var(--brand)" }}>
                    {v.number.split(":")[1]}
                  </span>
                  <p className="text-foreground leading-relaxed">{v.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Cross-references */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>
                <span className="flex items-center gap-1.5">
                  <Link2 className="h-3 w-3" /> Cross-Reference
                </span>
              </FieldLabel>
              <button
                onClick={addCrossRef}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                style={{ color: "var(--brand)" }}
              >
                <Plus className="h-3 w-3" /> Tambah
              </button>
            </div>

            {draft.crossRefs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Belum ada cross-reference. Klik "Tambah" untuk menambahkan.
              </p>
            ) : (
              <div className="space-y-2">
                {draft.crossRefs.map((cr, i) => (
                  <CrossRefRow
                    key={i}
                    crossRef={cr}
                    onChange={(u) => updateCrossRef(i, u)}
                    onDelete={() => deleteCrossRef(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function BacaanAlkitabSection() {
  const { data: saved, loading: dataLoading, save } = useBibleReadings();

  const [drafts,  setDrafts]  = useState<ReadingDraft[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [saved_,  setSaved_]  = useState(false);
  const [synced,  setSynced]  = useState(false);

  // Sync from Firestore on load
  useEffect(() => {
    if (!dataLoading && !synced) {
      setDrafts(saved.map(draftFromSaved));
      setSynced(true);
    }
  }, [dataLoading, saved, synced]);

  const updateDraft = useCallback((id: string, updated: ReadingDraft) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
  }, []);

  const deleteDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const moveUp = useCallback((index: number) => {
    setDrafts((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setDrafts((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const addReading = () => {
    setDrafts((prev) => [...prev, newDraft()]);
  };

  const handleReset = () => {
    setDrafts(saved.map(draftFromSaved));
    showToast.success("Perubahan dibatalkan.");
  };

  const handleSave = async () => {
    const items: BibleReading[] = drafts
      .filter((d) => d.reference.trim())
      .map((d) => ({
        reference: d.reference,
        title:     d.title,
        verses:    d.verses,
        crossRefs: d.crossRefs
          .filter((c) => c.reference.trim())
          .map((c) => ({ reference: c.reference.trim(), note: c.note.trim() || undefined })),
      }));

    setSaving(true);
    try {
      await save(items);
      setSaved_(true);
      showToast.success("Bacaan Alkitab berhasil disimpan!");
      setTimeout(() => setSaved_(false), 2500);
    } catch {
      showToast.error("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat bacaan...
      </div>
    );
  }

  return (
    <SectionCard title="Bacaan Alkitab Harian" icon={BookOpen}>
      <p className="text-xs text-muted-foreground -mt-2">
        Kelola daftar bacaan Alkitab beserta cross-reference untuk hari ini.
      </p>

      {/* Reading cards */}
      <div className="space-y-3">
        {drafts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            Belum ada bacaan. Klik "+ Tambah Bacaan" untuk mulai.
          </div>
        ) : (
          drafts.map((draft, index) => (
            <ReadingCard
              key={draft.id}
              draft={draft}
              index={index}
              total={drafts.length}
              onChange={(updated) => updateDraft(draft.id, updated)}
              onDelete={() => deleteDraft(draft.id)}
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <button
        onClick={addReading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:bg-muted/30"
        style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
      >
        <Plus className="h-4 w-4" /> Tambah Bacaan
      </button>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <SaveButton saving={saving} saved={saved_} onClick={handleSave} />
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </SectionCard>
  );
}