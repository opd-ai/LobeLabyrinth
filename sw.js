/**
 * Service Worker for LobeLabyrinth
 * Provides offline functionality and improved performance through caching
 */

const CACHE_NAME = 'lobelabyrinth-v1.0.0';
const STATIC_CACHE_NAME = 'lobelabyrinth-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'lobelabyrinth-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
    '/',
    '/game.html',
    '/index.html',
    
    // CSS Files
    '/css/game.css',
    '/css/achievements.css',
    '/css/victory.css',
    '/css/test.css',
    
    // JavaScript Files
    '/src/dataLoader.js',
    '/src/gameState.js',
    '/src/quizEngine.js',
    '/src/animationManager.js',
    '/src/achievementManager.js',
    '/src/mapRenderer.js',
    '/src/uiManager.js',
    '/src/errorBoundary.js',
    
    // Data Files
    '/data/rooms.json',
    '/data/questions.json',
    '/data/achievements.json',
    
    // Manifest
    '/manifest.json'
];

// Files that change frequently - cache with network-first strategy
const DYNAMIC_ASSETS = [
    '/data/',
    '/api/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                console.log('📦 Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {
                    cache: 'reload'
                })));
            }),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Take control of all clients immediately
            self.clients.claim(),
            
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName.startsWith('lobelabyrinth-') && 
                                   cacheName !== STATIC_CACHE_NAME &&
                                   cacheName !== DYNAMIC_CACHE_NAME;
                        })
                        .map(cacheName => {
                            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
        ])
    );
});

// Fetch event - serve from cache with fallbacks
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // Handle different types of requests
    if (isStaticAsset(request.url)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isDynamicAsset(request.url)) {
        event.respondWith(handleDynamicAsset(request));
    } else if (isNavigationRequest(request)) {
        event.respondWith(handleNavigationRequest(request));
    } else {
        event.respondWith(handleOtherRequest(request));
    }
});

/**
 * Check if URL is a static asset
 * @param {string} url - Request URL
 * @returns {boolean} True if static asset
 */
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.endsWith(asset) || url.includes(asset));
}

/**
 * Check if URL is a dynamic asset
 * @param {string} url - Request URL
 * @returns {boolean} True if dynamic asset
 */
function isDynamicAsset(url) {
    return DYNAMIC_ASSETS.some(pattern => url.includes(pattern));
}

/**
 * Check if request is a navigation request
 * @param {Request} request - Request object
 * @returns {boolean} True if navigation request
 */
function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

/**
 * Handle static assets with cache-first strategy
 * @param {Request} request - Request object
 * @returns {Promise<Response>} Response from cache or network
 */
async function handleStaticAsset(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('❌ Service Worker: Static asset error:', error);
        
        // Return offline fallback for essential files
        if (request.url.includes('.html')) {
            return createOfflinePage();
        }
        
        // Return minimal response for other assets
        return new Response('Offline', { 
            status: 503, 
            statusText: 'Service Unavailable' 
        });
    }
}

/**
 * Handle dynamic assets with network-first strategy
 * @param {Request} request - Request object
 * @returns {Promise<Response>} Response from network or cache
 */
async function handleDynamicAsset(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('⚠️ Service Worker: Network failed, trying cache:', error);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return error response
        return new Response(
            JSON.stringify({ error: 'Data unavailable offline' }), 
            { 
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Handle navigation requests
 * @param {Request} request - Request object
 * @returns {Promise<Response>} Response for navigation
 */
async function handleNavigationRequest(request) {
    try {
        // Try network first for navigation
        const networkResponse = await fetch(request);
        return networkResponse;
        
    } catch (error) {
        console.warn('⚠️ Service Worker: Navigation offline, serving cached game');
        
        // Serve cached game.html for offline navigation
        const cachedGame = await caches.match('/game.html');
        if (cachedGame) {
            return cachedGame;
        }
        
        // Fallback to offline page
        return createOfflinePage();
    }
}

/**
 * Handle other requests with cache-first strategy
 * @param {Request} request - Request object
 * @returns {Promise<Response>} Response from cache or network
 */
async function handleOtherRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        return networkResponse;
        
    } catch (error) {
        console.error('❌ Service Worker: Request failed:', error);
        return new Response('Offline', { 
            status: 503, 
            statusText: 'Service Unavailable' 
        });
    }
}

/**
 * Create an offline page response
 * @returns {Response} Offline page response
 */
function createOfflinePage() {
    const offlineHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>LobeLabyrinth - Offline</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #2C1810, #8B4513);
                    color: #F5E6D3;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                }
                .offline-container {
                    background: rgba(245, 230, 211, 0.1);
                    border: 2px solid #D4AF37;
                    border-radius: 15px;
                    padding: 40px;
                    max-width: 500px;
                    margin: 20px;
                    backdrop-filter: blur(10px);
                }
                .offline-icon {
                    font-size: 4em;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #D4AF37;
                    margin-bottom: 20px;
                    font-family: 'Cinzel', serif;
                }
                p {
                    line-height: 1.6;
                    margin-bottom: 15px;
                }
                .retry-btn {
                    background: linear-gradient(135deg, #D4AF37, #B8941F);
                    color: #2C1810;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 20px 10px;
                    transition: transform 0.3s ease;
                }
                .retry-btn:hover {
                    transform: translateY(-2px);
                }
                .cache-info {
                    margin-top: 30px;
                    font-size: 0.9em;
                    color: #B8941F;
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">🏰</div>
                <h1>You're Offline</h1>
                <p>The castle gates are temporarily closed, but your adventure continues!</p>
                <p>Your game progress is safely stored and will be available when you reconnect.</p>
                
                <button class="retry-btn" onclick="window.location.reload()">
                    🔄 Try Again
                </button>
                
                <button class="retry-btn" onclick="window.location.href='/game.html'">
                    🎮 Play Cached Game
                </button>
                
                <div class="cache-info">
                    <strong>💾 Offline Mode Active</strong><br>
                    Essential game files are cached for offline play.
                </div>
            </div>
        </body>
        </html>
    `;
    
    return new Response(offlineHTML, {
        headers: { 'Content-Type': 'text/html' }
    });
}

// Handle background sync (for future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Service Worker: Background sync triggered');
        event.waitUntil(handleBackgroundSync());
    }
});

/**
 * Handle background sync operations
 */
async function handleBackgroundSync() {
    try {
        // Future: Sync game progress, achievements, etc.
        console.log('📡 Service Worker: Background sync completed');
    } catch (error) {
        console.error('❌ Service Worker: Background sync failed:', error);
    }
}

// Handle push notifications (for future enhancement)
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/manifest-icon-192.png',
            badge: '/manifest-icon-96.png',
            tag: 'lobelabyrinth-notification',
            renotify: true,
            actions: [
                {
                    action: 'play',
                    title: '🎮 Play Now'
                },
                {
                    action: 'dismiss',
                    title: '❌ Dismiss'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification('LobeLabyrinth', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'play') {
        event.waitUntil(
            clients.openWindow('/game.html')
        );
    }
});

console.log('🚀 Service Worker: Loaded successfully');