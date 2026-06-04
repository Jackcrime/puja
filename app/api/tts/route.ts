// ─── API Route: POST /api/tts ─────────────────────────────────────────────────
//
// Generate audio dari teks menggunakan ElevenLabs TTS,
// lalu upload hasilnya ke Supabase Storage bucket "audio".
//
// Request body:
//   { text: string, voice?: string }
//
// Response:
//   { url: string, path: string, size: number, voice: string }
//
// .env.local:
//   ELEVENLABS_API_KEY=your_api_key

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAdminClient } from "@/lib/supabase-server";

// ── Konfigurasi ────────────────────────────────────────────────────────────────
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY ?? "";
const MAX_CHARS      = 6_500;
const BUCKET         = "audio";
const MODEL_ID       = "eleven_multilingual_v2";

// Default voices — pakai built-in ElevenLabs yang tersedia di free tier
const VOICES = {
  pria:   "pNInz6obpgDQGcFmaJgB", // Adam — neutral male, cocok untuk renungan
  wanita: "EXAVITQu4vr4xnSDxMaL", // Bella — warm female
} as const;

const DEFAULT_VOICE = VOICES.pria;
const ALLOWED_VOICES = Object.values(VOICES);

// ── Handler ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Cek API key
  if (!ELEVENLABS_KEY) {
    return NextResponse.json(
      { error: "ElevenLabs API key belum dikonfigurasi. Set ELEVENLABS_API_KEY di environment." },
      { status: 503 }
    );
  }

  // 2. Auth — hanya admin
  try {
    await verifyAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Parse body
  let text: string;
  let voice: string;

  try {
    const body = await req.json();
    text  = String(body.text  ?? "").trim();
    voice = String(body.voice ?? DEFAULT_VOICE).trim();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  // 4. Validasi
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

  // 5. Hit ElevenLabs TTS API
  let audioBuffer: Buffer;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method:  "POST",
        headers: {
          "xi-api-key":   ELEVENLABS_KEY,
          "Content-Type": "application/json",
          "Accept":       "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability:        0.5,
            similarity_boost: 0.75,
            style:            0.3,  // sedikit expressive untuk renungan
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error("[tts] ElevenLabs error:", res.status, errBody);

      if (res.status === 401) {
        return NextResponse.json(
          { error: "ElevenLabs API key tidak valid." },
          { status: 401 }
        );
      }
      if (res.status === 429) {
        return NextResponse.json(
          { error: "Quota ElevenLabs habis. Upgrade plan atau coba bulan depan." },
          { status: 429 }
        );
      }

      throw new Error(`ElevenLabs error: ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    audioBuffer = Buffer.from(arrayBuffer);

  } catch (e: any) {
    console.error("[tts] generate error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Gagal generate audio." },
      { status: 500 }
    );
  }

  // 6. Upload ke Supabase Storage
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