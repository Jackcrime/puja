"use client";
// ─── Uploadthing Client Helpers ───────────────────────────────────────────────

import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import { auth } from "@/lib/firebase";

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

// ─── Format ukuran file ───────────────────────────────────────────────────────
export function formatSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

// ─── Validasi sebelum upload ──────────────────────────────────────────────────
const LIMITS: Record<UploadEndpoint, { maxBytes: number; types: string[]; label: string }> = {
  pustakaUploader: { maxBytes: 32 * 1024 * 1024, types: ["application/pdf"],       label: "PDF, maks 32 MB"  },
  audioUploader:   { maxBytes: 64 * 1024 * 1024, types: ["audio/mpeg","audio/wav"], label: "MP3/WAV, maks 64 MB" },
  imageUploader:   { maxBytes: 4  * 1024 * 1024, types: ["image/jpeg","image/png","image/webp"], label: "JPG/PNG/WebP, maks 4 MB" },
};

export function validateFile(
  file: File,
  endpoint: UploadEndpoint
): { valid: boolean; error?: string } {
  const limit = LIMITS[endpoint];
  if (!limit) return { valid: true };
  if (file.size > limit.maxBytes)
    return { valid: false, error: `Ukuran maks ${formatSize(limit.maxBytes)}. File kamu: ${formatSize(file.size)}` };
  if (!limit.types.includes(file.type))
    return { valid: false, error: `Format harus ${limit.label}` };
  return { valid: true };
}