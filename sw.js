// Minimal service worker for offline caching (v2)
const CACHE = "og-habit-cache-v2";
const FILES = ["/","/index.html","/style.css","/script.js","/manifest.json","https://cdn.jsdelivr.net/npm/chart.js"];

self.addEventListener("install", evt => {
  evt.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(u => new Request(u, {mode: 'no-cors'})))));
  self.skipWaiting();
});

self.addEventListener("activate", evt => {
  evt.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", evt => {
  if(evt.request.method !== "GET") return;
  evt.respondWith(caches.match(evt.request).then(resp => resp || fetch(evt.request).catch(()=> caches.match('/'))));
});