const CACHE_NAME = 'kp-react-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/main.tsx',
    '/src/App.tsx',
    '/src/index.css',
    'https://i.postimg.cc/6pw4D0fF/kp-logo.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        ))
    );
});

self.addEventListener('fetch', e => {
    // Cache-First for assets, Network-First for others
    if (ASSETS.some(a => e.request.url.includes(a)) || e.request.mode === 'navigate') {
        e.respondWith(
            caches.match(e.request).then(res => res || fetch(e.request))
        );
    }
});
