self.addEventListener("install", (e) => {
  console.log("Service Worker: Installed");
  e.waitUntil(
    caches
      .open("static")
      .then((cache) =>
        cache.addAll([
          "/",
          "/index.html",
          "/manifest.json",
          "/icons/icon-192x192.png",
          "/icons/icon-512x512.png",
        ])
      )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
