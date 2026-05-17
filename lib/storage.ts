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
// Shared utilities — satu sumber kebenaran untuk format & validasi
export { formatFileSize, validateStorageFile as validateFile, type StorageFolder } from "@/lib/file-utils";

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

// ─── Format ukuran file & validasi — re-exported dari lib/file-utils.ts ──────
// (dulu ada di sini, sekarang dipusatkan di file-utils untuk menghindari duplikasi)
