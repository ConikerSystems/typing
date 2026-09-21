/**
 * KeyQuest Service Worker
 * Network-first with cache fallback — fresh files when online (so updates
 * reach devices), full offline support from cache.
 */

const CACHE_NAME = 'keyquest-v16';

// All files to cache for offline use.
// Relative paths (./) so the app works from any folder — e.g. GitHub Pages
// project sites served at username.github.io/typing/ — not just the domain root.
const CACHE_FILES = [
  './',
  './index.html',
  './about.html',
  './keyquest-about.pdf',
  './manifest.json',
  './css/app.css',
  './js/version.js',
  './js/app.js',
  './js/lessons.js',
  './js/keyboard.js',
  './js/game.js',
  './js/feedback.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// ----- Install: cache all app files -----
self.addEventListener('install', (event) => {
  console.log('[SW] Installing KeyQuest service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app files');
        // cache:'reload' bypasses the HTTP cache so the precache is truly current
        return cache.addAll(CACHE_FILES.map(function (u) { return new Request(u, { cache: 'reload' }); }));
      })
      .then(() => {
        console.log('[SW] All files cached successfully');
        // Force immediate activation without waiting for old SW to die
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Cache install failed:', err);
      })
  );
});

// ----- Activate: clean up old caches -----
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating KeyQuest service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// ----- Fetch: network-first, fall back to cache -----
// Online: serve the freshest files (so app updates reach devices) and refresh
// the cache. Offline: serve the cached copy, falling back to the app shell.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // cache:'no-store' makes network-first REALLY network-first: a plain fetch()
    // can be answered by the HTTP cache with a stale file, which we would then
    // re-save into our cache — locking an old version in (learned on iOS).
    fetch(event.request, { cache: 'no-store' })
      .then((networkResponse) => {
        // Cache a fresh copy of valid same-origin responses for offline use
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network unavailable — serve from cache.
        // ignoreSearch matters: index.html asks for 'js/app.js?v=1.3.2' but the
        // precache holds './js/app.js'. An exact match misses on the '?v=' and
        // the old app-shell fallback then answered a <script> tag with HTML —
        // which loaded a styleless, dead app on the first offline launch.
        return caches.match(event.request, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          // Only a page navigation may fall back to the app shell. Handing
          // index.html to a script or stylesheet request is worse than failing.
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        });
      })
  );
});
