"use client";

import React, { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { FileUploader } from "@/components/admin/FileUploader";
import { useDevotional, useAuthors } from "@/lib/hooks/useFirestoreData";
import { deleteUploadThingFile } from "@/lib/uploadthing-client";
import { Save, Check, Eye, EyeOff, Loader2, Music2, X } from "lucide-react";

export default function AdminRenungan() {
  const { data, loading, update }             = useDevotional();
  const { data: authorsDict, loading: authLoading } = useAuthors();

  const [form, setForm]       = useState<typeof data | null>(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [preview, setPreview] = useState(false);

  const current = form ?? data;

  // Buat opsi dropdown dari data penulis Firestore
  const authorOptions = useMemo(() => {
    if (authLoading) return [];
    return Object.entries(authorsDict as Record<string, any>).map(([code, a]) => ({
      value: code,
      label: `${a.title ? a.title + " " : ""}${a.name} (${code})`,
    }));
  }, [authorsDict, authLoading]);

  const handleSave = async () => {
    setSaving(true);
    await update(current);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setField = (key: string, value: string) =>
    setForm((f) => ({ ...(f ?? data), [key]: value }));

  const InputField = ({ label, fieldKey, type = "text" }: { label: string; fieldKey: string; type?: string }) => (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
        {label}
      </label>
      <input
        type={type}
        value={String((current as any)[fieldKey] ?? "")}
        onChange={(e) => setField(fieldKey, e.target.value)}
        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 resize-none"
      />
    </div>
  );

  const TextareaField = ({ label, fieldKey, rows = 4 }: { label: string; fieldKey: string; rows?: number }) => (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
        {label}
      </label>
      <textarea
        rows={rows}
        value={String((current as any)[fieldKey] ?? "")}
        onChange={(e) => setField(fieldKey, e.target.value)}
        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 resize-none"
      />
    </div>
  );

  return (
    <AdminGuard>
      <AdminLayout title="Renungan Harian">
        <div className="max-w-2xl space-y-4">
          {loading ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-2 justify-between">
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
                    Edit Renungan
                  </p>
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                    Live Firestore
                  </span>
                </div>

                <InputField label="Judul Renungan" fieldKey="title" />

                {/* AuthorCode: dropdown dari Penulis Firestore */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
                    Penulis
                  </label>
                  {authLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat daftar penulis...
                    </div>
                  ) : (
                    <select
                      value={String((current as any).authorCode ?? "")}
                      onChange={(e) => setField("authorCode", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none"
                    >
                      <option value="">— Pilih penulis —</option>
                      {authorOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Tambah penulis baru di halaman{" "}
                    <a href="/admin/penulis" className="underline" style={{ color: "var(--brand)" }}>
                      Penulis
                    </a>.
                  </p>
                </div>

                {/* Audio Renungan Upload */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
                    Audio Renungan
                  </label>
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
                          setField("audioUrl", "");
                          if (url) await deleteUploadThingFile(url).catch(() => {});
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors shrink-0"
                        title="Hapus audio"
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
                      onUploadComplete={(res) => setField("audioUrl", res.url)}
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">MP3/WAV, maks 64 MB. Setelah upload, simpan ke Firestore.</p>
                </div>

                <TextareaField label="Isi Renungan (paragraf dipisah baris kosong)" fieldKey="body" rows={12} />
                <TextareaField label="Doa Penutup" fieldKey="prayer" rows={3} />

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
                    style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
                  >
                    {saving  ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                     : saved ? <><Check className="h-4 w-4" /> Tersimpan!</>
                     :         <><Save className="h-4 w-4" /> Simpan ke Firestore</>}
                  </button>

                  <button
                    onClick={() => setPreview(!preview)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
                  >
                    {preview ? <><EyeOff className="h-4 w-4" /> Tutup Pratinjau</> : <><Eye className="h-4 w-4" /> Pratinjau</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preview panel */}
          {preview && !loading && (
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
                  {String((current as any).body ?? "").split("\n\n").map((para, i) => (
                    <p key={i} className="text-foreground leading-relaxed">{para}</p>
                  ))}
                </div>
                {/* Tampilkan nama penulis lengkap jika ada */}
                {(current as any).authorCode && (
                  <p className="text-right text-sm text-muted-foreground italic mt-4">
                    {(() => {
                      const code = (current as any).authorCode;
                      const a = (authorsDict as any)[code];
                      return a ? `${a.title ? a.title + " " : ""}${a.name}` : `(${code})`;
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
      </AdminLayout>
    </AdminGuard>
  );
}