// ─── Supabase Safe Write Helpers ─────────────────────────────────────────────
// Masalah: supabase.from(...).upsert() TIDAK throw kalau RLS reject atau error
// lainnya — dia return { data, error }. Kalau error tidak dicek, UI kelihatan
// berhasil padahal DB-nya menolak.
//
// Solusi: pakai `sw()` (safe write) untuk semua operasi tulis. Kalau ada error,
// dia throw supaya tertangkap catch block di hook dan toast.error tampil.
//
// FIX: Pakai PromiseLike (bukan Promise) karena Supabase PostgrestFilterBuilder
// hanya implement PromiseLike — punya .then() tapi bukan full Promise.

// PromiseLike lebih luas dari Promise: cukup punya .then()
// Supabase query builders (delete, insert, upsert, update) semuanya PromiseLike
type SupabaseResult<T> = PromiseLike<{ data: T | null; error: any }>;

/**
 * sw = "safe write"
 * Wrap semua operasi Supabase yang menulis data.
 * Auto-throw kalau ada error, termasuk RLS violations.
 *
 * Contoh pakai:
 *   await sw(supabase.from("devotional").upsert({ ... }))
 *   await sw(supabase.from("authors").insert({ ... }))
 *   await sw(supabase.from("ayat_nats").delete().eq("id", id))
 */
export async function sw<T>(query: SupabaseResult<T>): Promise<T | null> {
  const { data, error } = await query;

  if (error) {
    // Log ke console supaya mudah debug di dev tools
    console.error("[Supabase Error]", {
      code:    error.code,
      message: error.message,
      details: error.details,
      hint:    error.hint,
    });

    // Pesan yang lebih manusiawi untuk toast
    const msg = formatSupabaseError(error);
    throw new Error(msg);
  }

  return data;
}

/**
 * swMany = safe write, return array (untuk .select() setelah insert/update)
 */
export async function swMany<T>(query: SupabaseResult<T[]>): Promise<T[]> {
  const result = await sw(query as any);
  return (result as T[]) ?? [];
}

/**
 * sr = "safe read"
 * Untuk read yang HARUS ada datanya (throw kalau kosong juga).
 * Pakai untuk .single() yang wajib ada.
 */
export async function sr<T>(query: SupabaseResult<T>): Promise<T> {
  const data = await sw(query);
  if (data === null) throw new Error("Data tidak ditemukan.");
  return data as T;
}

// ─── Format error Supabase jadi pesan yang lebih jelas ───────────────────────
function formatSupabaseError(error: any): string {
  const code    = error?.code ?? "";
  const message = error?.message ?? "Terjadi kesalahan";

  // RLS violation
  if (code === "42501" || message.includes("row-level security")) {
    return "Akses ditolak. Pastikan kamu sudah login sebagai admin.";
  }

  // Unique constraint
  if (code === "23505" || message.includes("unique")) {
    return "Data duplikat — sudah ada data dengan nilai yang sama.";
  }

  // Foreign key violation
  if (code === "23503") {
    return "Data referensi tidak ditemukan. Cek relasi tabel.";
  }

  // Not null violation
  if (code === "23502") {
    return "Ada field wajib yang kosong.";
  }

  // JWT expired / auth error
  if (code === "PGRST301" || message.includes("JWT")) {
    return "Sesi login kamu sudah habis. Silakan login ulang.";
  }

  // Network / generic
  return message;
}