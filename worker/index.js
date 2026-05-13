// Custom service worker extension — merged into main SW by @ducanh2912/next-pwa

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/janjihidup";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(url) !== -1 && "focus" in list[i]) {
          return list[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener("push", function(event) {
  if (!event.data) return;
  try {
    var data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || "Puji dan Janji", {
        body: data.body || "Renungan harian sudah tersedia.",
        icon: "/gkpb-logo.png",
        badge: "/gkpb-logo.png",
        tag: data.tag || "push",
        data: { url: data.url || "/janjihidup" }
      })
    );
  } catch(e) {}
});

// ─── Scheduled notification via message dari app ────────────────────────────
// Pola: app kirim SCHEDULE_NOTIFICATION dengan delayMs
// SW simpan jadwal & tampilkan notif setelah delay selesai
var _scheduledTimer = null;

self.addEventListener("message", function(event) {
  var msg = event.data;
  if (!msg || msg.type !== "SCHEDULE_NOTIFICATION") return;
  if (typeof msg.delayMs !== "number" || msg.delayMs <= 0) return;

  // Batalkan timer lama jika ada re-schedule
  if (_scheduledTimer !== null) {
    clearTimeout(_scheduledTimer);
    _scheduledTimer = null;
  }

  var title = msg.title || "Puji dan Janji — Saat Teduh";
  var body  = msg.body  || "Renungan harian sudah tersedia. Selamat bersekutu!";
  var url   = msg.url   || "/janjihidup";

  _scheduledTimer = setTimeout(function() {
    _scheduledTimer = null;
    self.registration.showNotification(title, {
      body:  body,
      icon:  "/gkpb-logo.png",
      badge: "/gkpb-logo.png",
      tag:   "daily-reminder",
      renotify: false,
      data:  { url: url }
    }).catch(function(err) {
      console.warn("[SW] showNotification gagal:", err);
    });
  }, msg.delayMs);

  // Konfirmasi ke app bahwa jadwal diterima
  if (event.source && event.source.postMessage) {
    event.source.postMessage({ type: "SCHEDULE_NOTIFICATION_ACK", delayMs: msg.delayMs });
  }
});
