"use client";

import React, { useState, useRef } from "react";
import {
  Upload, Sparkles, Loader2, Music2, X, RefreshCw,
  CheckCircle2, Play, Pause, Volume2, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudioZoneProps {
  currentUrl: string;
  onUploaded: (url: string) => void;
  onRemove:   () => Promise<void>;
  // teks renungan & doa untuk auto-fill generate
  bodyText?:  string;
  titleText?: string;
}

type AudioMode = "upload" | "generate";

const VOICES = [
  { id: "id-ID-ArdiNeural",  label: "Ardi (Pria)",    preview: "Selamat pagi, firman Tuhan menyertai Anda hari ini." },
  { id: "id-ID-GadisNeural", label: "Gadis (Wanita)", preview: "Selamat pagi, firman Tuhan menyertai Anda hari ini." },
];

// ─── Voice Selector ───────────────────────────────────────────────────────────

function VoiceSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = VOICES.find((v) => v.id === value) ?? VOICES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium hover:bg-muted/50 transition-colors w-full"
      >
        <Volume2 className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
        <span className="flex-1 text-left text-xs">{selected.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {VOICES.map((v) => (
            <button
              key={v.id}
              onClick={() => { onChange(v.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: value === v.id ? "var(--brand)" : "var(--border)" }}
              />
              <div>
                <p className="text-xs font-semibold">{v.label}</p>
                <p className="text-[10px] text-muted-foreground">{v.id}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mini Audio Player ────────────────────────────────────────────────────────

function MiniPlayer({ url, label }: { url: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-muted/30">
      <button
        onClick={toggle}
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105"
        style={{ backgroundColor: "var(--brand)" }}
      >
        {playing
          ? <Pause className="h-3 w-3 text-white" />
          : <Play  className="h-3 w-3 text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{label ?? "Preview Audio"}</p>
        <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} className="hidden" />
      </div>
    </div>
  );
}

// ─── Generate Panel ───────────────────────────────────────────────────────────

interface GeneratePanelProps {
  bodyText?:  string;
  titleText?: string;
  onGenerated: (url: string) => void;
}

function GeneratePanel({ bodyText, titleText, onGenerated }: GeneratePanelProps) {
  const [text,       setText]       = useState(bodyText ?? "");
  const [voice,      setVoice]      = useState(VOICES[0].id);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error,      setError]      = useState("");
  const [uploading,  setUploading]  = useState(false);
  const [done,       setDone]       = useState(false);

  // Sync bodyText ketika berubah dari luar
  React.useEffect(() => {
    if (bodyText && !text) setText(bodyText);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyText]);

  const charCount  = text.length;
  const wordCount  = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimateSec = Math.ceil(wordCount / 2.5); // ~150 kata/menit

  const handleGenerate = async () => {
    if (!text.trim()) { setError("Teks tidak boleh kosong."); return; }
    setError(""); setGenerating(true); setPreviewUrl(""); setDone(false);

    try {
      // Ambil session token dari Supabase
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("Sesi tidak ditemukan. Silakan login ulang.");

      const res = await fetch("/api/tts", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      // API returns { url: string } — URL dari Supabase Storage
      const { url } = await res.json();
      setPreviewUrl(url);
    } catch (e: any) {
      setError(e?.message ?? "Gagal generate audio. Coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  const handleUse = async () => {
    if (!previewUrl) return;
    setUploading(true);
    onGenerated(previewUrl);
    setDone(true);
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      {/* Teks input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Teks untuk dibacakan</p>
          <div className="flex items-center gap-2">
            {bodyText && (
              <button
                onClick={() => setText(bodyText)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors hover:bg-muted"
                style={{ color: "var(--brand)" }}
              >
                Ambil dari isi renungan
              </button>
            )}
            <span className="text-[10px] text-muted-foreground">
              {charCount} karakter · ~{estimateSec}s
            </span>
          </div>
        </div>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik atau tempel teks renungan yang ingin dijadikan audio..."
          className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 resize-none leading-relaxed"
        />
      </div>

      {/* Voice */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Suara</p>
        <VoiceSelector value={voice} onChange={setVoice} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" /> {error}
        </p>
      )}

      {/* Preview result */}
      {previewUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Audio berhasil digenerate!
          </div>
          <MiniPlayer url={previewUrl} label={titleText ? `Preview: ${titleText}` : "Preview Audio"} />
          <div className="flex gap-2">
            <button
              onClick={handleUse}
              disabled={uploading || done}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: done ? "#16a34a" : "var(--brand)" }}
            >
              {done ? (
                <><CheckCircle2 className="h-4 w-4" /> Digunakan!</>
              ) : uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Gunakan Audio Ini</>
              )}
            </button>
            <button
              onClick={() => { setPreviewUrl(""); setDone(false); }}
              className="px-3 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              title="Buang hasil generate"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generate button */}
      {!previewUrl && (
        <button
          onClick={handleGenerate}
          disabled={generating || !text.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 70%, var(--gold)) 100%)" }}
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sedang generate...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate Audio</>
          )}
        </button>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Menggunakan Microsoft Edge TTS · Suara neural Indonesia · Gratis
      </p>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function AudioZoneWithGenerate({
  currentUrl,
  onUploaded,
  onRemove,
  bodyText,
  titleText,
}: AudioZoneProps) {
  const [mode,          setMode]          = useState<AudioMode>("upload");
  const [converting,    setConverting]    = useState(false);
  const [convertPct,    setConvertPct]    = useState(0);
  const [uploadPct,     setUploadPct]     = useState(0);
  const [isUploading,   setIsUploading]   = useState(false);
  const [convertedInfo, setConvertedInfo] = useState<string | null>(null);
  const [error,         setError]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Lazy-import heavy utils (same pattern as original) ──────────────────
  const uploadFile = async (file: File) => {
    const { uploadFileWithProgress } = await import("@/lib/storage");
    const { convertToWebM, browserSupportsWebM } = await import("@/lib/utils/audioConverter");

    if (!file.type.startsWith("audio/")) {
      setError("Format tidak didukung. Gunakan MP3, WAV, OGG, atau WebM."); return;
    }
    if (file.size > 100 * 1024 * 1024) { setError("Ukuran maks 100 MB."); return; }

    setError(""); setConvertedInfo(null);
    let fileToUpload = file;

    if (file.type !== "audio/webm" && browserSupportsWebM()) {
      setConverting(true); setConvertPct(0);
      const result = await convertToWebM(file, (pct) => setConvertPct(pct));
      setConverting(false);
      if (result.converted) {
        const before = (result.sizeBefore / (1024 * 1024)).toFixed(1);
        const after  = (result.sizeAfter  / (1024 * 1024)).toFixed(1);
        setConvertedInfo(`Dikonversi ke WebM — ${before} MB → ${after} MB`);
        fileToUpload = result.file;
      }
    }

    setIsUploading(true); setUploadPct(0);
    try {
      const result = await uploadFileWithProgress("audio", fileToUpload, ({ percent }) => setUploadPct(percent));
      onUploaded(result.url);
    } catch (e: any) {
      setError(e?.message ?? "Upload gagal. Coba lagi.");
    } finally {
      setIsUploading(false); setUploadPct(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  // ─── Sudah ada audio ──────────────────────────────────────────────────────
  if (currentUrl) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
        <Music2 className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
        <div className="flex-1 min-w-0">
          <audio controls src={currentUrl} className="w-full h-8" />
          <p className="text-xs text-muted-foreground mt-1 truncate">{currentUrl}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => inputRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            title="Ganti audio (upload)"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            title="Hapus audio"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={inputRef} type="file" accept="audio/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
        />
      </div>
    );
  }

  const busy = converting || isUploading;

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border w-fit">
        <button
          onClick={() => setMode("upload")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={
            mode === "upload"
              ? { backgroundColor: "var(--brand)", color: "white" }
              : { color: "hsl(var(--muted-foreground))" }
          }
        >
          <Upload className="h-3 w-3" /> Upload
        </button>
        <button
          onClick={() => setMode("generate")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={
            mode === "generate"
              ? { background: "linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 70%, var(--gold)))", color: "white" }
              : { color: "hsl(var(--muted-foreground))" }
          }
        >
          <Sparkles className="h-3 w-3" /> Generate TTS
        </button>
      </div>

      {/* Upload panel */}
      {mode === "upload" && (
        <div>
          <div
            onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            onClick={() => !busy && inputRef.current?.click()}
            className={[
              "flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed transition-colors",
              busy ? "opacity-70 cursor-wait" : "cursor-pointer hover:bg-muted",
            ].join(" ")}
            style={{ borderColor: "var(--brand-border)" }}
          >
            {converting ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>Mengkonversi ke WebM... {convertPct}%</p>
              </>
            ) : isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>Mengupload... {uploadPct}%</p>
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-[var(--brand)] transition-all duration-200" style={{ width: `${uploadPct}%` }} />
                </div>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6" style={{ color: "var(--brand)" }} />
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-semibold" style={{ color: "var(--brand)" }}>Klik atau seret</span> file audio ke sini
                </p>
                <p className="text-xs text-muted-foreground">MP3 / WAV / OGG — otomatis dikonversi ke <strong>WebM</strong></p>
              </>
            )}
          </div>

          {convertedInfo && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> {convertedInfo}
            </div>
          )}
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

          <input
            ref={inputRef} type="file" accept="audio/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
          />
        </div>
      )}

      {/* Generate panel */}
      {mode === "generate" && (
        <GeneratePanel
          bodyText={bodyText}
          titleText={titleText}
          onGenerated={(url) => {
            onUploaded(url);
          }}
        />
      )}
    </div>
  );
}