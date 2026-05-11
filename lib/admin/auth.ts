// ─── Admin Auth via Firebase Authentication ───────────────────────────────────
// Password dikelola di Firebase Console → Authentication → Users
// Tidak ada password di kode atau env — lebih aman.

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(password: string): Promise<boolean> {
  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
    return true;
  } catch (e: any) {
    console.warn("[auth] login failed:", e.code);
    return false;
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch {}
}

// ─── Cek apakah sudah login (sync — dari cached state) ────────────────────────
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

// ─── Subscribe ke perubahan auth state (untuk guard) ─────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── Ambil current user ───────────────────────────────────────────────────────
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
