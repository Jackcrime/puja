"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  useDevotional, useAuthors, useBibleReadings,
  type BibleReading, type Devotional, formatDateKey,
} from "@/lib/hooks/useFirestoreData";
import { BibleVerseSelector, emptySelection, type VerseSelection } from "@/components/admin/ayat/BibleVerseSelector";
import { selToRef } from "@/lib/utils/adminAyat";
import { deleteUploadThingFile, useUploadThing } from "@/lib/uploadthing-client";
import { auth } from "@/lib/firebase";
import { showToast } from "@/lib/utils/toast";
import { convertToWebM, browserSupportsWebM } from "@/lib/utils/audioConverter";
import {
  BookOpen, CalendarDays, ChevronLeft, ChevronRight,
  Eye, EyeOff, Loader2, Music2, X, Upload, CheckCircle2, RefreshCw,
  Save, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp,
  GripVertical,
} from "lucide-react";
import { INPUT_CLS, FieldLabel, SectionCard, SaveButton } from "./shared";
import { AuthorPicker } from "./AuthorPicker";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useDate } from "@/lib/context/DateContext";
import { RenunganImportExport } from "./RenunganImportExport";

// ─── Daily Date Picker ────────────────────────────────────────────────────────

const HARI_MINI  = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const BULAN_FULL = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function CalendarPopup({
  selected,
  onSelect,
  onClose,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
  onClose:  () => void;
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = React.useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(selected.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d: number) =>
    d === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear();
  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <div
      className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-2xl shadow-2xl p-4 w-72"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {/* Month select */}
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="text-xs font-bold bg-transparent border-none outline-none cursor-pointer appearance-none text-center"
            style={{ color: "var(--brand)" }}
          >
            {BULAN_FULL.map((b, i) => <option key={i} value={i}>{b}</option>)}
          </select>
          {/* Year select */}
          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="text-xs font-bold bg-transparent border-none outline-none cursor-pointer appearance-none text-center"
            style={{ color: "var(--brand)" }}
          >
            {Array.from({ length: 10 }, (_, i) => today.getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {HARI_MINI.map(h => (
          <div key={h} className="text-center text-[10px] font-bold text-muted-foreground py-1">{h}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const sel  = isSelected(d);
          const tod  = isToday(d);
          return (
            <button
              key={d}
              onClick={() => {
                onSelect(new Date(viewYear, viewMonth, d));
                onClose();
              }}
              className="aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: sel ? "var(--brand)" : tod ? "var(--brand-muted)" : "transparent",
                color:           sel ? "white" : tod ? "var(--brand)" : "inherit",
                fontWeight:      tod || sel ? 700 : 500,
                outline:         tod && !sel ? "1.5px solid var(--brand)" : "none",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Footer: jump to today */}
      <div className="mt-3 pt-3 border-t border-border flex justify-center">
        <button
          onClick={() => { onSelect(new Date()); onClose(); }}
          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hover:bg-muted"
          style={{ color: "var(--brand)" }}
        >
          Ke Hari Ini
        </button>
      </div>
    </div>
  );
}

function DayPicker({
  date,
  onChange,
}: {
  date:     Date;
  onChange: (d: Date) => void;
}) {
  const today    = new Date();
  const isToday  = isSameDay(date, today);
  const dateLabel = format(date, "EEEE, d MMMM yyyy", { locale: localeId });

  const [calOpen, setCalOpen] = React.useState(false);
  const wrapperRef            = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!calOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setCalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calOpen]);

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border w-fit relative" ref={wrapperRef}>
      {/* Prev day */}
      <button
        onClick={() => onChange(subDays(date, 1))}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
        title="Hari sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Date label */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border min-w-[220px] justify-center">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
          {dateLabel}
        </span>
        {isToday && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: "var(--brand)" }}>
            HARI INI
          </span>
        )}
      </div>

      {/* Next day */}
      <button
        onClick={() => onChange(addDays(date, 1))}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
        title="Hari berikutnya"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Tombol "Sekarang" */}
      {!isToday && (
        <button
          onClick={() => onChange(new Date())}
          className="ml-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-background transition-colors"
          style={{ color: "var(--brand)" }}
          title="Kembali ke hari ini"
        >
          Sekarang
        </button>
      )}

      {/* Calendar icon — buka popup */}
      <button
        onClick={() => setCalOpen((o) => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-all ml-0.5"
        style={{
          color:           calOpen ? "white" : "var(--muted-foreground)",
          backgroundColor: calOpen ? "var(--brand)" : "transparent",
        }}
        title="Pilih tanggal dari kalender"
      >
        <CalendarDays className="h-3.5 w-3.5" />
      </button>

      {/* Calendar popup */}
      {calOpen && (
        <CalendarPopup
          selected={date}
          onSelect={onChange}
          onClose={() => setCalOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Audio Upload ─────────────────────────────────────────────────────────────

interface AudioUploadZoneProps {
  currentUrl: string;
  onUploaded: (url: string) => void;
  onRemove:   () => Promise<void>;
}

function AudioUploadZone({ currentUrl, onUploaded, onRemove }: AudioUploadZoneProps) {
  const [converting,    setConverting]    = useState(false);
  const [convertPct,    setConvertPct]    = useState(0);
  const [uploadPct,     setUploadPct]     = useState(0);
  const [isUploading,   setIsUploading]   = useState(false);
  const [convertedInfo, setConvertedInfo] = useState<string | null>(null);
  const [error,         setError]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("audioUploader", {
    headers: async (): Promise<Record<string, string>> => {
      const token = (await auth.currentUser?.getIdToken()) ?? "";
      return { authorization: `Bearer ${token}` };
    },
    onUploadProgress: (p: number) => setUploadPct(p),
    onClientUploadComplete: (res) => {
      if (!res?.[0]) return;
      const file = res[0];
      const url  = (file as any).ufsUrl ?? (file as any).serverData?.url ?? file.url;
      onUploaded(url);
      setIsUploading(false); setUploadPct(0); setError("");
    },
    onUploadError: (err) => {
      setError(err.message ?? "Upload gagal. Coba lagi.");
      setIsUploading(false); setUploadPct(0);
    },
  });

  const handleFile = async (file: File) => {
    if (!file) return;
    setError(""); setConvertedInfo(null);
    if (!file.type.startsWith("audio/")) { setError("Format tidak didukung. Gunakan MP3, WAV, OGG, atau WebM."); return; }
    if (file.size > 64 * 1024 * 1024) { setError("Ukuran maks 64 MB."); return; }

    let fileToUpload = file;
    if (file.type !== "audio/webm" && browserSupportsWebM()) {
      setConverting(true); setConvertPct(0);
      const result = await convertToWebM(file, (pct) => setConvertPct(pct));
      setConverting(false);
      if (result.converted) {
        const before = (result.sizeBefore / (1024 * 1024)).toFixed(1);
        const after  = (result.sizeAfter  / (1024 * 1024)).toFixed(1);
        setConvertedInfo(`Dikonversi ke WebM — ${before} MB → ${after} MB`);
        fileToUpload = result.file;
      }
    }
    setIsUploading(true); setUploadPct(0);
    await startUpload([fileToUpload]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (currentUrl) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
        <Music2 className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
        <div className="flex-1 min-w-0">
          <audio controls src={currentUrl} className="w-full h-8" />
          <p className="text-xs text-muted-foreground mt-1 truncate">{currentUrl}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={() => inputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Ganti audio">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Hapus audio">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept="audio/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
    );
  }

  const busy = converting || isUploading;
  return (
    <div>
      <div
        onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
        onClick={() => !busy && inputRef.current?.click()}
        className={["flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed transition-colors", busy ? "opacity-70 cursor-wait" : "cursor-pointer hover:bg-muted"].join(" ")}
        style={{ borderColor: "var(--brand-border)" }}
      >
        {converting ? (
          <><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>Mengkonversi ke WebM... {convertPct}%</p></>
        ) : isUploading ? (
          <><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>Mengupload... {uploadPct}%</p></>
        ) : (
          <><Upload className="h-6 w-6" style={{ color: "var(--brand)" }} />
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-semibold" style={{ color: "var(--brand)" }}>Klik atau seret</span> file audio ke sini
          </p>
          <p className="text-xs text-muted-foreground">MP3 / WAV / OGG — otomatis dikonversi ke <strong>WebM</strong></p></>
        )}
      </div>
      {convertedInfo && <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600 dark:text-green-400"><CheckCircle2 className="h-3.5 w-3.5" /> {convertedInfo}</div>}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      <input ref={inputRef} type="file" accept="audio/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}

// ─── Renungan Sub-section ─────────────────────────────────────────────────────

function RenunganPart({ date }: { date: Date }) {
  // noFallback=true: admin selalu dapat form kosong untuk hari yang belum ada renungannya
  // (tidak bocor ke "current" dari hari lain)
  const { data, exists, loading, update } = useDevotional(date, { noFallback: true });
  const { data: authorsDict, loading: authLoading } = useAuthors();

  const [form,    setForm]   = useState<Devotional | null>(null);
  const [dirty,   setDirty]  = useState(false);   // ada perubahan yang belum disimpan
  const [saving,  setSaving] = useState(false);
  const [saved,   setSaved]  = useState(false);
  const [preview, setPreview] = useState(false);

  // Reset form setiap kali tanggal berganti
  useEffect(() => { setForm(null); setDirty(false); setPreview(false); }, [date]);

  // form != null → pakai draft; null → pakai data dari Firestore
  const current = form ?? data;

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...(f ?? data), [key]: value }));
    setDirty(true);
  };

  // Reset ke state TERSIMPAN terakhir (bukan ke sebelum save)
  const handleReset = () => {
    setForm(null);
    setDirty(false);
    showToast.success("Perubahan dibatalkan, form kembali ke data tersimpan.");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(current);
      // Setelah save: sinkronkan form ke data terbaru, hapus dirty flag
      setForm(null);   // update() sudah memanggil setData(updated) di dalam hook-nya
      setDirty(false);
      showToast.success("Renungan harian berhasil disimpan.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { showToast.error("Gagal menyimpan renungan. Coba lagi."); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="h-4 w-4 animate-spin" /> Memuat renungan...</div>;

  const isEmpty = !exists && !dirty;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Edit Renungan</p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                Belum disimpan
              </span>
            )}
            <span className={[
              "text-xs px-2 py-0.5 rounded-full font-semibold",
              exists || dirty
                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-muted text-muted-foreground",
            ].join(" ")}>
              {exists ? "Tersimpan" : isEmpty ? "Belum ada renungan" : "Draft baru"}
            </span>
          </div>
        </div>

        {/* Banner kosong — hanya tampil kalau belum ada data dan belum mulai ngetik */}
        {isEmpty && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-dashed border-border bg-muted/30">
            <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground leading-snug">
              Belum ada renungan untuk tanggal ini. Isi form di bawah lalu klik{" "}
              <strong className="font-semibold text-foreground">Simpan</strong>.
            </p>
          </div>
        )}

        {/* Judul */}
        <div>
          <FieldLabel>Judul Renungan</FieldLabel>
          <input type="text" value={String((current as any).title ?? "")}
            onChange={(e) => set("title", e.target.value)} className={INPUT_CLS} />
        </div>

        {/* Penulis */}
        <div>
          <FieldLabel>Penulis</FieldLabel>
          <AuthorPicker
            value={String((current as any).authorCode ?? "")}
            authors={authorsDict as any}
            loading={authLoading}
            onChange={(code) => set("authorCode", code)}
          />
        </div>

        {/* Audio */}
        <div>
          <FieldLabel>Audio Renungan</FieldLabel>
          <AudioUploadZone
            currentUrl={String((current as any).audioUrl ?? "")}
            onUploaded={(url) => set("audioUrl", url)}
            onRemove={async () => {
              const url = (current as any).audioUrl;
              set("audioUrl", "");
              try {
                await update({ ...(form ?? data), audioUrl: "" });
                setForm(null);
                setDirty(false);
                if (url) await deleteUploadThingFile(url).catch(() => {});
                showToast.success("Audio berhasil dihapus.");
              } catch {
                set("audioUrl", url);
                showToast.error("Gagal menghapus audio. Coba lagi.");
              }
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">MP3 / WAV / OGG — maks 64 MB.</p>
        </div>

        {/* Isi */}
        <div>
          <FieldLabel>Isi Renungan (paragraf dipisah baris kosong)</FieldLabel>
          <textarea rows={10} value={String((current as any).body ?? "")}
            onChange={(e) => set("body", e.target.value)} className={INPUT_CLS} />
        </div>

        {/* Doa */}
        <div>
          <FieldLabel>Doa Penutup</FieldLabel>
          <textarea rows={3} value={String((current as any).prayer ?? "")}
            onChange={(e) => set("prayer", e.target.value)} className={INPUT_CLS} />
        </div>

        <div className="flex gap-2 pt-1 flex-wrap">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} label="Simpan ke Firestore" />
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors text-muted-foreground">
            <RotateCcw className="h-4 w-4" /> Reset Form
          </button>
          <button onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">
            {preview ? <><EyeOff className="h-4 w-4" /> Tutup Pratinjau</> : <><Eye className="h-4 w-4" /> Pratinjau</>}
          </button>
        </div>

        {preview && (
          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>PRATINJAU</p>
            <h2 className="font-serif font-bold text-2xl mb-5" style={{ color: "var(--brand)" }}>{(current as any).title}</h2>
            {(current as any).audioUrl && <div className="mb-5"><audio controls src={(current as any).audioUrl} className="w-full" /></div>}
            <div className="space-y-4">
              {String((current as any).body ?? "").split("\n\n").map((para, i) => (
                <p key={i} className="text-foreground leading-relaxed">{para}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reading Card (simplified — reference + title only, no perikop/cross-ref) ──

interface ReadingDraft {
  id:        string;
  reference: string;
  title:     string;
  sel:       VerseSelection;
  expanded:  boolean;
}

function newDraft(): ReadingDraft {
  return { id: crypto.randomUUID(), reference: "", title: "", sel: emptySelection(), expanded: true };
}

function draftFromSaved(r: BibleReading): ReadingDraft {
  return {
    id:        crypto.randomUUID(),
    reference: r.reference,
    title:     r.title,
    sel:       emptySelection(),
    expanded:  false,
  };
}

function ReadingCard({
  draft, index, total, onChange, onDelete, onMoveUp, onMoveDown,
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

  const handleSelChange = useCallback((sel: VerseSelection) => {
    const ref = selToRef(sel);
    onChange({ ...draft, sel, reference: ref || draft.reference });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        style={{ backgroundColor: "var(--brand-muted)" }}
        onClick={() => onChange({ ...draft, expanded: !draft.expanded })}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <span className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: "var(--brand)" }}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          {hasContent
            ? <p className="text-sm font-semibold truncate" style={{ color: "var(--brand)" }}>{draft.reference}{draft.title ? ` — ${draft.title}` : ""}</p>
            : <p className="text-xs text-muted-foreground italic">Bacaan baru (belum dipilih)</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={index === 0} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          {draft.expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />}
        </div>
      </div>

      {draft.expanded && (
        <div className="p-4 space-y-4 border-t border-border">
          {/* Perikop selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Pilih Perikop Bacaan
            </label>
            <BibleVerseSelector value={draft.sel} onChange={handleSelChange} showPreview={false} compact />
          </div>

          {/* Referensi override */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Referensi (otomatis terisi, bisa diedit)
            </label>
            <input
              value={draft.reference}
              onChange={(e) => onChange({ ...draft, reference: e.target.value })}
              placeholder="mis. Roma 8:1-17"
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 font-semibold"
              style={{ color: "var(--brand)" }}
            />
          </div>

          {/* Judul */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
              Judul Bacaan
            </label>
            <input
              value={draft.title}
              onChange={(e) => onChange({ ...draft, title: e.target.value })}
              placeholder="mis. Hidup dalam Roh"
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bacaan Sub-section ───────────────────────────────────────────────────────

function BacaanPart({ date }: { date: Date }) {
  const { data: saved, loading: dataLoading, save } = useBibleReadings(date);
  const [drafts, setDrafts] = useState<ReadingDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved_, setSaved_] = useState(false);
  const [synced, setSynced] = useState(false);

  // Re-sync when date changes
  useEffect(() => { setSynced(false); }, [date]);

  useEffect(() => {
    if (!dataLoading && !synced) {
      setDrafts(saved.map(draftFromSaved));
      setSynced(true);
    }
  }, [dataLoading, saved, synced]);

  const updateDraft  = useCallback((id: string, updated: ReadingDraft) => setDrafts((p) => p.map((d) => d.id === id ? updated : d)), []);
  const deleteDraft  = useCallback((id: string) => setDrafts((p) => p.filter((d) => d.id !== id)), []);
  const moveUp       = useCallback((i: number) => setDrafts((p) => { const n = [...p]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n; }), []);
  const moveDown     = useCallback((i: number) => setDrafts((p) => { const n = [...p]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n; }), []);

  const handleSave = async () => {
    const items: BibleReading[] = drafts
      .filter((d) => d.reference.trim())
      .map((d) => ({
        reference: d.reference,
        title:     d.title,
      }));
    setSaving(true);
    try {
      await save(items);
      setSaved_(true);
      showToast.success("Bacaan Alkitab berhasil disimpan!");
      setTimeout(() => setSaved_(false), 2500);
    } catch { showToast.error("Gagal menyimpan. Coba lagi."); }
    setSaving(false);
  };

  if (dataLoading) return <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Memuat bacaan...</div>;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--gold)" }} />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: "var(--gold)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Bacaan Alkitab</p>
        </div>

        <div className="space-y-3">
          {drafts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              Belum ada bacaan. Klik &quot;+ Tambah Bacaan&quot; untuk mulai.
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

        <button
          onClick={() => setDrafts((p) => [...p, newDraft()])}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:bg-muted/30"
          style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
        >
          <Plus className="h-4 w-4" /> Tambah Bacaan
        </button>

        <div className="flex items-center gap-3 pt-1">
          <SaveButton saving={saving} saved={saved_} onClick={handleSave} />
          <button onClick={() => { setDrafts(saved.map(draftFromSaved)); showToast.success("Perubahan dibatalkan."); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface RenunganBacaanSectionProps {
  onDateChange?: (date: Date) => void;
}

export function RenunganBacaanSection({ onDateChange }: RenunganBacaanSectionProps = {}) {
  const { date: globalDate } = useDate();
  const [selectedDate, setSelectedDate] = useState<Date>(globalDate ?? new Date());

  // Sync with global date on first mount
  useEffect(() => { if (globalDate) setSelectedDate(globalDate); }, [globalDate]);

  const handleDateChange = (d: Date) => {
    setSelectedDate(d);
    onDateChange?.(d);
  };

  return (
    <div className="space-y-5">
      {/* Date Picker + Import/Export */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
            Pilih Tanggal
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap w-full">
          <DayPicker date={selectedDate} onChange={handleDateChange} />
          <RenunganImportExport onImported={() => setSelectedDate((d) => new Date(d))} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Renungan dan bacaan disimpan per tanggal. Gunakan panah atau ikon kalender untuk berpindah hari.
        </p>
      </div>

      {/* Renungan */}
      <RenunganPart date={selectedDate} />

      {/* Bacaan Alkitab */}
      <BacaanPart date={selectedDate} />
    </div>
  );
}