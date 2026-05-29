// ─── Supabase Storage Helpers ─────────────────────────────────────────────────
// Menggantikan lib/storage.ts (Firebase Storage) + lib/uploadthing-client.ts
//
// STRUKTUR BUCKET DI SUPABASE STORAGE:
//   pustaka/   ← PDF dokumen (maks 50 MB)
//   audio/     ← Audio renungan harian (maks 100 MB)
//   images/    ← Foto penulis & thumbnail (maks 5 MB)
//
// Buat bucket via Dashboard: Storage → New Bucket
// Set Public = true agar URL bisa diakses tanpa auth

import { supabase } from "@/lib/supabase";
export { formatFileSize, validateStorageFile as validateFile, type StorageFolder } from "@/lib/file-utils";

export interface UploadResult {
  url:  string;
  path: string;
  name: string;
  size: number;
}

export interface UploadProgress {
  percent:          number;
  bytesTransferred: number;
  totalBytes:       number;
}

// ─── Upload file ke Supabase Storage ─────────────────────────────────────────
// Progress tracking dilakukan via XHR wrapper karena Supabase SDK v2
// belum support onUploadProgress natively — gunakan fetch langsung lewat
// uploadWithProgress di bawah untuk progress, atau upload biasa tanpa progress.

export async function uploadFile(
  folder: StorageFolder,
  file:   File
): Promise<UploadResult> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path     = `${safeName}`;               // path di dalam bucket

  const { data, error } = await supabase.storage
    .from(folder)
    .upload(path, file, {
      contentType: file.type,
      upsert:      true,                         // overwrite kalau nama sama
    });

  if (error) {
    console.error("[storage] uploadFile error:", error);
    throw error;
  }

  const { data: urlData } = supabase.storage.from(folder).getPublicUrl(data.path);

  return {
    url:  urlData.publicUrl,
    path: data.path,
    name: safeName,
    size: file.size,
  };
}

// ─── Upload dengan progress (XHR-based) ──────────────────────────────────────
export function uploadFileWithProgress(
  folder:     StorageFolder,
  file:       File,
  onProgress: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path     = `${safeName}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Ambil session token
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token ?? anonKey;

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `${supabaseUrl}/storage/v1/object/${folder}/${path}?upsert=true`
      );
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.setRequestHeader("x-upsert", "true");

      xhr.upload.addEventListener("progress", (e) => {
        if (!e.lengthComputable) return;
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress({ percent, bytesTransferred: e.loaded, totalBytes: e.total });
      });

      xhr.addEventListener("load", () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(`Upload gagal: ${xhr.status} ${xhr.statusText}`));
          return;
        }
        const { data: urlData } = supabase.storage.from(folder).getPublicUrl(path);
        resolve({
          url:  urlData.publicUrl,
          path,
          name: safeName,
          size: file.size,
        });
      });

      xhr.addEventListener("error", () => reject(new Error("Upload gagal (network error)")));
      xhr.send(file);
    });
  });
}

// ─── Ambil public URL dari path ───────────────────────────────────────────────
export function getFileURL(folder: StorageFolder, path: string): string {
  const { data } = supabase.storage.from(folder).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Hapus file dari Storage ──────────────────────────────────────────────────
export async function deleteFile(folder: StorageFolder, path: string): Promise<void> {
  const { error } = await supabase.storage.from(folder).remove([path]);
  if (error) console.error("[storage] deleteFile error:", error);
}

// ─── Hapus file dari URL publik ───────────────────────────────────────────────
// Ekstrak path dari URL Supabase lalu hapus
export async function deleteFileByUrl(url: string): Promise<void> {
  if (!url) return;
  try {
    // URL: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const parts   = new URL(url).pathname.split("/object/public/");
    if (parts.length < 2) return;
    const [bucket, ...rest] = parts[1].split("/");
    const path = rest.join("/");
    await deleteFile(bucket as StorageFolder, path);
  } catch (e) {
    console.error("[storage] deleteFileByUrl error:", e);
  }
}

// ─── List semua file dalam bucket ────────────────────────────────────────────
export async function listFiles(
  folder: StorageFolder
): Promise<Array<{ name: string; path: string; url: string }>> {
  const { data, error } = await supabase.storage.from(folder).list();
  if (error) {
    console.error("[storage] listFiles error:", error);
    return [];
  }
  return (data ?? []).map((item) => ({
    name: item.name,
    path: item.name,
    url:  getFileURL(folder, item.name),
  }));
}
