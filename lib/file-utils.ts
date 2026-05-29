// ─── Shared File Utilities ────────────────────────────────────────────────────
// Satu sumber kebenaran untuk format dan validasi file.
// Dipakai oleh lib/storage.ts dan components/admin/FileUploader.tsx

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Supabase Storage buckets ────────────────────────────────────────────────
export type StorageFolder = "pustaka" | "audio" | "images";

const STORAGE_LIMITS: Record<StorageFolder, { maxBytes: number; types: string[]; label: string }> = {
  pustaka: {
    maxBytes: 50 * 1024 * 1024,
    types:    ["application/pdf"],
    label:    "PDF, maks 50 MB",
  },
  audio: {
    maxBytes: 100 * 1024 * 1024,
    types:    ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/aac"],
    label:    "MP3/WAV/WebM, maks 100 MB",
  },
  images: {
    maxBytes: 5 * 1024 * 1024,
    types:    ["image/jpeg", "image/png", "image/webp"],
    label:    "JPG/PNG/WebP, maks 5 MB",
  },
};

export function validateStorageFile(
  file:   File,
  folder: StorageFolder
): { valid: boolean; error?: string } {
  const limit = STORAGE_LIMITS[folder];
  if (!limit) return { valid: true };

  if (file.size > limit.maxBytes) {
    return {
      valid: false,
      error: `Ukuran maks ${formatFileSize(limit.maxBytes)}. File kamu: ${formatFileSize(file.size)}`,
    };
  }
  if (!limit.types.includes(file.type)) {
    return { valid: false, error: `Format harus ${limit.label}` };
  }
  return { valid: true };
}

export function getStorageLabel(folder: StorageFolder): string {
  return STORAGE_LIMITS[folder]?.label ?? "";
}
