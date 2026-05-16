"use client";

import React, { useState, useMemo } from "react";
import { useDevotional, useAuthors } from "@/lib/hooks/useFirestoreData";
import { deleteUploadThingFile } from "@/lib/uploadthing-client";
import { showToast } from "@/lib/utils/toast";
import { FileUploader } from "@/components/admin/FileUploader";
import { Eye, EyeOff, Loader2, Music2, X, BookOpen } from "lucide-react";
import { INPUT_CLS, FieldLabel, SaveButton } from "./shared";

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

          {/* Audio */}
          <div>
            <FieldLabel>Audio Renungan</FieldLabel>
            {(current as any).audioUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                <Music2 className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
                <div className="flex-1 min-w-0">
                  <audio controls src={(current as any).audioUrl} className="w-full h-8" />
                  <p className="text-xs text-muted-foreground mt-1 truncate">{(current as any).audioUrl}</p>
                </div>
                <button
                  onClick={async () => {
                    const url = (current as any).audioUrl;
                    set("audioUrl", "");
                    if (url) await deleteUploadThingFile(url).catch(() => {});
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <FileUploader
                endpoint="audioUploader"
                label=""
                accept="audio/mpeg,audio/wav,audio/ogg"
                currentUrl=""
                onUploadComplete={(res) => set("audioUrl", res.url)}
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">MP3/WAV, maks 64 MB.</p>
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
              {preview ? <><EyeOff className="h-4 w-4" /> Tutup Pratinjau</> : <><Eye className="h-4 w-4" /> Pratinjau</>}
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