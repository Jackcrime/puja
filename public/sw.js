// ─── Service Worker — Puji dan Janji GKPB ────────────────────────────────────
// Handles: scheduled daily notification via setTimeout message

const NOTIF_TAG = "pnj-harian";

// ─── Install & Activate ──────────────────────────────────────────────────────
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// ─── Timer storage (in-memory, reset on SW restart) ──────────────────────────
let scheduledTimer = null;

// ─── Message handler dari app ─────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "SCHEDULE_NOTIFICATION") return;

  const { title, body, url, delayMs } = data;

  // Batalkan jadwal lama kalau ada
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  if (!delayMs || delayMs <= 0) return;

  scheduledTimer = setTimeout(async () => {
    scheduledTimer = null;
    try {
      await self.registration.showNotification(title || "Puji dan Janji", {
        body: body || "Renungan harian sudah tersedia. Selamat bersekutu dengan Tuhan!",
        icon: "/gkpb-logo.png",
        badge: "/gkpb-logo.png",
        tag: NOTIF_TAG,
        renotify: true,
        requireInteraction: false,
        data: { url: url || "/janjihidup" },
        vibrate: [200, 100, 200],
      });
    } catch (err) {
      console.error("[SW] Gagal tampilkan notifikasi:", err);
    }
  }, delayMs);
});

// ─── Klik notifikasi → buka app ──────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/janjihidup";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Kalau app sudah terbuka, fokus ke sana
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Kalau belum terbuka, buka tab baru
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Push event (untuk future push server integration) ───────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Puji dan Janji", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Puji dan Janji", {
      body: payload.body || "",
      icon: "/gkpb-logo.png",
      badge: "/gkpb-logo.png",
      tag: NOTIF_TAG,
      data: { url: payload.url || "/janjihidup" },
      vibrate: [200, 100, 200],
    })
  );
});