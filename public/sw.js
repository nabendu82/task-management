const CACHE_NAME = 'tasks-pwa-cache-v1';

self.addEventListener('install', (event) => {
    // Force active service worker immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Network-first pass-through handler to satisfy Chrome's PWA install criteria
    // without caching dynamic Clerk Auth or Supabase calls.
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
