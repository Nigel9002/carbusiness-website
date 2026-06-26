// ================================================================
// MOTO KENYA - Service Worker for PWA
// ================================================================

const CACHE_NAME = 'motokenya-v1';
const urlsToCache = [
    // Root
    '/',
    '/index.html',
    '/admin.html',
    '/admin-management.html',
    '/manifest.json',
    '/sw.js',
    
    // CSS
    '/css/style.css',
    
    // JS
    '/js/main.js',
    '/js/firebase-config.js',
    '/js/vehicles.js',
    
    // Pages
    '/pages/about.html',
    '/pages/blog.html',
    '/pages/contact.html',
    '/pages/faq.html',
    '/pages/finance.html',
    '/pages/privacy.html',
    '/pages/terms.html',
    '/pages/testimonials.html',
    '/pages/trade-in.html',
    
    // Images - Add your actual icon paths
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png'
];

// ================================================================
// INSTALL EVENT
// ================================================================
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Cache opened');
                return cache.addAll(urlsToCache)
                    .catch(err => {
                        console.warn('⚠️ Some resources failed to cache:', err);
                    });
            })
            .then(() => {
                console.log('✅ Service Worker installed');
                return self.skipWaiting();
            })
    );
});

// ================================================================
// ACTIVATE EVENT
// ================================================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('✅ Service Worker activated');
            return self.clients.claim();
        })
    );
});

// ================================================================
// FETCH EVENT - Network First with Cache Fallback
// ================================================================
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone the response for caching
                const responseToCache = response.clone();
                
                // Cache the fetched response
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    })
                    .catch(err => {
                        console.warn('⚠️ Cache put failed:', err);
                    });
                
                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // If not in cache, return a fallback response
                        return new Response('Offline - Content not available', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// ================================================================
// MESSAGE EVENT - For communication with the main thread
// ================================================================
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

console.log('🚗 MOTO KENYA Service Worker loaded');