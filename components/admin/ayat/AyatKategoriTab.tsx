"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { DataTable }      from "@/components/admin/DataTable";
import { FormModal }      from "@/components/admin/FormModal";
import { ConfirmDialog }  from "@/components/admin/ConfirmDialog";
import { useAyatCategories, useAyatNats, type AyatNatsItem } from "@/lib/hooks/useSupabaseData";
import { BibleVerseSelector, type VerseSelection, emptySelection, effectiveVerses, refLabel } from "@/components/admin/ayat/BibleVerseSelector";
import { AyatNatsScheduleSection } from "@/components/admin/ayat/AyatNatsScheduleSection";
import { parseReference } from "@/lib/bible-books";

import {
  Loader2, Flame, Plus, Trash2, Save, Check,
  Upload, Download, FileJson, AlertCircle, X, GripVertical, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react";
import { showToast } from "@/lib/utils/toast";

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

// ─── Nats Item Card ───────────────────────────────────────────────────────────

interface NatsDraft {
  id:           string;
  reference:    string;
  text:         string;
  sel:          VerseSelection;
  loadingVerse: boolean;
  expanded:     boolean;
}

function emptyNatsDraft(): NatsDraft {
  return {
    id: crypto.randomUUID(), reference: "", text: "",
    sel: emptySelection(), loadingVerse: false, expanded: true,
  };
}

function natsDraftFromItem(it: AyatNatsItem): NatsDraft {
  return {
    id: it.id, reference: it.reference, text: it.text,
    sel: emptySelection(), loadingVerse: false, expanded: false,
  };
}

/** Fetch ayat verseFrom–verseTo lalu gabung sebagai "ch:v teks ch:v+1 teks..." */
async function fetchVerseText(
  bookSlug: string, chapter: number, verseFrom: number, verseTo: number
): Promise<string | null> {
  try {
    const res  = await fetch(`/api/bible?book=${bookSlug}&chapter=${chapter}&from=${verseFrom}&to=${verseTo}`);
    const json = await res.json();
    if (!res.ok || json.error || !json.verses?.length) return null;
    return (json.verses as { verse: number; text: string }[])
      .map((v) => `${chapter}:${v.verse} ${v.text}`)
      .join(" ");
  } catch { return null; }
}

function NatsItemCard({
  draft, index, total,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  draft:      NatsDraft;
  index:      number;
  total:      number;
  onChange:   (d: NatsDraft) => void;
  onDelete:   () => void;
  onMoveUp:   () => void;
  onMoveDown: () => void;
}) {
  const hasContent = draft.reference.trim() !== "";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saat BibleVerseSelector berubah → auto-fetch teks semua ayat
  const handleSelChange = useCallback(async (sel: VerseSelection) => {
    if (!sel.bookSlug) { onChange({ ...draft, sel }); return; }
    const ref = refLabel(sel);
    const { from, to } = effectiveVerses(sel);
    onChange({ ...draft, sel, reference: ref, loadingVerse: true });
    const text = await fetchVerseText(sel.bookSlug, sel.chapter, from, to);
    onChange({ ...draft, sel, reference: ref, loadingVerse: false, text: text ?? draft.text });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Saat referensi diketik manual → debounce parse → update sel + re-fetch
  const handleReferenceChange = (raw: string) => {
    onChange({ ...draft, reference: raw });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const parsed = parseReference(raw);
      if (!parsed) return;
      const sel: VerseSelection = {
        bookSlug:  parsed.book.slug,
        bookName:  parsed.book.name,
        chapter:   parsed.chapter,
        verseFrom: parsed.verseFrom,
        verseTo:   parsed.verseTo,
      };
      onChange({ ...draft, reference: raw, sel, loadingVerse: true });
      const { from, to } = effectiveVerses(sel);
      const text = await fetchVerseText(sel.bookSlug, sel.chapter, from, to);
      onChange({ ...draft, reference: raw, sel, loadingVerse: false, text: text ?? draft.text });
    }, 800);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Collapsed header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        style={{ backgroundColor: "var(--brand-muted)" }}
        onClick={() => onChange({ ...draft, expanded: !draft.expanded })}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <span
          className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          {hasContent
            ? <p className="text-sm font-semibold truncate" style={{ color: "var(--brand)" }}>{draft.reference}</p>
            : <p className="text-xs text-muted-foreground italic">Nats baru (belum dipilih)</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {draft.loadingVerse && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <button onClick={onMoveUp} disabled={index === 0} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
          {draft.expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />}
        </div>
      </div>

      {/* Expanded form */}
      {draft.expanded && (
        <div className="p-4 space-y-4 border-t border-border">
          {/* BibleVerseSelector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--gold)" }}>
              Pilih Ayat Nats
            </label>
            <BibleVerseSelector
              value={draft.sel}
              onChange={handleSelChange}
              showPreview={false}
            />
          </div>

          {/* Referensi (bisa diedit manual, auto-sync ke selector & teks) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Referensi
            </label>
            <div className="relative">
              <input
                value={draft.reference}
                onChange={(e) => handleReferenceChange(e.target.value)}
                placeholder="mis. Ulangan 14:28–29"
                className="w-full px-3 py-2 pr-8 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 font-semibold"
                style={{ color: "var(--brand)" }}
              />
              {draft.loadingVerse && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Otomatis terisi dari selector. Bisa diedit manual — ayat akan diambil ulang.
            </p>
          </div>

          {/* Teks ayat nats */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Teks Ayat Nats
            </label>
            <textarea
              rows={4}
              value={draft.text}
              onChange={(e) => onChange({ ...draft, text: e.target.value })}
              placeholder="Teks ayat nats otomatis terisi saat referensi dipilih..."
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 resize-none font-serif leading-relaxed"
            />
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Terisi otomatis dari API · format: <code className="bg-muted px-1 rounded">14:28 teks... 14:29 teks...</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ayat Nats Section ────────────────────────────────────────────────────────

function AyatNatsSection() {
  const { data, loading, save } = useAyatNats();
  const [drafts,       setDrafts]       = useState<NatsDraft[]>([]);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [synced,       setSynced]       = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "ok" | "err">("idle");
  const [importErr,    setImportErr]    = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !synced) {
      setDrafts((data.items ?? []).map(natsDraftFromItem));
      setSynced(true);
    }
  }, [loading, data, synced]);

  const updateDraft = useCallback((id: string, updated: NatsDraft) =>
    setDrafts((p) => p.map((d) => d.id === id ? updated : d)), []);
  const deleteDraft = useCallback((id: string) =>
    setDrafts((p) => p.filter((d) => d.id !== id)), []);
  const moveUp      = useCallback((i: number) =>
    setDrafts((p) => { const n = [...p]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n; }), []);
  const moveDown    = useCallback((i: number) =>
    setDrafts((p) => { const n = [...p]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n; }), []);

  const handleSave = async () => {
    const valid = drafts.filter((d) => d.reference.trim() && d.text.trim());
    if (valid.length === 0) { showToast.error("Isi minimal satu Ayat Nats."); return; }
    setSaving(true);
    try {
      const items: AyatNatsItem[] = valid.map((d) => ({
        id:        d.id,
        reference: d.reference,
        text:      d.text,
      }));
      await save({ items });
      showToast.success(`${valid.length} Ayat Nats berhasil disimpan.`);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false);
  };

  const processImport = async (raw: string) => {
    setImportStatus("idle"); setImportErr("");
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Format harus berupa array.");
      parsed.forEach((it: any, i: number) => {
        if (!it.reference) throw new Error(`Item ${i + 1}: field 'reference' wajib.`);
        if (!it.text)      throw new Error(`Item ${i + 1}: field 'text' wajib.`);
      });
      const items: AyatNatsItem[] = parsed.map((it: any, i: number) => ({
        id: it.id ?? `${Date.now()}-${i}`, reference: it.reference, text: it.text,
      }));
      await save({ items });
      setDrafts(items.map(natsDraftFromItem));
      setSynced(true);
      setImportStatus("ok");
      showToast.success(`${items.length} Ayat Nats diimport.`);
    } catch (e: any) {
      setImportStatus("err");
      setImportErr(e.message ?? "JSON tidak valid.");
    }
    setTimeout(() => setImportStatus("idle"), 3500);
  };

  const handleFile = (files: FileList | null) => {
    const f = files?.[0]; if (!f) return;
    if (!f.name.endsWith(".json")) { setImportStatus("err"); setImportErr("File harus .json"); return; }
    f.text().then(processImport);
  };

  const handleExport = () => {
    const items = drafts.map(({ id, reference, text }) => ({ id, reference, text }));
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "ayat-nats.json"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-4 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> Memuat Ayat Nats...
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-border"
        style={{ backgroundColor: "var(--brand-muted)" }}
      >
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>
            Ayat Nats
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
            {drafts.length} nats — tampil di halaman renungan
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
            style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
          >
            {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>
             : saved ? <><Check className="h-3 w-3" /> Tersimpan ✓</>
             :          <><Save className="h-3 w-3" /> Simpan</>}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <AyatNatsScheduleSection /> 
        {/* Nats cards */}
        <div className="space-y-3">
          {drafts.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              Belum ada Ayat Nats. Klik &quot;+ Tambah Nats&quot; untuk mulai, atau import JSON.
            </div>
          )}
          {drafts.map((draft, index) => (
            <NatsItemCard
              key={draft.id}
              draft={draft}
              index={index}
              total={drafts.length}
              onChange={(updated) => updateDraft(draft.id, updated)}
              onDelete={() => deleteDraft(draft.id)}
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
            />
          ))}
        </div>

        <button
          onClick={() => setDrafts((p) => [...p, emptyNatsDraft()])}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
          style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Nats
        </button>

        {/* Import/Export panel */}
        <div className="border border-dashed border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "var(--brand-muted)" }}>
            <FileJson className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--brand)" }}>
              Import / Export — Ayat Nats
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center gap-2 py-5 px-4 text-center"
              style={{
                borderColor:     dragOver ? "var(--brand)" : "var(--border)",
                backgroundColor: dragOver ? "var(--brand-muted)" : "transparent",
              }}
            >
              <Upload className="h-5 w-5" style={{ color: dragOver ? "var(--brand)" : "var(--muted-foreground)" }} />
              <p className="text-xs font-medium text-muted-foreground">Drag & drop atau klik untuk pilih file .json</p>
            </div>
            <input ref={fileRef} type="file" accept=".json" className="hidden"
              onChange={(e) => handleFile(e.target.files)} />

            {importStatus === "ok" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                <Check className="h-3.5 w-3.5" /> Import berhasil!
              </div>
            )}
            {importStatus === "err" && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{importErr}</span>
                <button onClick={() => setImportStatus("idle")} className="ml-auto shrink-0"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors hover:bg-muted"
                style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}>
                <Upload className="h-3.5 w-3.5" /> Pilih File
              </button>
              {drafts.length > 0 && (
                <button onClick={handleExport}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Download className="h-3.5 w-3.5" /> Export JSON
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- Main AyatKategoriTab ---
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
    try {
      await saveCategories(flatToCategories(updated) as any);
    } catch {
      showToast.error("Gagal menyimpan ayat. Coba lagi.");
    }
    setSaving(false);
  };

  const openAdd    = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (v: Verse) => { setEditing(v); setForm(v); setModal(true); };
  const openDelete = (v: Verse) => { setTarget(v); setConfirm(true); };

  const handleSubmit = async () => {
    const isEdit = !!editing;
    const next = isEdit
      ? verses.map((v) => (v.id === editing.id ? { ...form, id: editing.id } : v))
      : [...verses, { ...form, id: `${Date.now()}` }];
    setModal(false);
    await persist(next);
    showToast.success(isEdit ? "Ayat berhasil diperbarui." : "Ayat baru berhasil ditambahkan.");
  };

  const handleDelete = async () => {
    if (!target) return;
    const deleted = target; // simpan dulu sebelum di-null-kan
    const name = deleted.reference || deleted.label;
    setTarget(null);
    await persist(verses.filter((v) => v.id !== deleted.id));
    showToast.success(`Ayat "${name}" berhasil dihapus.`);
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

  return (
    <>
      {/* ── Ayat Nats Section ───────────────────────────────────────────── */}
      <AyatNatsSection />

      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{verses.length} ayat tersimpan</p>
            {saving ? (
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--brand)" }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
              </span>
            ) : (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                Live Supabase
              </span>
            )}
          </>
        )}
      </div>

      {!loading && (
        <>
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
              { key: "reference", label: "Referensi",                   placeholder: "Yohanes 3:16",          required: true },
              { key: "text",      label: "Isi Ayat", type: "textarea", placeholder: "Tuliskan isi ayat...", rows: 4, required: true },
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
      )}
    </>
  );
}