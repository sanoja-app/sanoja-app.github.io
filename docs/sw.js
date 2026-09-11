// Minimal offline shell for the flashcards PWA. Caches the app's own static
// files so the page opens without a network connection; word data itself is
// fetched fresh (and cached separately in localStorage by flashcards.js), so
// it's never served from here.
const CACHE = "sanoja-flashcards-v1";
const SHELL = ["flashcards.html", "flashcards.js", "flashcards.webmanifest", "assets/icon128.png"];

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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return; // never intercept the sync API call
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
