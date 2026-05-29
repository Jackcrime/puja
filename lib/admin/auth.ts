// ─── Admin Auth via Supabase Auth ─────────────────────────────────────────────
// Menggantikan lib/admin/auth.ts (Firebase Authentication)
// Password dikelola di Supabase Dashboard → Authentication → Users

import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.warn("[auth] login failed:", error.message);
    return false;
  }
  return true;
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Cek apakah sudah login ───────────────────────────────────────────────────
export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

// ─── Ambil current user ───────────────────────────────────────────────────────
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// ─── Ambil session (untuk dapat access_token ke API routes) ──────────────────
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Ambil Bearer token untuk dikirim ke API routes ──────────────────────────
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  if (!session) throw new Error("Belum login");
  return { Authorization: `Bearer ${session.access_token}` };
}

// ─── Subscribe ke perubahan auth state ───────────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return data.subscription.unsubscribe;
}
