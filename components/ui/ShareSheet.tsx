"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Link2, Copy, Check, X, Share2,
} from "lucide-react";
import type { SharePayload } from "@/lib/utils/share";
import {
  shareToWhatsApp,
  shareToTelegram,
  shareToTwitter,
  shareToFacebook,
  shareToLine,
  copyText,
  copyLink,
  nativeShare,
} from "@/lib/utils/share";

// ─── Platform definitions ─────────────────────────────────────────────────────

const PLATFORMS = [
  {
    key:   "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    bg:    "#E8FFF0",
    darkBg:"#0d2b1a",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    ),
    action: shareToWhatsApp,
  },
  {
    key:   "telegram",
    label: "Telegram",
    color: "#229ED9",
    bg:    "#E8F6FF",
    darkBg:"#0a1f2e",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    action: shareToTelegram,
  },
  {
    key:   "twitter",
    label: "X / Twitter",
    color: "#000000",
    bg:    "#F0F0F0",
    darkBg:"#1a1a1a",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.745l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    action: shareToTwitter,
  },
  {
    key:   "facebook",
    label: "Facebook",
    color: "#1877F2",
    bg:    "#E8EFFF",
    darkBg:"#0d1a3a",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    action: shareToFacebook,
  },
  {
    key:   "line",
    label: "Line",
    color: "#06C755",
    bg:    "#E8FFF2",
    darkBg:"#0a2b1a",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
      </svg>
    ),
    action: shareToLine,
  },
] as const;

// ─── ShareSheet Component ─────────────────────────────────────────────────────

interface ShareSheetProps {
  payload:      SharePayload;
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareSheet({ payload, open, onOpenChange }: ShareSheetProps) {
  const [copied,    setCopied]    = useState<"text" | "link" | null>(null);
  const [hasNative, setHasNative] = useState(false);
  const [shared,    setShared]    = useState(false);

  useEffect(() => {
    setHasNative(!!navigator.share);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleCopyText = useCallback(async () => {
    await copyText(payload).catch(() => {});
    setCopied("text");
    setTimeout(() => setCopied(null), 2000);
  }, [payload]);

  const handleCopyLink = useCallback(async () => {
    await copyLink(payload).catch(() => {});
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
  }, [payload]);

  const handleNativeShare = useCallback(async () => {
    const ok = await nativeShare(payload);
    if (!ok) {
      // fallback ke copy link kalau native share gagal
      await copyLink(payload).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [payload]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col rounded-t-2xl bg-background shadow-2xl"
        style={{
          maxHeight: "85dvh",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
          animation: "slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">Bagikan ke...</p>
            {payload.title && (
              <p className="text-xs text-muted-foreground mt-0.5 max-w-[260px] truncate">
                {payload.title}
              </p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 -mr-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-5 shrink-0" />

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Platform grid */}
          <div className="px-5 pt-5 pb-2">
            <div className="grid grid-cols-5 gap-3">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => { p.action(payload); onOpenChange(false); }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-90 group-hover:scale-105"
                    style={{ backgroundColor: p.bg, color: p.color }}
                  >
                    {p.icon}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-5 my-4 shrink-0" />

          {/* Utility actions */}
          <div className="px-5 pb-2 flex flex-col gap-1">

            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              {copied === "text"
                ? <Check className="h-5 w-5 text-green-600 shrink-0" />
                : <Copy  className="h-5 w-5 text-muted-foreground shrink-0" />}
              <div>
                <p className="text-sm font-medium">
                  {copied === "text" ? "Tersalin!" : "Salin Teks"}
                </p>
                <p className="text-xs text-muted-foreground">Teks lengkap tanpa link</p>
              </div>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              {copied === "link"
                ? <Check className="h-5 w-5 text-green-600 shrink-0" />
                : <Link2 className="h-5 w-5 text-muted-foreground shrink-0" />}
              <div>
                <p className="text-sm font-medium">
                  {copied === "link" ? "Link tersalin!" : "Salin Link"}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                  {payload.url}
                </p>
              </div>
            </button>

            {/* Native Share — hanya kalau didukung (PWA/mobile) */}
            {hasNative && (
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
              >
                {shared
                  ? <Check  className="h-5 w-5 text-green-600 shrink-0" />
                  : <Share2 className="h-5 w-5 text-muted-foreground shrink-0" />}
                <div>
                  <p className="text-sm font-medium">
                    {shared ? "Dibagikan!" : "Lebih banyak..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Buka menu share sistem
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Trigger button wrapper (opsional, convenience) ───────────────────────────

interface ShareButtonProps {
  payload:   SharePayload;
  className?: string;
  children?:  React.ReactNode;
  title?:     string;
}

export function ShareButton({ payload, className, children, title }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className}
        title={title ?? "Bagikan"}
      >
        {children ?? <Share2 className="h-4 w-4" />}
      </button>
      <ShareSheet payload={payload} open={open} onOpenChange={setOpen} />
    </>
  );
}