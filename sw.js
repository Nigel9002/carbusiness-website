// ================================================================
// MOTO KENYA - Service Worker for PWA
// ================================================================

const CACHE_NAME = 'motokenya-v2';
const urlsToCache = [
    // Root
    '/',
    '/index.html',
    '/admin.html',
    '/manifest.json',
    '/sw.js',
    
    // CSS
    '/css/style.css',
    '/css/admin.css',
    '/css/dark-mode.css',
    
    // JS - Core
    '/js/main.js',
    '/js/firebase-config.js',
    '/js/vehicles.js',
    
    // JS - Admin & Features
    '/js/admin.js',
    '/js/wishlist.js',
    '/js/compare.js',
    
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
    '/pages/admin-management.html',
    '/pages/vehicle-detail.html',
    
    // Images - Core icons (will be generated if missing)
    '/images/icons/icon-72x72.png',
    '/images/icons/icon-96x96.png',
    '/images/icons/icon-128x128.png',
    '/images/icons/icon-144x144.png',
    '/images/icons/icon-152x152.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-384x384.png',
    '/images/icons/icon-512x512.png',
    
    // CDN Resources (optional but good to cache)
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
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
                        // Continue even if some fail - offline still works for cached items
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
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip cross-origin requests (except fonts and CDN)
    if (url.origin !== self.location.origin && 
        !url.href.includes('fonts.googleapis.com') &&
        !url.href.includes('cdnjs.cloudflare.com')) {
        return;
    }
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip Firebase and ImageKit API requests
    if (url.pathname.includes('/imagekit-auth') ||
        url.pathname.includes('/setAdminRole') ||
        url.pathname.includes('/getUserRole') ||
        url.pathname.includes('/health') ||
        url.pathname.includes('/api/')) {
        return;
    }
    
    event.respondWith(
        fetch(request)
            .then(response => {
                // Clone the response for caching
                const responseToCache = response.clone();
                
                // Cache the fetched response (only if successful)
                if (response.status === 200) {
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, responseToCache);
                        })
                        .catch(err => {
                            console.warn('⚠️ Cache put failed:', err);
                        });
                }
                
                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // If HTML page not in cache, return offline fallback
                        if (request.headers.get('Accept').includes('text/html')) {
                            return caches.match('/index.html')
                                .then(fallback => {
                                    if (fallback) return fallback;
                                    return new Response(`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <title>MOTO KENYA - Offline</title>
                                            <style>
                                                body { 
                                                    font-family: Arial, sans-serif; 
                                                    text-align: center; 
                                                    padding: 50px; 
                                                    background: #f5f5f5;
                                                }
                                                .container { 
                                                    max-width: 400px; 
                                                    margin: 0 auto; 
                                                    background: white; 
                                                    padding: 40px; 
                                                    border-radius: 12px;
                                                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                                }
                                                h1 { color: #0056b3; }
                                                .icon { font-size: 48px; }
                                                .btn {
                                                    display: inline-block;
                                                    padding: 12px 24px;
                                                    background: #0056b3;
                                                    color: white;
                                                    text-decoration: none;
                                                    border-radius: 6px;
                                                    margin-top: 20px;
                                                }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="container">
                                                <div class="icon">🚗</div>
                                                <h1>MOTO KENYA</h1>
                                                <p>You are currently offline.</p>
                                                <p style="color: #666; font-size: 14px;">
                                                    Please check your internet connection.
                                                </p>
                                                <a href="/" class="btn">Try Again</a>
                                            </div>
                                        </body>
                                        </html>
                                    `, {
                                        headers: { 'Content-Type': 'text/html' },
                                        status: 503
                                    });
                                });
                        }
                        
                        // Return generic offline response for other resources
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

console.log('🚗 MOTO KENYA Service Worker loaded (v2)');