// Standard Service Worker for Hotel Training PMS PWA Offline Cache Support
const CACHE_NAME = "pms-training-cache-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event with Network-First fallback to Cache
self.addEventListener("fetch", (e) => {
  // Only handle HTTP/HTTPS requests (avoid chrome-extension issues)
  if (!e.request.url.startsWith("http")) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If valid response, clone and cache it
        if (response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fail, load from cache
        return caches.match(e.request);
      })
  );
});
