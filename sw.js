/**
 * KeyQuest Service Worker
 * Network-first with cache fallback — fresh files when online (so updates
 * reach devices), full offline support from cache.
 */

const CACHE_NAME = 'keyquest-v14';

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
        return cache.addAll(CACHE_FILES);
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
    fetch(event.request)
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
        // Network unavailable — serve from cache, or the app shell as a fallback
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
