// ─── Supabase Browser Client ──────────────────────────────────────────────────
// Menggantikan lib/firebase.ts
// Dipakai di "use client" components dan hooks

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton untuk dipakai langsung (sama seperti `db`, `auth`, `storage` dari firebase)
export const supabase = createClient();
