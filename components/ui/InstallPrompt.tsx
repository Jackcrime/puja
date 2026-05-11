"use client";

import React, { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Sudah pernah di-dismiss?
    const dismissed = localStorage.getItem("gkpb_install_dismissed");
    if (dismissed) return;

    // Sudah diinstall sebagai standalone?
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // iOS Safari — tidak support beforeinstallprompt, tampilkan panduan manual
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) {
      setIsIOS(true);
      setTimeout(() => setVisible(true), 5000);
      return;
    }

    // Android / Chrome / Edge — gunakan beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 5000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("gkpb_install_dismissed", "1");
  };

  if (!visible || isInstalled) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 no-print">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: "var(--brand)" }}>
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Pasang di layar utama</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Ketuk ikon <strong>Bagikan</strong> di Safari, lalu pilih <strong>&ldquo;Tambahkan ke Layar Utama&rdquo;</strong>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Akses tanpa internet, langsung dari layar utama HP
            </p>
          )}
          {!isIOS && (
            <button onClick={handleInstall}
              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--brand)" }}
            >
              <Download className="h-3.5 w-3.5" />
              Pasang Sekarang
            </button>
          )}
        </div>
        <button onClick={handleDismiss}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
