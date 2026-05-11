// ─── Notification helpers ────────────────────────────────────────────────────
// Tidak butuh backend. Semua berjalan via browser Notification API + SW.

export type NotifPermission = "granted" | "denied" | "default" | "unsupported";

export interface NotifSettings {
  enabled: boolean;
  time: string;        // "HH:MM" — waktu pengingat harian, contoh "06:00"
  days: number[];      // 0–6, Minggu=0 — hari aktif. default semua hari
}

const STORAGE_KEY = "gkpb_notif_settings";

const DEFAULT_SETTINGS: NotifSettings = {
  enabled: false,
  time: "06:00",
  days: [0, 1, 2, 3, 4, 5, 6],
};

// ─── Permission ──────────────────────────────────────────────────────────────
export function getPermissionStatus(): NotifPermission {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as NotifPermission;
}

export async function requestPermission(): Promise<NotifPermission> {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

// ─── Settings ────────────────────────────────────────────────────────────────
export function loadSettings(): NotifSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: NotifSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

// ─── Scheduling ──────────────────────────────────────────────────────────────
/**
 * Hitung milidetik sampai jam HH:MM berikutnya.
 * Kalau sudah lewat hari ini, jadwalkan besok.
 */
export function msUntilTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

/**
 * Kirim pesan ke service worker untuk menjadwalkan notifikasi.
 * SW akan menampilkan notifikasi setelah delayMs milidetik.
 */
export async function scheduleWithSW(settings: NotifSettings): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const today = new Date().getDay();
  if (!settings.days.includes(today)) return; // bukan hari aktif

  const reg = await navigator.serviceWorker.ready;
  const delayMs = msUntilTime(settings.time);

  reg.active?.postMessage({
    type: "SCHEDULE_NOTIFICATION",
    title: "Puji dan Janji — Saat Teduh",
    body: "Renungan harian sudah tersedia. Selamat bersekutu dengan Tuhan!",
    url: "/janjihidup",
    delayMs,
  });
}

/**
 * Tampilkan notifikasi langsung (untuk test atau trigger manual).
 */
export async function showNow(title: string, body: string, url = "/"): Promise<void> {
  if (getPermissionStatus() !== "granted") return;
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(title, {
    body,
    icon: "/gkpb-logo.png",
    badge: "/gkpb-logo.png",
    tag: "manual",
    data: { url },
  });
}

/**
 * Init saat app dibuka: re-jadwalkan notif harian kalau aktif.
 */
export async function initNotifications(): Promise<void> {
  const settings = loadSettings();
  if (!settings.enabled) return;
  if (getPermissionStatus() !== "granted") return;
  await scheduleWithSW(settings);
}
