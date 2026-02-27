const CACHE_NAME = 'artisan-dashboard-v24';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/urssaf.js',
    '/js/factures.js',
    '/js/signature.js',
    '/js/migration.js',
    '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache ouvert');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.log('Erreur lors de la mise en cache:', error);
            })
    );
    // Activer immédiatement
    self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Prendre le contrôle de toutes les pages
    self.clients.claim();
});

// Interception des requêtes (Network First, fallback to Cache)
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non-GET et les requêtes Firebase
    if (event.request.method !== 'GET' ||
        event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('firebase')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la requête réussit, mettre à jour le cache
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // Si la requête échoue, essayer le cache
                return caches.match(event.request);
            })
    );
});
