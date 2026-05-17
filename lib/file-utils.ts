// ─── Shared File Utilities ────────────────────────────────────────────────────
// Satu sumber kebenaran untuk format dan validasi file.
// Dipakai oleh lib/storage.ts dan lib/uploadthing-client.ts
// agar tidak ada duplikasi — perubahan aturan cukup di satu tempat.

/**
 * Format bytes ke string yang human-readable (B / KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validasi file sebelum upload ke Firebase Storage
 * (gunakan validateUploadThingFile untuk endpoint UploadThing)
 */
export type StorageFolder = "pustaka" | "audio" | "images";

const STORAGE_LIMITS: Record<StorageFolder, { maxBytes: number; types: string[] }> = {
  pustaka: { maxBytes: 50 * 1024 * 1024, types: ["application/pdf"] },
  audio:   { maxBytes: 100 * 1024 * 1024, types: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"] },
  images:  { maxBytes: 5 * 1024 * 1024,  types: ["image/jpeg", "image/png", "image/webp"] },
};

export function validateStorageFile(
  file: File,
  folder: StorageFolder
): { valid: boolean; error?: string } {
  const limit = STORAGE_LIMITS[folder];
  if (file.size > limit.maxBytes) {
    return { valid: false, error: `Ukuran file maksimal ${formatFileSize(limit.maxBytes)} (file kamu: ${formatFileSize(file.size)})` };
  }
  if (!limit.types.includes(file.type)) {
    return { valid: false, error: `Format tidak didukung. Harus: ${limit.types.join(", ")}` };
  }
  return { valid: true };
}

/**
 * Validasi file sebelum upload via UploadThing endpoint
 */
export type UploadEndpoint = "pustakaUploader" | "audioUploader" | "imageUploader";

const UPLOADTHING_LIMITS: Record<UploadEndpoint, { maxBytes: number; types: string[]; label: string }> = {
  pustakaUploader: { maxBytes: 32 * 1024 * 1024, types: ["application/pdf"], label: "PDF, maks 32 MB" },
  audioUploader:   { maxBytes: 64 * 1024 * 1024, types: ["audio/mpeg","audio/wav","audio/webm","audio/ogg","audio/mp4","audio/aac"], label: "MP3/WAV/WebM, maks 64 MB" },
  imageUploader:   { maxBytes: 4  * 1024 * 1024, types: ["image/jpeg","image/png","image/webp"], label: "JPG/PNG/WebP, maks 4 MB" },
};

export function validateUploadThingFile(
  file: File,
  endpoint: UploadEndpoint
): { valid: boolean; error?: string } {
  const limit = UPLOADTHING_LIMITS[endpoint];
  if (!limit) return { valid: true };
  if (file.size > limit.maxBytes)
    return { valid: false, error: `Ukuran maks ${formatFileSize(limit.maxBytes)}. File kamu: ${formatFileSize(file.size)}` };
  if (!limit.types.includes(file.type))
    return { valid: false, error: `Format harus ${limit.label}` };
  return { valid: true };
}
