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
// SW simpan jadwal & tampilkan notif setelah delay selesai.
// Setelah notif ditampilkan, SW otomatis jadwalkan ulang untuk 24 jam kemudian
// (selama SW tidak di-kill browser). Reschedule penuh terjadi saat app dibuka.

var _scheduledTimer = null;

// Simpan config terakhir agar bisa auto-reschedule
var _lastConfig = null;

function _doShowNotif(title, body, url) {
  return self.registration.showNotification(title, {
    body:     body,
    icon:     "/gkpb-logo.png",
    badge:    "/gkpb-logo.png",
    tag:      "daily-reminder",
    renotify: false,
    data:     { url: url }
  }).catch(function(err) {
    console.warn("[SW] showNotification gagal:", err);
  });
}

function _schedule(delayMs) {
  if (_scheduledTimer !== null) {
    clearTimeout(_scheduledTimer);
    _scheduledTimer = null;
  }
  if (!_lastConfig || delayMs <= 0) return;

  var cfg = _lastConfig;
  _scheduledTimer = setTimeout(function() {
    _scheduledTimer = null;
    _doShowNotif(cfg.title, cfg.body, cfg.url);

    // Auto-reschedule besok jam yang sama (24h), selama SW masih hidup
    // Ini kasih 1 hari "gratis" meski user ga buka app
    _schedule(24 * 60 * 60 * 1000);
  }, delayMs);
}

self.addEventListener("message", function(event) {
  var msg = event.data;
  if (!msg || msg.type !== "SCHEDULE_NOTIFICATION") return;
  if (typeof msg.delayMs !== "number" || msg.delayMs <= 0) return;

  // Simpan config & jadwalkan
  _lastConfig = {
    title: msg.title || "Puji dan Janji — Saat Teduh",
    body:  msg.body  || "Renungan harian sudah tersedia. Selamat bersekutu!",
    url:   msg.url   || "/janjihidup",
  };

  _schedule(msg.delayMs);

  // Konfirmasi ke app
  if (event.source && event.source.postMessage) {
    event.source.postMessage({
      type: "SCHEDULE_NOTIFICATION_ACK",
      delayMs: msg.delayMs,
    });
  }
});
