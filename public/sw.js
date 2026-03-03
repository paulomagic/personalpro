const CACHE_VERSION = 'v22';
const CACHE_NAME = `personalpro-${CACHE_VERSION}`;
const STATIC_CACHE = `personalpro-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `personalpro-dynamic-${CACHE_VERSION}`;
const MAX_STATIC_ITEMS = 120;
const MAX_DYNAMIC_ITEMS = 80;

// Bypass cache em desenvolvimento (localhost)
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Assets estáticos para cachear imediatamente
const STATIC_ASSETS = [
    '/offline.html',
    '/hero.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json',
];

// Padrões de URL para diferentes estratégias de cache
const API_PATTERNS = ['supabase.co', '/rest/v1/', '/auth/v1/', '/functions/v1/'];
const STATIC_PATTERNS = ['.woff2', '.woff', '.ttf', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico'];

function isApiRequest(url) {
    return API_PATTERNS.some((pattern) => url.includes(pattern));
}

function isStaticAsset(url) {
    return STATIC_PATTERNS.some((pattern) => url.endsWith(pattern));
}

function isCacheableResponse(response) {
    return response && response.ok && (response.type === 'basic' || response.type === 'cors');
}

function shouldCacheApiResponse(url) {
    return !url.includes('/auth/v1/')
        && !url.includes('/rest/v1/')
        && !url.includes('/functions/v1/');
}

function shouldBypassAssetCache(request, url) {
    if (IS_DEV) {
        return url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.ts') || url.endsWith('.tsx');
    }
    return request.destination === 'script' || request.destination === 'style' || url.includes('/assets/');
}

async function enforceCacheLimit(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxItems) return;
    const excess = keys.length - maxItems;
    await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
}

async function putInCache(cacheName, request, response, maxItems) {
    if (!isCacheableResponse(response)) return;
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    await enforceCacheLimit(cacheName, maxItems);
}

async function networkOnlyAsset(request) {
    try {
        return await fetch(request, { cache: 'no-store' });
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw error;
    }
}

// Estratégia: Network First
async function networkFirst(request, options = {}) {
    const { cacheName = DYNAMIC_CACHE, cacheResponse = true, maxItems = MAX_DYNAMIC_ITEMS } = options;
    try {
        const networkResponse = await fetch(request);
        if (cacheResponse) {
            await putInCache(cacheName, request, networkResponse, maxItems);
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        throw error;
    }
}

// Estratégia: Cache First (assets estáticos)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const networkResponse = await fetch(request);
    await putInCache(STATIC_CACHE, request, networkResponse, MAX_STATIC_ITEMS);
    return networkResponse;
}

// Estratégia: Network First para navegação (evita index.html antigo após deploy)
async function networkFirstNavigation(request) {
    try {
        const networkResponse = await fetch(request, { cache: 'no-store' });
        if (isCacheableResponse(networkResponse)) {
            const contentType = networkResponse.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                await putInCache(DYNAMIC_CACHE, request, networkResponse, MAX_DYNAMIC_ITEMS);
            }
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) return offlinePage;
        throw error;
    }
}

// Install event - cache recursos estáticos
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

// Activate event - limpar caches antigos
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                    return Promise.resolve(false);
                })
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch event - aplicar estratégias de cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;

    if (request.method !== 'GET' || !url.startsWith('http')) {
        return;
    }

    event.respondWith(
        (async () => {
            try {
                if (request.mode === 'navigate') {
                    return await networkFirstNavigation(request);
                }

                if (shouldBypassAssetCache(request, url)) {
                    return await networkOnlyAsset(request);
                }

                if (isApiRequest(url)) {
                    return await networkFirst(request, {
                        cacheResponse: shouldCacheApiResponse(url),
                        cacheName: DYNAMIC_CACHE,
                        maxItems: MAX_DYNAMIC_ITEMS,
                    });
                }

                if (isStaticAsset(url)) {
                    return await cacheFirst(request);
                }

                return await networkFirst(request, {
                    cacheResponse: true,
                    cacheName: DYNAMIC_CACHE,
                    maxItems: MAX_DYNAMIC_ITEMS,
                });
            } catch (error) {
                if (request.mode === 'navigate') {
                    const offlinePage = await caches.match('/offline.html');
                    if (offlinePage) return offlinePage;
                }

                const cachedResponse = await caches.match(request);
                if (cachedResponse) return cachedResponse;
                throw error;
            }
        })()
    );
});

// Escutar mensagens do cliente (forçar atualização/limpeza)
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    if (event.data === 'clearCaches') {
        event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
    }
});
