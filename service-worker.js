/* =====================================================================
   The Quiet Few Collective — service worker
   Strategy:
     • Precache the app shell on install (offline-ready from first visit).
     • Navigations  -> network-first, fall back to cached shell offline.
     • Static assets -> cache-first, revalidate in the background.
   Bump CACHE_VERSION whenever you change cached files to ship an update.
   ===================================================================== */
const CACHE_VERSION = "v2-request-studio";
const CACHE_NAME = `quiet-few-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",\n  "./request.html",\n  "./request.css",\n  "./request.js",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/quiet-few-emblem.png",
  "./assets/quiet-few-wordmark-icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/favicon-32.png"
];

// Install: precache the shell, then take over immediately.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop old caches and claim open clients.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GETs; let everything else hit the network.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Navigations: network-first so users get fresh HTML, offline gets the shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // Static assets: cache-first, refresh the cache in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
