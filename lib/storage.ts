// ─── Firebase Storage Helpers ─────────────────────────────────────────────────
//
// STRUKTUR FOLDER DI STORAGE:
//   pustaka/          ← PDF dokumen (tata gereja, panduan, dll)
//   audio/            ← Audio renungan harian (.mp3)
//   images/           ← Gambar & thumbnail
//
// CARA MASUK KE FIREBASE STORAGE:
//   Firebase Console → Storage → Files
//   Bisa upload langsung dari browser (drag & drop)
//   Atau lewat admin panel (pakai fungsi uploadFile di bawah)

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  type StorageReference,
  type UploadTask,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

export type StorageFolder = "pustaka" | "audio" | "images";

export interface UploadResult {
  url: string;
  path: string;
  name: string;
}

export interface UploadProgress {
  percent: number;
  bytesTransferred: number;
  totalBytes: number;
}

// ─── Upload file dengan progress callback ─────────────────────────────────────
export function uploadFile(
  folder: StorageFolder,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    // Sanitize nama file: hapus spasi dan karakter aneh
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path     = `${folder}/${safeName}`;
    const fileRef  = ref(storage, path);
    const task: UploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
    });

    task.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.({
          percent,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes:       snapshot.totalBytes,
        });
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path, name: safeName });
      }
    );
  });
}

// ─── Ambil download URL dari path ────────────────────────────────────────────
export async function getFileURL(path: string): Promise<string> {
  try {
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (e) {
    console.error("[storage] getFileURL error:", e);
    return "";
  }
}

// ─── Hapus file dari Storage ──────────────────────────────────────────────────
export async function deleteFile(path: string): Promise<void> {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (e) {
    console.error("[storage] deleteFile error:", e);
  }
}

// ─── List semua file dalam folder ────────────────────────────────────────────
export async function listFiles(
  folder: StorageFolder
): Promise<Array<{ name: string; path: string; url: string }>> {
  try {
    const folderRef = ref(storage, folder);
    const result = await listAll(folderRef);
    const files = await Promise.all(
      result.items.map(async (item: StorageReference) => ({
        name: item.name,
        path: item.fullPath,
        url:  await getDownloadURL(item),
      }))
    );
    return files;
  } catch (e) {
    console.error("[storage] listFiles error:", e);
    return [];
  }
}

// ─── Format ukuran file untuk UI ─────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Validasi file sebelum upload ────────────────────────────────────────────
export function validateFile(
  file: File,
  folder: StorageFolder
): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024; // 50 MB

  const allowedTypes: Record<StorageFolder, string[]> = {
    pustaka: ["application/pdf"],
    audio:   ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
    images:  ["image/jpeg", "image/png", "image/webp"],
  };

  if (file.size > maxSize) {
    return { valid: false, error: `Ukuran file maksimal 50 MB (file kamu: ${formatFileSize(file.size)})` };
  }

  if (!allowedTypes[folder].includes(file.type)) {
    return {
      valid: false,
      error: `Format tidak didukung. Harus: ${allowedTypes[folder].join(", ")}`,
    };
  }

  return { valid: true };
}
