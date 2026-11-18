/* Centipede Portal service worker - build 2026-11-18.1
 *
 * Freshness rule (hard requirement): HTML pages and ALL JavaScript - which
 * includes every assets/config.js and auth file - are NETWORK-FIRST.
 * Sign-in and access changes must take effect immediately and must never
 * be served from a stale cache.
 *
 * Cache-first is used ONLY for static CSS and image files, kept under a
 * versioned cache name. Bump STATIC_CACHE on any build that changes them.
 */
const STATIC_CACHE = 'centipede-static-v1-20261118';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isStaticAsset = /\.(?:css|png|jpe?g|gif|webp|svg|ico)$/i.test(url.pathname);

  if (isStaticAsset) {
    // Cache-first for static CSS/images only.
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  // Everything else - HTML, JS (config/auth/app), the manifest, JSON -
  // is network-first. The cache is only an offline fallback for pages.
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok && req.mode === 'navigate') {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
