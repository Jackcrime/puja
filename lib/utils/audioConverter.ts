"use client";

// ─── Audio Converter — konversi audio ke WebM/Opus di browser ────────────────
// Strategi: decode audio dengan AudioContext, encode ulang via MediaRecorder
// Fallback: kalau browser tidak support WebM, file dikembalikan apa adanya.

export interface ConvertResult {
  file:      File;
  converted: boolean;   // true = berhasil dikonversi ke WebM
  sizeBefore: number;
  sizeAfter:  number;
}

/** Cek apakah browser bisa encode WebM/Opus */
export function browserSupportsWebM(): boolean {
  if (typeof window === "undefined") return false;
  return (
    MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ||
    MediaRecorder.isTypeSupported("audio/webm")
  );
}

/**
 * Konversi file audio apa saja (MP3, WAV, OGG, dll.) ke WebM/Opus.
 * Kalau browser tidak support atau konversi gagal, kembalikan file asli.
 *
 * @param file     File audio yang diupload user
 * @param onProgress  Callback progress 0–100
 */
export async function convertToWebM(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ConvertResult> {
  const sizeBefore = file.size;

  // Sudah WebM? Langsung return
  if (file.type === "audio/webm") {
    return { file, converted: false, sizeBefore, sizeAfter: file.size };
  }

  // Cek dukungan browser
  if (!browserSupportsWebM()) {
    console.warn("[audioConverter] Browser tidak support WebM encoding — file dikirim as-is.");
    return { file, converted: false, sizeBefore, sizeAfter: file.size };
  }

  try {
    onProgress?.(5);

    // 1. Baca file sebagai ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(15);

    // 2. Decode audio
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx      = new AudioCtx();
    const decoded  = await ctx.decodeAudioData(arrayBuffer);
    onProgress?.(40);

    // 3. Render ke offline context (agar tidak ada delay/lag)
    const offlineCtx = new OfflineAudioContext(
      decoded.numberOfChannels,
      decoded.length,
      decoded.sampleRate,
    );
    const src = offlineCtx.createBufferSource();
    src.buffer = decoded;
    src.connect(offlineCtx.destination);
    src.start(0);
    const renderedBuffer = await offlineCtx.startRendering();
    await ctx.close();
    onProgress?.(60);

    // 4. Convert AudioBuffer → MediaStream via AudioContext + createMediaStreamDestination
    const streamCtx = new AudioContext();
    const dest      = streamCtx.createMediaStreamDestination();
    const player    = streamCtx.createBufferSource();
    player.buffer   = renderedBuffer;
    player.connect(dest);

    // 5. Rekam dengan MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const chunks: BlobPart[] = [];
    const recorder           = new MediaRecorder(dest.stream, { mimeType });

    await new Promise<void>((resolve, reject) => {
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop          = () => resolve();
      recorder.onerror         = (e) => reject((e as any).error ?? new Error("Rekam gagal"));

      recorder.start(100); // timeslice 100ms
      player.start(0);
      onProgress?.(70);

      // Hentikan recorder setelah durasi audio selesai
      const durationMs = renderedBuffer.duration * 1000;
      setTimeout(() => {
        try { recorder.stop(); } catch {}
        try { streamCtx.close(); } catch {}
      }, durationMs + 200);
    });

    onProgress?.(90);

    const blob    = new Blob(chunks, { type: mimeType });
    const webmFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, "") + ".webm",
      { type: mimeType },
    );

    onProgress?.(100);

    return {
      file:      webmFile,
      converted: true,
      sizeBefore,
      sizeAfter: webmFile.size,
    };
  } catch (err) {
    console.error("[audioConverter] Konversi gagal, pakai file asli:", err);
    return { file, converted: false, sizeBefore, sizeAfter: file.size };
  }
}