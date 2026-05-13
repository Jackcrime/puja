"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NotificationSettings } from "@/components/ui/NotificationSettings";
import { useFontSize } from "@/lib/hooks/useFontSize";
import { useI18n } from "@/lib/hooks/useI18n";
import { useTheme } from "next-themes";
import {
  Settings, Type, Sun, Moon, Monitor, Languages,
  Bell, Smartphone, Trash2, Check, Download,
} from "lucide-react";
import { initNotifications } from "@/lib/notifications";

export default function Pengaturan() {
  const { fontSize, setFontSize } = useFontSize();
  const { lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [cleared, setCleared] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    initNotifications();
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const handleClearData = () => {
    const keys = [
      "gkpb_bookmarks", "gkpb_font_size", "gkpb_lang",
      "gkpb_banner_v2", "gkpb_install_dismissed",
      "gkpb_notif_settings",
    ];
    keys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    setCleared(true);
    setTimeout(() => { setCleared(false); window.location.reload(); }, 1500);
  };

  const fontSizes = [
    { value: "sm", label: "Kecil", sample: "text-xs" },
    { value: "md", label: "Normal", sample: "text-sm" },
    { value: "lg", label: "Besar", sample: "text-base" },
    { value: "xl", label: "XL", sample: "text-xl" },
  ];

  const themes = [
    { value: "light", label: "Terang", icon: Sun },
    { value: "dark", label: "Gelap", icon: Moon },
    { value: "system", label: "Sistem", icon: Monitor },
  ];

  const langs = [
    { value: "id", label: "Indonesia" },
    { value: "en", label: "English" },
  ];

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-4">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-5 w-5" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Pengaturan</p>
          </div>
          <h1 className="font-serif font-bold text-2xl" style={{ color: "var(--brand)" }}>Pengaturan Aplikasi</h1>
        </div>

        {/* Notifikasi */}
        <NotificationSettings />

        {/* Tampilan */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-5">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Tampilan</p>

          {/* Tema */}
          <div>
            <p className="text-sm font-semibold mb-2">Mode Warna</p>
            <div className="flex gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setTheme(value)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors"
                  style={theme === value
                    ? { backgroundColor: "var(--brand)", color: "white", borderColor: "var(--brand)" }
                    : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Type className="h-4 w-4" style={{ color: "var(--gold)" }} />
              Ukuran Teks
            </p>
            <div className="flex gap-2">
              {fontSizes.map((f) => (
                <button key={f.value} onClick={() => setFontSize(f.value as any)}
                  className="flex-1 py-2.5 rounded-xl border text-sm transition-colors font-semibold"
                  style={fontSize === f.value
                    ? { backgroundColor: "var(--brand)", color: "white", borderColor: "var(--brand)" }
                    : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  <span className={`font-serif font-bold ${f.sample}`}>A</span>
                  <span className="block text-[10px] mt-0.5">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bahasa */}
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Languages className="h-4 w-4" style={{ color: "var(--gold)" }} />
              Bahasa
            </p>
            <div className="flex gap-2">
              {langs.map((l) => (
                <button key={l.value} onClick={() => setLang(l.value as any)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
                  style={lang === l.value
                    ? { backgroundColor: "var(--brand)", color: "white", borderColor: "var(--brand)" }
                    : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PWA Status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Aplikasi</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Status Instalasi</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isInstalled ? "Sudah terpasang di layar utama" : "Belum dipasang — tambahkan ke layar utama"}
              </p>
            </div>
            {isInstalled ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                <Check className="h-4 w-4" /> Terpasang
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--brand)" }}>
                <Download className="h-4 w-4" /> Belum
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Versi <strong>0.8 Beta</strong> · Service Worker aktif · Konten tersedia offline
            </p>
          </div>
        </div>

        {/* Reset data */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-bold tracking-widest uppercase mb-3 text-red-500">Zona Berbahaya</p>
          <p className="text-sm text-muted-foreground mb-4">
            Hapus semua preferensi tersimpan (bookmark, ukuran teks, bahasa, pengingat). Data renungan tidak terpengaruh.
          </p>
          <button onClick={handleClearData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: cleared ? "#16a34a" : "#dc2626" }}
          >
            {cleared ? <><Check className="h-4 w-4" /> Berhasil dihapus</> : <><Trash2 className="h-4 w-4" /> Hapus Data Preferensi</>}
          </button>
        </div>

      </div>
    </AppLayout>
  );
}
