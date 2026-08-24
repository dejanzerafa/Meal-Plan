// SoulGainz — Service Worker v220
// Caches app shell + icons so updates propagate to all installed PWAs

const CACHE_NAME = 'meal-plan-v220';

// App shell + manifest + icons — all versioned via CACHE_NAME
const PRECACHE = [
  '/index.html',
  '/manifest.json',
  '/icon-stacked.svg',
  '/icon-512.png',
  '/icon-384.png',
  '/icon-256.png',
  '/icon-192.png',
  '/icon-180.png',
  '/icon-167.png',
  '/icon-152.png',
  '/icon-144.png',
  '/icon-128.png',
  '/icon-120.png',
  '/icon-96.png',
  '/icon-72.png',
  '/icon-48.png',
  '/icon-32.png',
  '/vendor/react.min.js',
  '/vendor/react-dom.min.js',
  '/vendor/supabase.min.js',
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..900,0..100;1,9..144,300..900,0..100&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap',
  '/offline.html',
  '/landing.html',
  '/waitlist',
  '/waitlist.html',
  '/recipes-preview.html',
  '/install.html',
  '/success.html',
];

// ── Install: precache app shell ──────────────────────────────────────────────
// NOTE: deliberately NO self.skipWaiting() here.
//
// It used to activate immediately on install, which meant every deploy
// hard-reloaded anyone with the app open — mid-recipe, mid-feedback, mid-form —
// via the `controllerchange` handler in index.html. To a user that is
// indistinguishable from a crash, and it silently lost whatever they were
// typing. It also meant registration.waiting was almost never populated, so the
// "Update available — tap to refresh" banner rarely appeared and the polite
// update path was effectively dead code.
//
// Updates now queue in `waiting` until the user taps the banner, which posts
// SKIP_WAITING (handled below) and only then triggers the reload.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(PRECACHE.map(url => cache.add(url)));
    })
  );
});

// ── Activate: wipe old caches and claim clients ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for assets, network-first for app shell ───────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isApp = url.hostname === self.location.hostname;
  // For external requests (Google Fonts etc.) — serve from cache when offline, else network
  if (!isApp) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  const isAsset = /\.(png|svg|json|webp|ico|woff2?|ttf|js)$/.test(url.pathname);
  const isNavigation = event.request.mode === 'navigate';

  // Cache-first: static assets + vendor JS (React)
  if (isAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // Network-first: app shell + navigation
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(async () => {
        // Always return a valid Response — never let respondWith resolve to null/undefined
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (isNavigation) {
          // Serve the app shell first — works for any URL (Instagram links, shared pages, etc.)
          // Only fall back to offline.html if even the app shell isn't cached
          const index = await caches.match('/index.html');
          if (index) return index;
          const offline = await caches.match('/offline.html');
          if (offline) return offline;
        }
        return new Response('Offline — please reload when connected.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

// ── Message handler ──────────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || 'SoulGainz';
    const options = {
      body: event.data.body || 'Time to meal prep! 🍗',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'soulgainz-reminder',
      renotify: true,
      data: { url: '/' },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// ── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) { console.warn('SW push: invalid JSON payload', e); }
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
