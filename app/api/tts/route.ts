// ─── API Route: POST /api/tts ─────────────────────────────────────────────────
//
// Generate audio dari teks menggunakan msedge-tts (Microsoft Edge TTS),
// lalu upload hasilnya ke Supabase Storage bucket "audio".
//
// Request body:
//   { text: string, voice?: string }
//
// Response:
//   { url: string, path: string, size: number, voice: string }
//
// Voice options (Indonesia):
//   "id-ID-ArdiNeural"   — pria (default)
//   "id-ID-GadisNeural"  — wanita
//
// Setup:
//   npm install msedge-tts

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAdminClient } from "@/lib/supabase-server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// ── Konfigurasi ────────────────────────────────────────────────────────────────
const DEFAULT_VOICE  = "id-ID-ArdiNeural";
const ALLOWED_VOICES = ["id-ID-ArdiNeural", "id-ID-GadisNeural"] as const;
const MAX_CHARS      = 6_500;
const BUCKET         = "audio";

// ── Helper: stream → Buffer ───────────────────────────────────────────────────
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data",  (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on("end",   () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

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
      {
        error:   `Teks terlalu panjang. Maks ${MAX_CHARS.toLocaleString()} karakter.`,
        current: text.length,
        max:     MAX_CHARS,
      },
      { status: 400 }
    );
  }
  if (!ALLOWED_VOICES.includes(voice as any)) {
    voice = DEFAULT_VOICE;
  }

  // 4. Generate via msedge-tts
  let audioBuffer: Buffer;

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);
    audioBuffer = await streamToBuffer(audioStream);
  } catch (e: any) {
    console.error("[tts] generate error:", e);

    // Edge TTS tidak bisa dihubungi
    if (e?.message?.includes("connect") || e?.message?.includes("network") || e?.code === "ECONNREFUSED") {
      return NextResponse.json(
        { error: "Tidak dapat terhubung ke server Microsoft Edge TTS. Coba lagi." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: e?.message ?? "Gagal generate audio." },
      { status: 500 }
    );
  }

  // 5. Upload ke Supabase Storage
  try {
    const supabase  = createAdminClient();
    const timestamp = Date.now();
    const filename  = `tts-${timestamp}.mp3`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, audioBuffer, {
        contentType: "audio/mpeg",
        upsert:      false,
      });

    if (uploadError) throw new Error(`Upload gagal: ${uploadError.message}`);

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      url:   urlData.publicUrl,
      path:  uploadData.path,
      size:  audioBuffer.length,
      voice,
    });

  } catch (e: any) {
    console.error("[tts] upload error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Gagal upload audio ke storage." },
      { status: 500 }
    );
  }
}