"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, FileText, Loader2, ExternalLink, ImageIcon, RefreshCw } from "lucide-react";
import { useUploadThing, validateFile, type UploadEndpoint, type UploadResult } from "@/lib/uploadthing-client";
import { auth } from "@/lib/firebase";

interface FileUploaderProps {
  endpoint: UploadEndpoint;
  label?: string;
  accept?: string;
  isImage?: boolean;
  currentUrl?: string;
  currentName?: string;
  onUploadComplete: (result: UploadResult) => void;
  onRemove?: () => void;
}

export function FileUploader({
  endpoint, label, accept, isImage = false,
  currentUrl, currentName, onUploadComplete, onRemove,
}: FileUploaderProps) {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: async (): Promise<Record<string, string>> => {
      const token = (await auth.currentUser?.getIdToken()) ?? "";
      return { authorization: `Bearer ${token}` };
    },
    onUploadProgress: (p: number) => setProgress(p),
    onClientUploadComplete: (res) => {
      if (!res?.[0]) return;
      const file = res[0];
      const url = (file as any).ufsUrl ?? (file as any).serverData?.url ?? file.url;
      onUploadComplete({ url, name: file.name, size: file.size });
      setError("");
      setProgress(0);
    },
    onUploadError: (err) => {
      setError(err.message ?? "Upload gagal. Coba lagi.");
      setProgress(0);
    },
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { valid, error: vErr } = validateFile(file, endpoint);
    if (!valid) { setError(vErr ?? "File tidak valid"); return; }
    setError("");
    await startUpload([file]);
    e.target.value = "";
  };

  // ── Sudah ada file ──────────────────────────────────────────────────────────
  if (currentUrl) {
    return (
      <div>
        {label && (
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--gold)" }}>
            {label}
          </p>
        )}

        {isImage ? (
          <div className="flex items-center gap-3">
            {/* Thumbnail dengan hover overlay Ganti */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border shrink-0 group">
              {isUploading ? (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                  <span className="text-white text-xs font-medium">{progress}%</span>
                </div>
              ) : (
                <>
                  <Image src={currentUrl} alt="foto" fill sizes="96px" className="object-cover" />
                  <button type="button" onClick={() => inputRef.current?.click()}
                    className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                    <RefreshCw className="h-4 w-4 text-white" />
                    <span className="text-white text-[10px] font-semibold">Ganti</span>
                  </button>
                </>
              )}
            </div>
            {onRemove && !isUploading && (
              <button type="button" onClick={onRemove}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                <X className="h-3.5 w-3.5" /> Hapus foto
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Link file aktif */}
            <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2.5 rounded-xl border border-green-200 dark:border-green-800">
              <FileText className="h-4 w-4 shrink-0" />
              <a href={currentUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 truncate text-xs underline">
                {currentName ?? "Lihat file"}
              </a>
              <a href={currentUrl} target="_blank" rel="noopener noreferrer"
                className="shrink-0 text-green-600 hover:text-green-700">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {onRemove && (
                <button type="button" onClick={onRemove}
                  className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Progress bar atau tombol Ganti */}
            {isUploading ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed"
                style={{ borderColor: "var(--brand-border)" }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" style={{ color: "var(--brand)" }} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Mengupload file baru...</span>
                    <span style={{ color: "var(--brand)" }}>{progress}%</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-200"
                      style={{ backgroundColor: "var(--brand)", width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed hover:bg-muted transition-colors"
                style={{ borderColor: "var(--brand-border)", color: "var(--brand)" }}>
                <RefreshCw className="h-3.5 w-3.5" /> Ganti file
              </button>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        <input ref={inputRef} type="file" accept={accept}
          className="hidden" onChange={handleChange} disabled={isUploading} />
      </div>
    );
  }

  // ── Belum ada file ──────────────────────────────────────────────────────────
  return (
    <div>
      {label && (
        <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--gold)" }}>
          {label}
        </p>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
          isUploading ? "opacity-50 pointer-events-none" : "hover:bg-muted"
        }`} style={{ borderColor: "var(--brand-border)" }}>
        {isUploading
          ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: "var(--brand)" }} />
          : isImage
            ? <ImageIcon className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
            : <Upload className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
        }
        <div className="flex-1 min-w-0">
          {isUploading ? (
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-muted-foreground">Mengupload...</span>
                <span style={{ color: "var(--brand)" }}>{progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-200"
                  style={{ backgroundColor: "var(--brand)", width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {isImage ? "Pilih foto (JPG/PNG/WebP, maks 4 MB)" : "Pilih file untuk diupload"}
            </span>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      <input ref={inputRef} type="file" accept={accept}
        className="hidden" onChange={handleChange} disabled={isUploading} />
    </div>
  );
}