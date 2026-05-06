// Meal Plan — Service Worker v3
// Full offline support: caches app shell + CDN resources on first load

const CACHE_NAME = 'meal-plan-v4';

// App shell — cached immediately on install
const PRECACHE = [
  '/',
  '/index.html',
  '/sw.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// CDN resources — cached on first network fetch
const CDN_HOSTS = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// ── Install: precache app shell ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache what we can — ignore individual failures so install always succeeds
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

// ── Fetch: cache-first for CDN, network-first for app shell ─────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isCDN = CDN_HOSTS.some(h => url.hostname.includes(h));
  const isApp = url.hostname === self.location.hostname;

  if (isCDN) {
    // CDN resources: cache-first (they're versioned, safe to cache long-term)
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        }).catch(() => cached || new Response('', { status: 503 }));
      })
    );
    return;
  }

  if (isApp) {
    // App resources: network-first, fall back to cache
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
          // Offline — serve cached version or index.html as fallback
          caches.match(event.request).then(cached =>
            cached || caches.match('/') || caches.match('/index.html')
          )
        )
    );
    return;
  }

  // Everything else: network only
  event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
});  self.clients.claim();
});

// ── Fetch: cache-first for CDN, network-first for app shell ─────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isCDN = CDN_HOSTS.some(h => url.hostname.includes(h));
  const isApp = url.hostname === self.location.hostname;

  if (isCDN) {
    // CDN resources: cache-first (they're versioned, safe to cache long-term)
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        }).catch(() => cached || new Response('', { status: 503 }));
      })
    );
    return;
  }

  if (isApp) {
    // App resources: network-first, fall back to cache
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
          // Offline — serve cached version or index.html as fallback
          caches.match(event.request).then(cached =>
            cached || caches.match('/') || caches.match('/index.html')
          )
        )
    );
    return;
  }

  // Everything else: network only
  event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
});  self.clients.claim();
});

// ── Fetch: cache-first for CDN, network-first for app shell ─────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isCDN = CDN_HOSTS.some(h => url.hostname.includes(h));
  const isApp = url.hostname === self.location.hostname;

  if (isCDN) {
    // CDN resources: cache-first (they're versioned, safe to cache long-term)
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        }).catch(() => cached || new Response('', { status: 503 }));
      })
    );
    return;
  }

  if (isApp) {
    // App resources: network-first, fall back to cache
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
          // Offline — serve cached version or index.html as fallback
          caches.match(event.request).then(cached =>
            cached || caches.match('/') || caches.match('/index.html')
          )
        )
    );
    return;
  }

  // Everything else: network only
  event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
});    if (!response || response.status !== 200 || response.type === 'error') {
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
