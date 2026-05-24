const CACHE_NAME = 'tasks-pwa-cache-v1';

self.addEventListener('install', (event) => {
    // Force active service worker immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Bypass service worker interception for:
    // 1. Non-GET requests
    // 2. Clerk authentication requests
    // 3. Supabase database requests
    // 4. Next.js internal RSC data requests (RSC headers or query params)
    // 5. Requests with keepalive: true (fixes a known Chrome bug where fetch(event.request) fails)
    if (
        event.request.method !== 'GET' ||
        url.includes('clerk') ||
        url.includes('supabase') ||
        url.includes('_rsc=') ||
        event.request.headers.get('rsc') ||
        event.request.keepalive
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
