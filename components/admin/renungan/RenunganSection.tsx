"use client";

import React, { useState, useMemo, useRef } from "react";
import { useDevotional, useAuthors } from "@/lib/hooks/useFirestoreData";
import { deleteUploadThingFile, useUploadThing } from "@/lib/uploadthing-client";
import { auth } from "@/lib/firebase";
import { showToast } from "@/lib/utils/toast";
import { convertToWebM, browserSupportsWebM } from "@/lib/utils/audioConverter";
import { Eye, EyeOff, Loader2, Music2, X, BookOpen, Upload, CheckCircle2, RefreshCw } from "lucide-react";
import { INPUT_CLS, FieldLabel, SaveButton } from "./shared";

// ─── AudioUploadZone ──────────────────────────────────────────────────────────

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
      setIsUploading(false);
      setUploadPct(0);
      setError("");
    },
    onUploadError: (err) => {
      setError(err.message ?? "Upload gagal. Coba lagi.");
      setIsUploading(false);
      setUploadPct(0);
    },
  });

  const handleFile = async (file: File) => {
    if (!file) return;
    setError("");
    setConvertedInfo(null);

    if (!file.type.startsWith("audio/")) {
      setError("Format tidak didukung. Gunakan MP3, WAV, OGG, atau WebM.");
      return;
    }
    if (file.size > 64 * 1024 * 1024) {
      setError("Ukuran maks 64 MB.");
      return;
    }

    // ── Konversi ke WebM di browser ──────────────────────────────────────────
    let fileToUpload = file;
    if (file.type !== "audio/webm" && browserSupportsWebM()) {
      setConverting(true);
      setConvertPct(0);

      const result = await convertToWebM(file, (pct) => setConvertPct(pct));
      setConverting(false);

      if (result.converted) {
        const before = (result.sizeBefore / (1024 * 1024)).toFixed(1);
        const after  = (result.sizeAfter  / (1024 * 1024)).toFixed(1);
        setConvertedInfo(`Dikonversi ke WebM — ${before} MB → ${after} MB`);
        fileToUpload = result.file;
      }
    }

    // ── Upload ────────────────────────────────────────────────────────────────
    setIsUploading(true);
    setUploadPct(0);
    await startUpload([fileToUpload]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Sudah ada audio ──────────────────────────────────────────────────────────
  if (currentUrl) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
        <Music2 className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
        <div className="flex-1 min-w-0">
          <audio controls src={currentUrl} className="w-full h-8" />
          <p className="text-xs text-muted-foreground mt-1 truncate">{currentUrl}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => inputRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            title="Ganti audio"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            title="Hapus audio"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>
    );
  }

  // ── Belum ada audio ───────────────────────────────────────────────────────────
  const busy = converting || isUploading;

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !busy && inputRef.current?.click()}
        className={[
          "flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed transition-colors",
          busy ? "opacity-70 cursor-wait" : "cursor-pointer hover:bg-muted",
        ].join(" ")}
        style={{ borderColor: "var(--brand-border)" }}
      >
        {converting ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>
              Mengkonversi ke WebM... {convertPct}%
            </p>
            <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-200"
                style={{ backgroundColor: "var(--brand)", width: `${convertPct}%` }} />
            </div>
          </>
        ) : isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>
              Mengupload... {uploadPct}%
            </p>
            <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-200"
                style={{ backgroundColor: "var(--brand)", width: `${uploadPct}%` }} />
            </div>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6" style={{ color: "var(--brand)" }} />
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-semibold" style={{ color: "var(--brand)" }}>Klik atau seret</span>{" "}
              file audio ke sini
            </p>
            <p className="text-xs text-muted-foreground">
              MP3 / WAV / OGG — otomatis dikonversi ke <strong>WebM</strong>
            </p>
          </>
        )}
      </div>

      {convertedInfo && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> {convertedInfo}
        </div>
      )}
      {!browserSupportsWebM() && !converting && !isUploading && (
        <p className="text-xs text-amber-500 mt-1">
          Browser tidak mendukung konversi WebM — file diupload dalam format aslinya.
        </p>
      )}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

// ─── RenunganSection ──────────────────────────────────────────────────────────

