// ─── API Route: POST /api/tts/generate ────────────────────────────────────────
//
// Generate audio dari teks menggunakan Microsoft Edge TTS (gratis),
// lalu upload hasilnya ke Supabase Storage bucket "audio".
//
// Request body:
//   { text: string, voice?: string }
//
// Response:
//   { url: string, path: string, duration?: number }
//
// Voice options (Indonesia):
//   "id-ID-ArdiNeural"  — pria
//   "id-ID-GadisNeural" — wanita (default)
//
// Setup (satu kali):
//   pip install edge-tts
//
// .env.local:
//   TTS_ENABLED=true   (opsional, default true)

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAdminClient } from "@/lib/supabase-server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

// ── Konfigurasi ────────────────────────────────────────────────────────────────
const DEFAULT_VOICE  = "id-ID-GadisNeural";
const ALLOWED_VOICES = ["id-ID-ArdiNeural", "id-ID-GadisNeural"];
const MAX_CHARS      = 10_000;   // ~10 menit audio
const BUCKET         = "audio";

// ── Handler ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Auth — hanya admin
  try {
    await verifyAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let text: string;
  let voice: string;

  try {
    const body = await req.json();
    text  = String(body.text  ?? "").trim();
    voice = String(body.voice ?? DEFAULT_VOICE).trim();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  // 3. Validasi
  if (!text) {
    return NextResponse.json({ error: "Teks tidak boleh kosong." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Teks terlalu panjang. Maks ${MAX_CHARS.toLocaleString()} karakter.` },
      { status: 400 }
    );
  }
  if (!ALLOWED_VOICES.includes(voice)) {
    voice = DEFAULT_VOICE;
  }

  // 4. Generate via edge-tts
  let tmpDir: string | null = null;

  try {
    // Buat temp dir
    tmpDir = await mkdtemp(join(tmpdir(), "tts-"));
    const outPath  = join(tmpDir, "output.mp3");
    const txtPath  = join(tmpDir, "input.txt");

    // Tulis teks ke file (menghindari shell injection)
    await writeFile(txtPath, text, "utf-8");

    // Jalankan edge-tts
    // --file: baca dari file supaya teks panjang/special chars aman
    await execAsync(
      `edge-tts --voice "${voice}" --file "${txtPath}" --write-media "${outPath}"`,
      { timeout: 120_000 }  // 2 menit timeout
    );

    // Baca hasil
    const audioBuffer = await readFile(outPath);
    const audioSize   = audioBuffer.length;

    // 5. Upload ke Supabase Storage
    const supabase  = createAdminClient();
    const timestamp = Date.now();
    const filename  = `tts-${timestamp}.mp3`;
    const storagePath = filename;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert:      false,
      });

    if (uploadError) {
      throw new Error(`Upload gagal: ${uploadError.message}`);
    }

    // 6. Ambil public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uploadData.path);

    // 7. Cleanup temp files
    await unlink(outPath).catch(() => {});
    await unlink(txtPath).catch(() => {});

    return NextResponse.json({
      url:  urlData.publicUrl,
      path: uploadData.path,
      size: audioSize,
      voice,
    });

  } catch (e: any) {
    console.error("[tts/generate] error:", e);

    // Cleanup on error
    if (tmpDir) {
      const { rm } = await import("fs/promises");
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }

    // Edge-tts tidak terinstall
    if (e?.message?.includes("edge-tts") || e?.message?.includes("not found") || e?.code === 127) {
      return NextResponse.json(
        {
          error: "edge-tts belum terinstall di server. Jalankan: pip install edge-tts",
          hint:  "install",
        },
        { status: 503 }
      );
    }

    // Edge TTS API unreachable (Microsoft server)
    if (e?.message?.includes("ECONNREFUSED") || e?.message?.includes("fetch")) {
      return NextResponse.json(
        { error: "Tidak dapat terhubung ke server Microsoft Edge TTS. Coba lagi." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: e?.message ?? "Terjadi kesalahan saat generate audio." },
      { status: 500 }
    );
  }
}