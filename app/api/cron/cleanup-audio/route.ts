// // ─── Cron Job: GET /api/cron/cleanup-audio ────────────────────────────────────
// //
// // Hapus file audio TTS lama dari Supabase Storage.
// // Hanya hapus file yang:
// //   1. Namanya diawali "tts-" (hasil generate, bukan upload manual admin)
// //   2. Sudah lebih dari 30 hari (berdasarkan timestamp di nama file)
// //   3. URL-nya tidak ada di tabel devotionals / pustaka_books (orphan check)
// //
// // Dijadwalkan via Vercel Cron — sekali sebulan (tanggal 1, jam 00:00 WIB)
// // vercel.json:
// //   { "crons": [{ "path": "/api/cron/cleanup-audio", "schedule": "0 17 1 * *" }] }
// //   (17:00 UTC = 00:00 WIB)
// //
// // Keamanan: hanya bisa dipanggil oleh Vercel (CRON_SECRET) atau admin manual

// import { NextRequest, NextResponse } from "next/server";
// import { createAdminClient } from "@/lib/supabase-server";

// const BUCKET       = "audio";
// const MAX_AGE_DAYS = 30;
// const CRON_SECRET  = process.env.CRON_SECRET ?? "";

// // ── Helper: ambil timestamp dari nama file "tts-1234567890.mp3" ───────────────
// function getFileAge(filename: string): number | null {
//   const match = filename.match(/^tts-(\d+)\./);
//   if (!match) return null;
//   const ts  = parseInt(match[1], 10);
//   const age = (Date.now() - ts) / (1000 * 60 * 60 * 24); // dalam hari
//   return age;
// }

// // ── Handler ────────────────────────────────────────────────────────────────────
// export async function GET(req: NextRequest) {
//   // 1. Auth — hanya Vercel Cron atau manual dengan secret
//   const authHeader = req.headers.get("authorization");
//   const isVercel   = authHeader === `Bearer ${CRON_SECRET}` && CRON_SECRET !== "";
//   const isManual   = req.nextUrl.searchParams.get("secret") === CRON_SECRET && CRON_SECRET !== "";

//   if (!isVercel && !isManual) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const supabase = createAdminClient();
//   const results  = {
//     scanned:  0,
//     deleted:  0,
//     skipped:  0,
//     errors:   0,
//     files:    [] as string[],
//   };

//   try {
//     // 2. List semua file di bucket audio
//     const { data: files, error: listError } = await supabase.storage
//       .from(BUCKET)
//       .list("", { limit: 1000 });

//     if (listError) throw new Error(`List files gagal: ${listError.message}`);
//     if (!files || files.length === 0) {
//       return NextResponse.json({ message: "Tidak ada file di bucket.", ...results });
//     }

//     // 3. Filter hanya file TTS yang sudah tua
//     const candidates = files.filter((f) => {
//       if (!f.name.startsWith("tts-")) return false; // skip upload manual
//       const age = getFileAge(f.name);
//       return age !== null && age >= MAX_AGE_DAYS;
//     });

//     results.scanned  = files.length;
//     results.skipped  = files.length - candidates.length;

//     if (candidates.length === 0) {
//       return NextResponse.json({ message: "Tidak ada file lama untuk dihapus.", ...results });
//     }

//     // 4. Ambil semua audio URL yang masih aktif di database
//     //    Cek di tabel: devotionals dan pustaka_books
//     const { data: devotionals } = await supabase
//       .from("devotionals")
//       .select("audio_url")
//       .not("audio_url", "is", null)
//       .neq("audio_url", "");

//     const { data: pustakaBooks } = await supabase
//       .from("pustaka_books")
//       .select("audio_url")
//       .not("audio_url", "is", null)
//       .neq("audio_url", "");

//     // Kumpulkan semua URL aktif
//     const activeUrls = new Set<string>([
//       ...(devotionals  ?? []).map((r) => r.audio_url as string),
//       ...(pustakaBooks ?? []).map((r) => r.audio_url as string),
//     ]);

//     // 5. Filter kandidat yang URL-nya masih aktif di DB (jangan hapus!)
//     const toDelete = candidates.filter((f) => {
//       // Reconstruct public URL untuk cek
//       const { data } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
//       return !activeUrls.has(data.publicUrl);
//     });

//     const toSkipActive = candidates.length - toDelete.length;
//     results.skipped += toSkipActive;

//     if (toDelete.length === 0) {
//       return NextResponse.json({
//         message: `${candidates.length} file lama ditemukan tapi semua masih dipakai di database.`,
//         ...results,
//       });
//     }

//     // 6. Hapus file orphan yang sudah tua
//     const filenames = toDelete.map((f) => f.name);
//     const { error: deleteError } = await supabase.storage
//       .from(BUCKET)
//       .remove(filenames);

//     if (deleteError) {
//       results.errors++;
//       console.error("[cleanup-audio] delete error:", deleteError.message);
//       return NextResponse.json(
//         { error: `Hapus gagal: ${deleteError.message}`, ...results },
//         { status: 500 }
//       );
//     }

//     results.deleted = filenames.length;
//     results.files   = filenames;

//     console.log(`[cleanup-audio] Berhasil hapus ${filenames.length} file:`, filenames);

//     return NextResponse.json({
//       message: `Berhasil hapus ${results.deleted} file audio lama.`,
//       ...results,
//     });

//   } catch (e: any) {
//     console.error("[cleanup-audio] error:", e);
//     return NextResponse.json(
//       { error: e?.message ?? "Terjadi kesalahan." },
//       { status: 500 }
//     );
//   }
// }