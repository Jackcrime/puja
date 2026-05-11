"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Check, AlertCircle } from "lucide-react";
import {
  loadSettings, saveSettings, requestPermission,
  getPermissionStatus, scheduleWithSW, showNow,
  type NotifSettings,
} from "@/lib/notifications";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotifSettings>({ enabled: false, time: "06:00", days: [0,1,2,3,4,5,6] });
  const [permission, setPermission] = useState<string>("default");
  const [testSent, setTestSent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setPermission(getPermissionStatus());
  }, []);

  const handleToggle = async () => {
    if (!settings.enabled) {
      // Aktifkan: minta izin dulu
      const perm = await requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;
      const updated = { ...settings, enabled: true };
      setSettings(updated);
      saveSettings(updated);
      await scheduleWithSW(updated);
    } else {
      const updated = { ...settings, enabled: false };
      setSettings(updated);
      saveSettings(updated);
    }
  };

  const handleTimeChange = (time: string) => {
    const updated = { ...settings, time };
    setSettings(updated);
  };

  const handleDayToggle = (day: number) => {
    const days = settings.days.includes(day)
      ? settings.days.filter((d) => d !== day)
      : [...settings.days, day].sort();
    setSettings((s) => ({ ...s, days }));
  };

  const handleSave = async () => {
    setSaving(true);
    saveSettings(settings);
    if (settings.enabled && permission === "granted") {
      await scheduleWithSW(settings);
    }
    setTimeout(() => setSaving(false), 1500);
  };

  const handleTest = async () => {
    await showNow(
      "Puji dan Janji — Test",
      "Ini adalah notifikasi test. Pengingat harian Anda sudah aktif!",
      "/janjihidup"
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const isUnsupported = permission === "unsupported";
  const isDenied = permission === "denied";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
      <div className="p-5 space-y-5">

        {/* Header + toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-muted)" }}>
              {settings.enabled ? (
                <BellRing className="h-4 w-4" style={{ color: "var(--brand)" }} />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">Pengingat Harian</p>
              <p className="text-xs text-muted-foreground">
                {settings.enabled ? `Aktif — ${settings.time} setiap hari` : "Nonaktif"}
              </p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={handleToggle}
            disabled={isUnsupported || isDenied}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 ${settings.enabled ? "" : "bg-muted"}`}
            style={settings.enabled ? { backgroundColor: "var(--brand)" } : {}}
            aria-label="Toggle notifikasi"
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enabled ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Peringatan browser */}
        {isDenied && (
          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Notifikasi diblokir di browser. Buka pengaturan browser → Izin Notifikasi untuk mengaktifkan.</span>
          </div>
        )}
        {isUnsupported && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted px-3 py-2.5 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Browser ini tidak mendukung notifikasi. Gunakan Chrome atau Safari terbaru.</span>
          </div>
        )}

        {/* Waktu pengingat */}
        {settings.enabled && (
          <>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--gold)" }}>
                Jam Pengingat
              </label>
              <input
                type="time"
                value={settings.time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Notifikasi dikirim setiap hari pukul {settings.time} WIB
              </p>
            </div>

            {/* Hari aktif */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--gold)" }}>
                Hari Aktif
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((d, i) => {
                  const active = settings.days.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => handleDayToggle(i)}
                      className="w-10 h-10 rounded-xl text-xs font-bold transition-colors border"
                      style={active
                        ? { backgroundColor: "var(--brand)", color: "white", borderColor: "var(--brand)" }
                        : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: saving ? "#16a34a" : "var(--brand)" }}
              >
                {saving ? <><Check className="h-4 w-4" /> Tersimpan</> : "Simpan"}
              </button>
              <button
                onClick={handleTest}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
              >
                <Bell className="h-4 w-4" />
                {testSent ? "Terkirim!" : "Test Notifikasi"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
