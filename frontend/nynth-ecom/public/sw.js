const CACHE_NAME = 'nynth-cache-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // CRITICAL FIX: Bypass Service Worker entirely for Firebase, Firestore, Cloudinary, and external APIs
    // Firestore uses long-polling/WebSockets that SW cannot intercept safely without simulating offline disconnects.
    if (
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('firebaseio.com') ||
        url.hostname.includes('cloudfunctions.net') ||
        url.hostname.includes('cloudinary.com') ||
        url.pathname.startsWith('/__/')
    ) {
        return; // Early return delegates request natively back to the browser.
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) return response;
            return fetch(event.request).catch(error => {
                console.error('Fetch failed for:', event.request.url, error);
                return new Response('Offline Content', { status: 503, statusText: 'Service Unavailable' });
            });
        })
    );
});
