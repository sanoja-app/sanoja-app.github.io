// Offline shell for the flashcards PWA. Caches the app's own static files so the
// page opens without a network connection; word data itself is fetched fresh (and
// cached separately in localStorage by flashcards.js), so it's never served from here.
//
// Network-first: when online, always take the latest files (and refresh the cache
// with them); only fall back to the cache when the network fails. The earlier
// cache-first version never re-checked the server, so a phone that had installed
// the page kept running the old flashcards.js/html forever after a deploy.
// Bump CACHE only to purge old entries; updates no longer depend on it.
const CACHE = "sanoja-flashcards-v3";
const SHELL = [
  "flashcards.html",
  "flashcards.js",
  "flashcards.webmanifest",
  "assets/icon128.png",
  "assets/icon192.png",
  "assets/icon512.png",
  "assets/icon-maskable-512.png",
  "assets/apple-touch-icon.png",
];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

function fetchWithTimeout(request) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("network timeout")), NETWORK_TIMEOUT_MS);
    fetch(request).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET") return;
  if (url.origin !== location.origin) return; // never intercept the sync API call

  event.respondWith(
    fetchWithTimeout(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      })
      .catch(() =>
        // ignoreSearch so "flashcards.html?sync=<id>" still finds the cached shell offline.
        caches.match(request, { ignoreSearch: true }).then((cached) => cached || Promise.reject(new Error("offline and not cached")))
      )
  );
});
