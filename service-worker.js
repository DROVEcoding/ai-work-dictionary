const CACHE_NAME = "ai-work-dictionary-v7";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./scripts/app.js",
  "./scripts/auth.js",
  "./scripts/cloudSync.js",
  "./scripts/data.js",
  "./scripts/filters.js",
  "./scripts/render.js",
  "./scripts/storage.js",
  "./scripts/supabaseClient.js",
  "./scripts/supabaseConfig.js",
  "./scripts/termActions.js",
  "./icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  // 离线优先：先用缓存，在线时再尝试网络更新。
  event.respondWith(
    caches.match(event.request).then((cached) => (
      cached || fetch(event.request)
    ))
  );
});
