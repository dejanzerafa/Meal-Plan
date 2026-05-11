// SoulGainz — Service Worker v70
// Caches app shell + icons so updates propagate to all installed PWAs

const CACHE_NAME = 'meal-plan-v97';

// App shell + manifest + icons — all versioned via CACHE_NAME
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-stacked.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-180.png',
  '/icon-167.png',
  '/icon-152.png',
  '/icon-120.png',
  '/icon-96.png',
  '/icon-72.png',
  '/icon-48.png',
  '/icon-32.png',
];

// ── Install: precache app shell ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(PRECACHE.map(url => cache.add(url)));
    })
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for app shell, pass-through for everything else ─────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isApp = url.hostname === self.location.hostname;

  // Only intercept same-origin app files — never touch CDN scripts
  if (!isApp) return;

  // Icons and manifest — cache-first (already forced fresh via PRECACHE versioning)
  const isAsset = /\.(png|svg|json|webp|ico)$/.test(url.pathname);

  // App resources: network-first, fall back to cache
  // Icons/assets fall back to cache only (not index.html)
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || (isAsset ? new Response('', { status: 404 }) : caches.match('/index.html'))
        )
      )
  );
});

// ── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'SoulGainz';
  const options = {
    body: data.body || "Time to meal prep! 🍗",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'soulgainz-reminder',
    renotify: true,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
