// ─── Supabase Server Client ───────────────────────────────────────────────────
// SERVER-SIDE ONLY — hanya boleh diimport di:
//   - Route Handlers (app/api/**/route.ts)
//   - Server Components (tanpa "use client")
//   - Server Actions ("use server")
//
// Pakai service_role key agar bisa bypass RLS (admin operations)

import { createClient } from "@supabase/supabase-js";

/**
 * Client dengan service_role — bypass RLS.
 * Gunakan HANYA di server-side untuk operasi admin.
 */
export function createAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "[supabase-server] NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum di-set"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Verifikasi bahwa request berasal dari user yang sudah login.
 * Gunakan di API routes yang butuh autentikasi admin.
 *
 * @returns user object kalau valid, throw Error kalau tidak
 */
export async function verifyAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")?.trim();

  if (!token) throw new Error("Unauthorized: tidak ada token");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Unauthorized: token tidak valid");
  }

  return data.user;
}