export function RenunganSection() {
  const { data, loading, update }                   = useDevotional();
  const { data: authorsDict, loading: authLoading } = useAuthors();

  const [form,    setForm]    = useState<typeof data | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [preview, setPreview] = useState(false);

  const current = form ?? data;

  const authorOptions = useMemo(() => {
    if (authLoading) return [];
    return Object.entries(authorsDict as Record<string, any>).map(([code, a]) => ({
      value: code,
      label: `${a.title ? a.title + " " : ""}${a.name} (${code})`,
    }));
  }, [authorsDict, authLoading]);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...(f ?? data), [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(current);
      showToast.success("Renungan harian berhasil disimpan.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      showToast.error("Gagal menyimpan renungan. Coba lagi.");
    }
    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-8">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
      </div>
    );

  return (
    <div className="max-w-2xl space-y-4">
      {/* Editor card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" style={{ color: "var(--brand)" }} />
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
                Edit Renungan
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
              Live Firestore
            </span>
          </div>

          {/* Judul */}
          <div>
            <FieldLabel>Judul Renungan</FieldLabel>
            <input
              type="text"
              value={String((current as any).title ?? "")}
              onChange={(e) => set("title", e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Penulis */}
          <div>
            <FieldLabel>Penulis</FieldLabel>
            {authLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat...
              </div>
            ) : (
              <select
                value={String((current as any).authorCode ?? "")}
                onChange={(e) => set("authorCode", e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">— Pilih penulis —</option>
                {authorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Tambah penulis baru di{" "}
              <a href="/admin/penulis" className="underline" style={{ color: "var(--brand)" }}>
                halaman Penulis
              </a>.
            </p>
          </div>

          {/* Audio — auto-convert ke WebM */}
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
                  if (url) await deleteUploadThingFile(url).catch(() => {});
                  showToast.success("Audio berhasil dihapus.");
                } catch {
                  set("audioUrl", url);
                  showToast.error("Gagal menghapus audio. Coba lagi.");
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              MP3 / WAV / OGG — maks 64 MB. Otomatis dikonversi ke WebM sebelum upload.
            </p>
          </div>

          {/* Isi */}
          <div>
            <FieldLabel>Isi Renungan (paragraf dipisah baris kosong)</FieldLabel>
            <textarea
              rows={12}
              value={String((current as any).body ?? "")}
              onChange={(e) => set("body", e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Doa */}
          <div>
            <FieldLabel>Doa Penutup</FieldLabel>
            <textarea
              rows={3}
              value={String((current as any).prayer ?? "")}
              onChange={(e) => set("prayer", e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <SaveButton saving={saving} saved={saved} onClick={handleSave} label="Simpan ke Firestore" />
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              {preview
                ? <><EyeOff className="h-4 w-4" /> Tutup Pratinjau</>
                : <><Eye className="h-4 w-4" /> Pratinjau</>}
            </button>
          </div>
        </div>
      </div>

      {/* Pratinjau */}
      {preview && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="h-1 w-full" style={{ backgroundColor: "var(--brand)" }} />
          <div className="p-6">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>
              PRATINJAU
            </p>
            <h2 className="font-serif font-bold text-2xl mb-5" style={{ color: "var(--brand)" }}>
              {(current as any).title}
            </h2>
            {(current as any).audioUrl && (
              <div className="mb-5">
                <audio controls src={(current as any).audioUrl} className="w-full" />
              </div>
            )}
            <div className="space-y-4">
              {String((current as any).body ?? "")
                .split("\n\n")
                .map((para, i) => (
                  <p key={i} className="text-foreground leading-relaxed">{para}</p>
                ))}
            </div>
            {(current as any).authorCode && (
              <p className="text-right text-sm text-muted-foreground italic mt-4">
                {(() => {
                  const a = (authorsDict as any)[(current as any).authorCode];
                  return a
                    ? `${a.title ? a.title + " " : ""}${a.name}`
                    : `(${(current as any).authorCode})`;
                })()}
              </p>
            )}
            {(current as any).prayer && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>
                  DOA
                </p>
                <p className="font-serif italic" style={{ color: "var(--brand)" }}>
                  &ldquo;{(current as any).prayer}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}