"use client";
// ─── Uploadthing Client Helpers ───────────────────────────────────────────────

import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import { auth } from "@/lib/firebase";
// Shared utilities — satu sumber kebenaran untuk format & validasi
export { formatFileSize as formatSize, validateUploadThingFile as validateFile, type UploadEndpoint } from "@/lib/file-utils";

export const UploadButton   = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// ─── useUploadThing hook (typed untuk project ini) ────────────────────────────
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export interface UploadResult {
  url:  string;
  name: string;
  size: number;
}

export type UploadEndpoint = keyof OurFileRouter;

// ─── Ambil token Firebase untuk dikirim ke middleware Uploadthing ─────────────
export async function getUploadHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Belum login");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// ─── Format & validasi — re-exported dari lib/file-utils.ts ──────────────────
// (dulu duplikat di sini, sekarang dipusatkan untuk menghindari inkonsistensi)

// ─── Hapus file dari UploadThing via API route ────────────────────────────────
// Dipanggil saat admin menghapus record yang punya file (foto penulis, PDF pustaka, dll.)
export async function deleteUploadThingFile(url: string | string[]): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Belum login");
  const token = await user.getIdToken();

  const urls = Array.isArray(url) ? url : [url];
  const validUrls = urls.filter(Boolean);
  if (validUrls.length === 0) return;

  const res = await fetch("/api/uploadthing/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ urls: validUrls }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("[deleteUploadThingFile] Gagal:", data.error ?? res.statusText);
    // Tidak throw — agar proses hapus data Firestore tetap lanjut
  }
}

// ─── Validasi sebelum upload — gunakan validateFile dari lib/file-utils.ts ────