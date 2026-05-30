// ─── middleware.ts ────────────────────────────────────────────────────────────
// WAJIB ada di root proyek (sejajar dengan app/, bukan di dalam app/).
// Fungsinya: refresh Supabase session token di setiap request agar session
// tidak expire dan auth cookie selalu up-to-date.
//
// Tanpa file ini: login berhasil tapi session tidak persisten antar navigasi,
// akibatnya semua write ke Supabase kena RLS reject (user dianggap anon).

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — JANGAN hapus baris ini
  // Ini yang bikin session tetap valid antar navigasi
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Jalankan middleware di semua route KECUALI static files & _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};