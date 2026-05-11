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

self.addEventListener("message", function(event) {
  var msg = event.data;
  if (!msg || msg.type !== "SCHEDULE_NOTIFICATION") return;
  if (typeof msg.delayMs !== "number" || msg.delayMs <= 0) return;
  setTimeout(function() {
    self.registration.showNotification(msg.title || "Puji dan Janji — Saat Teduh", {
      body: msg.body || "Renungan harian sudah tersedia. Selamat bersekutu!",
      icon: "/gkpb-logo.png",
      badge: "/gkpb-logo.png",
      tag: "daily-reminder",
      data: { url: msg.url || "/janjihidup" }
    }).catch(function(){});
  }, msg.delayMs);
});
