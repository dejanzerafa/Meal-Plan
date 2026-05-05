// Meal Plan — Service Worker
// Caches the full app for offline use. Update CACHE_NAME when deploying a new version.

const CACHE_NAME = ‘meal-plan-v1’;
const CORE = [’/’];

// ── Install: cache the app shell ────────────────────────────────────────────
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(CORE))
);
self.skipWaiting();
});

// ── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
)
);
self.clients.claim();
});

// ── Fetch: serve from cache, fall back to network, cache new responses ───────
self.addEventListener(‘fetch’, event => {
// Only handle GET requests
if (event.request.method !== ‘GET’) return;

event.respondWith(
caches.match(event.request).then(cached => {
if (cached) return cached;

```
  return fetch(event.request).then(response => {
    // Cache valid responses (not opaque / error)
    if (!response || response.status !== 200 || response.type === 'error') {
      return response;
    }
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
    return response;
  }).catch(() => {
    // Fully offline — serve the cached app shell
    return caches.match('/');
  });
})
```

);
});
