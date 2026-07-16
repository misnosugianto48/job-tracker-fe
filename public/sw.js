const CACHE_NAME = 'job-tracker-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-192.png',
  '/maskable-512.png'
];

// Install Event - Precache initial files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network-first with Cache fallback for general assets, Cache-first for static icons
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass service worker for API calls
  if (requestUrl.pathname.startsWith('/api') || event.request.method !== 'GET') {
    return;
  }

  // Cache-first for images/fonts
  if (
    event.request.destination === 'image' ||
    requestUrl.pathname.endsWith('.svg') ||
    requestUrl.pathname.endsWith('.png') ||
    requestUrl.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
  } else {
    // Network-first falling back to cache
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If response is valid, clone and cache it
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, try matching from cache. Fallback to index.html for SPA routing.
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If request is document/page navigation, serve index.html (SPA fallback)
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
        })
    );
  }
});
