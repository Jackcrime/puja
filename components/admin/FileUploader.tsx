"use client";

// ─── FileUploader — Supabase Storage ─────────────────────────────────────────
// Menggantikan komponen lama yang pakai useUploadThing dari UploadThing.
// Sekarang upload langsung ke Supabase Storage via browser SDK.

import { useRef, useState, useCallback, useEffect } from "react";
import { uploadFileWithProgress } from "@/lib/storage";
import { validateStorageFile, getStorageLabel, formatFileSize } from "@/lib/file-utils";
import type { StorageFolder } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  folder:         StorageFolder;
  currentUrl?:    string;
  onUploadDone:   (url: string, path: string) => void;
  onRemove?:      () => void;
  className?:     string;
  disabled?:      boolean;
  label?:         string;
}

export function FileUploader({
  folder,
  currentUrl,
  onUploadDone,
  onRemove,
  className,
  disabled = false,
  label,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState<string | null>(null);
  const [preview,   setPreview]   = useState<string | null>(currentUrl ?? null);

  // Sync preview ketika currentUrl berubah dari luar (misal buka modal author berbeda)
  const prevUrlRef = useRef(currentUrl);
  useEffect(() => {
    if (prevUrlRef.current !== currentUrl) {
      prevUrlRef.current = currentUrl;
      setPreview(currentUrl ?? null);
      setError(null);
    }
  }, [currentUrl]);

  const accept = folder === "pustaka"
    ? "application/pdf"
    : folder === "audio"
    ? "audio/*"
    : "image/jpeg,image/png,image/webp";

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    // Validasi tipe & ukuran file
    const { valid, error: validErr } = validateStorageFile(file, folder);
    if (!valid) {
      setError(validErr ?? "File tidak valid.");
      return;
    }

    // JANGAN hapus file lama di sini — biarkan parent urus via pendingDeleteUrl
    // supaya kalau user cancel, file lama tetap aman

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFileWithProgress(folder, file, ({ percent }) => {
        setProgress(percent);
      });

      setPreview(result.url);
      onUploadDone(result.url, result.path);
    } catch (e: any) {
      setError(e?.message ?? "Upload gagal. Coba lagi.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [folder, onUploadDone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    // Jangan hapus dari Storage langsung — parent urus via pendingDeleteUrl
    // supaya kalau user cancel modal, file lama tetap aman
    setPreview(null);
    onRemove?.();
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Label opsional */}
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors",
          disabled || uploading
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-primary/60 hover:bg-accent/30",
          error ? "border-destructive" : "border-muted"
        )}
      >
        {uploading ? (
          <div className="flex w-full flex-col items-center gap-2">
            <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-muted-foreground">Mengupload… {progress}%</span>
            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-2 text-center">
            {folder === "images" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="h-20 w-20 rounded-md object-cover" />
            )}
            <p className="max-w-[200px] truncate text-xs text-muted-foreground">{preview}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="rounded border px-2 py-1 text-xs hover:bg-accent"
              >
                Ganti
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  className="rounded border border-destructive px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-center text-sm text-muted-foreground">
              Klik atau drag &amp; drop file di sini
            </p>
            <p className="text-xs text-muted-foreground">{getStorageLabel(folder)}</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled || uploading}
      />
    </div>
  );
}