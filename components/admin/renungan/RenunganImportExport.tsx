"use client";

import React, { useRef, useState } from "react";
import {
  Download, Upload, X, CheckCircle2, AlertTriangle,
  Loader2, FileJson, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import { readCollection, writeDoc } from "@/lib/firestore";
import { showToast } from "@/lib/utils/toast";
import { formatDateKey } from "@/lib/hooks/useFirestoreData";
import type { Devotional } from "@/lib/hooks/useFirestoreData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RenunganExportEntry {
  date:       string;   // "YYYY-MM-DD"
  title:      string;
  authorCode: string;
  audioUrl:   string;
  body:       string;
  prayer:     string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateKey(id: string) {
  return DATE_RE.test(id);
}

function entryIsEmpty(e: RenunganExportEntry) {
  return !e.title && !e.body && !e.prayer;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDisplayDate(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// ─── Export Panel ─────────────────────────────────────────────────────────────

function ExportPanel({ onClose }: { onClose: () => void }) {
  const [loading,   setLoading]   = useState(false);
  const [fromDate,  setFromDate]  = useState("");
  const [toDate,    setToDate]    = useState("");
  const [skipEmpty, setSkipEmpty] = useState(true);

  const handleExport = async () => {
    setLoading(true);
    try {
      const allDocs = await readCollection<{ id: string } & Devotional>("devotional", []);
      let entries: RenunganExportEntry[] = allDocs
        .filter((d) => isDateKey(d.id))
        .map((d) => ({
          date:       d.id,
          title:      d.title      ?? "",
          authorCode: d.authorCode ?? "",
          audioUrl:   d.audioUrl   ?? "",
          body:       d.body       ?? "",
          prayer:     d.prayer     ?? "",
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (fromDate) entries = entries.filter((e) => e.date >= fromDate);
      if (toDate)   entries = entries.filter((e) => e.date <= toDate);
      if (skipEmpty) entries = entries.filter((e) => !entryIsEmpty(e));

      if (entries.length === 0) {
        showToast.error("Tidak ada renungan yang cocok dengan filter.");
        setLoading(false);
        return;
      }

      const today    = formatDateKey(new Date());
      const filename = `renungan-export-${today}.json`;
      downloadJson(filename, entries);
      showToast.success(`${entries.length} renungan berhasil diekspor.`);
      onClose();
    } catch (e) {
      console.error(e);
      showToast.error("Gagal mengekspor. Coba lagi.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Ekspor semua renungan ke file <strong>.json</strong>. Bisa difilter per rentang tanggal dan diimpor kembali nanti.
      </p>

      {/* Filter range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Dari Tanggal
          </label>
          <input
            type="date" value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
            Sampai Tanggal
          </label>
          <input
            type="date" value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <div
          onClick={() => setSkipEmpty((v) => !v)}
          className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
          style={{
            borderColor:     skipEmpty ? "var(--brand)" : "var(--border)",
            backgroundColor: skipEmpty ? "var(--brand)" : "transparent",
          }}
        >
          {skipEmpty && <CheckCircle2 className="h-3 w-3 text-white" />}
        </div>
        <span className="text-sm text-muted-foreground">Lewati renungan yang kosong</span>
      </label>

      <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">
        Kosongkan filter tanggal untuk mengekspor semua renungan. Format output: JSON array dengan field{" "}
        <code className="font-mono text-[10px]">date, title, authorCode, body, prayer, audioUrl</code>.
      </p>

      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "var(--brand)" }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {loading ? "Mengekspor..." : "Ekspor JSON"}
      </button>
    </div>
  );
}

// ─── Import Panel ─────────────────────────────────────────────────────────────

type ImportStatus = "idle" | "parsing" | "preview" | "importing" | "done";

function ImportPanel({ onClose, onImported }: { onClose: () => void; onImported?: () => void }) {
  const fileRef                     = useRef<HTMLInputElement>(null);
  const [status,   setStatus]       = useState<ImportStatus>("idle");
  const [entries,  setEntries]      = useState<RenunganExportEntry[]>([]);
  const [errors,   setErrors]       = useState<string[]>([]);
  const [progress, setProgress]     = useState(0);
  const [overwrite, setOverwrite]   = useState(true);
  const [expanded, setExpanded]     = useState<Record<number, boolean>>({});
  const [existing, setExisting]     = useState<Set<string>>(new Set());

  const handleFile = async (file: File) => {
    setStatus("parsing");
    setErrors([]);
    setEntries([]);

    try {
      const text = await file.text();
      const raw  = JSON.parse(text);

      if (!Array.isArray(raw)) throw new Error("File harus berupa JSON array.");

      const parsed: RenunganExportEntry[] = [];
      const errs: string[] = [];

      raw.forEach((item: any, i: number) => {
        if (!item.date || !DATE_RE.test(item.date)) {
          errs.push(`Item ${i + 1}: field "date" tidak valid atau tidak ada.`);
          return;
        }
        parsed.push({
          date:       item.date,
          title:      String(item.title      ?? ""),
          authorCode: String(item.authorCode ?? ""),
          audioUrl:   String(item.audioUrl   ?? ""),
          body:       String(item.body       ?? ""),
          prayer:     String(item.prayer     ?? ""),
        });
      });

      if (parsed.length === 0 && errs.length > 0) {
        setErrors(errs);
        setStatus("idle");
        return;
      }

      // Check which dates already have docs
      const allDocs = await readCollection<{ id: string }>("devotional", []);
      const existingDates = new Set(allDocs.filter((d) => isDateKey(d.id)).map((d) => d.id));
      setExisting(existingDates);
      setEntries(parsed.sort((a, b) => a.date.localeCompare(b.date)));
      setErrors(errs);
      setStatus("preview");
    } catch (e: any) {
      setErrors([e?.message ?? "File tidak valid."]);
      setStatus("idle");
    }
  };

  const handleImport = async () => {
    const toImport = overwrite
      ? entries
      : entries.filter((e) => !existing.has(e.date));

    if (toImport.length === 0) {
      showToast.error("Tidak ada renungan baru untuk diimpor.");
      return;
    }

    setStatus("importing");
    setProgress(0);

    let done = 0;
    for (const entry of toImport) {
      const { date, ...data } = entry;
      await writeDoc("devotional", date, data as Devotional);
      done++;
      setProgress(Math.round((done / toImport.length) * 100));
    }

    setStatus("done");
    showToast.success(`${toImport.length} renungan berhasil diimpor.`);
    onImported?.();
  };

  // ── idle / drag-drop ──
  if (status === "idle" || status === "parsing") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upload file <strong>.json</strong> hasil ekspor. Renungan akan diimpor per tanggal.
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-muted/30"
          style={{ borderColor: "var(--brand-border)" }}
        >
          {status === "parsing"
            ? <><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand)" }} />
                <p className="text-sm" style={{ color: "var(--brand)" }}>Memproses file...</p></>
            : <><FileJson className="h-8 w-8" style={{ color: "var(--brand)" }} />
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-semibold" style={{ color: "var(--brand)" }}>Klik atau seret</span> file JSON ke sini
                </p></>}
        </div>

        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 space-y-1">
            {errors.map((e, i) => (
              <p key={i} className="text-xs text-destructive flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {e}
              </p>
            ))}
          </div>
        )}

        <input
          ref={fileRef} type="file" accept=".json,application/json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ""; } }}
        />
      </div>
    );
  }

  // ── done ──
  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="font-semibold text-foreground">Impor selesai!</p>
        <p className="text-sm text-muted-foreground">{entries.length} renungan berhasil disimpan ke Firestore.</p>
        <button onClick={onClose} className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "var(--brand)" }}>
          Tutup
        </button>
      </div>
    );
  }

  // ── importing ──
  if (status === "importing") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--brand)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>Mengimpor renungan... {progress}%</p>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "var(--brand)" }} />
        </div>
      </div>
    );
  }

  // ── preview ──
  const overwriteCount = entries.filter((e) => existing.has(e.date)).length;
  const newCount       = entries.filter((e) => !existing.has(e.date)).length;
  const toImportCount  = overwrite ? entries.length : newCount;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Total",    val: entries.length,    color: "var(--brand)" },
          { label: "Baru",     val: newCount,          color: "var(--green,#16a34a)" },
          { label: "Timpa",    val: overwriteCount,    color: "var(--gold)" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-muted/40 rounded-xl py-2.5 px-2 border border-border">
            <p className="text-lg font-bold" style={{ color }}>{val}</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Overwrite toggle */}
      {overwriteCount > 0 && (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => setOverwrite((v) => !v)}
            className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
            style={{
              borderColor:     overwrite ? "var(--gold)" : "var(--border)",
              backgroundColor: overwrite ? "var(--gold)" : "transparent",
            }}
          >
            {overwrite && <CheckCircle2 className="h-3 w-3 text-white" />}
          </div>
          <span className="text-sm text-muted-foreground">
            Timpa {overwriteCount} renungan yang sudah ada
          </span>
        </label>
      )}

      {/* Entry list */}
      <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
        {entries.map((entry, i) => {
          const isExisting = existing.has(entry.date);
          const isSkipped  = !overwrite && isExisting;
          const isOpen     = expanded[i];
          return (
            <div
              key={entry.date}
              className="border border-border rounded-lg overflow-hidden"
              style={{ opacity: isSkipped ? 0.4 : 1 }}
            >
              <button
                onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
              >
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: isSkipped ? "var(--muted)" : isExisting ? "rgba(212,175,55,0.15)" : "rgba(var(--brand-rgb,79,70,229),0.1)",
                    color:           isSkipped ? "var(--muted-foreground)" : isExisting ? "var(--gold)" : "var(--brand)",
                  }}
                >
                  {isSkipped ? "LEWATI" : isExisting ? "TIMPA" : "BARU"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{formatDisplayDate(entry.date)}</p>
                  {entry.title && <p className="text-[10px] text-muted-foreground truncate">{entry.title}</p>}
                </div>
                {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-3 pb-2.5 space-y-1.5 border-t border-border bg-muted/20">
                  {entry.title && <p className="text-xs font-semibold pt-2" style={{ color: "var(--brand)" }}>{entry.title}</p>}
                  {entry.authorCode && <p className="text-[10px] text-muted-foreground">Penulis: <strong>{entry.authorCode}</strong></p>}
                  {entry.body && <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{entry.body}</p>}
                  {!entry.title && !entry.body && <p className="text-[10px] text-muted-foreground italic pt-2">Kosong</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errors.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Peringatan ({errors.length} item dilewati)</p>
          {errors.map((e, i) => <p key={i} className="text-xs text-amber-600 dark:text-amber-500">{e}</p>)}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={toImportCount === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--brand)" }}
        >
          <Upload className="h-4 w-4" />
          Impor {toImportCount} Renungan
        </button>
        <button
          onClick={() => { setStatus("idle"); setEntries([]); setErrors([]); }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors text-muted-foreground"
        >
          Ganti File
        </button>
      </div>
    </div>
  );
}

// ─── Main Export (modal drawer) ───────────────────────────────────────────────

type Mode = "export" | "import";

interface Props {
  onImported?: () => void;
}

export function RenunganImportExport({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("export");

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <FileJson className="h-3.5 w-3.5" />
        Import / Export
      </button>

      {/* Modal backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4" style={{ color: "var(--brand)" }} />
                <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>Import / Export Renungan</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-3 border-b border-border shrink-0">
              {(["export", "import"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={
                    mode === m
                      ? { backgroundColor: "var(--brand)", color: "white" }
                      : { color: "var(--muted-foreground)" }
                  }
                >
                  {m === "export" ? <><Download className="h-3.5 w-3.5" /> Ekspor</> : <><Upload className="h-3.5 w-3.5" /> Impor</>}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5">
              {mode === "export"
                ? <ExportPanel onClose={() => setOpen(false)} />
                : <ImportPanel onClose={() => setOpen(false)} onImported={onImported} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}