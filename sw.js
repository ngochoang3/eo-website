/*! EO Studio / eo.io.vn — Service Worker (offline fallback + static asset caching) */
const CACHE_VERSION = "eo-v2";
const OFFLINE_URL = "offline.html";
const PRECACHE = [
  "/", "index.html", "offline.html",
  "games.html", "apps.html", "universe.html", "about.html",
  "assets/css/main.css", "assets/css/responsive.css",
  "assets/js/config.js", "assets/js/i18n.js", "assets/js/slider.js", "assets/js/main.js",
  "image/logo.png", "image/icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && (req.url.includes("/assets/") || req.url.includes("/image/"))) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
