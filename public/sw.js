const CACHE_VERSION = 'v24';
const STATIC_CACHE = `personalpro-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `personalpro-runtime-${CACHE_VERSION}`;
const API_CACHE = `personalpro-api-${CACHE_VERSION}`;
const MAX_STATIC_ITEMS = 180;
const MAX_RUNTIME_ITEMS = 120;
const MAX_API_ITEMS = 60;
const NETWORK_TIMEOUT_MS = 4000;

const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

const STATIC_ASSETS = [
    '/offline.html',
    '/hero.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json',
];

const API_PATTERNS = ['supabase.co', '/rest/v1/', '/auth/v1/', '/functions/v1/'];
const STATIC_PATTERNS = ['.woff2', '.woff', '.ttf', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.css', '.js'];

function isApiRequest(url) {
    return API_PATTERNS.some((pattern) => url.includes(pattern));
}

function isStaticAsset(url) {
    return STATIC_PATTERNS.some((pattern) => url.includes(pattern));
}

function isCacheableResponse(response) {
    return response && response.ok && (response.type === 'basic' || response.type === 'cors');
}

function shouldCacheApiResponse(url) {
    return !url.includes('/auth/v1/') && !url.includes('/functions/v1/');
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

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('network-timeout')), timeoutMs);
        })
    ]);
}

async function staleWhileRevalidate(request, cacheName = STATIC_CACHE, maxItems = MAX_STATIC_ITEMS) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const networkUpdate = fetch(request)
        .then(async (response) => {
            await putInCache(cacheName, request, response, maxItems);
            return response;
        })
        .catch(() => null);

    if (cached) {
        void networkUpdate;
        return cached;
    }

    const networkResponse = await networkUpdate;
    if (networkResponse) return networkResponse;
    throw new Error('offline-and-not-cached');
}

async function networkFirst(request, options = {}) {
    const {
        cacheName = RUNTIME_CACHE,
        cacheResponse = true,
        maxItems = MAX_RUNTIME_ITEMS,
        timeoutMs = NETWORK_TIMEOUT_MS
    } = options;

    try {
        const networkResponse = await withTimeout(fetch(request), timeoutMs);
        if (cacheResponse) {
            await putInCache(cacheName, request, networkResponse, maxItems);
        }
        return networkResponse;
    } catch (_error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw _error;
    }
}

async function networkFirstNavigation(request) {
    try {
        const response = await withTimeout(fetch(request, { cache: 'no-store' }), NETWORK_TIMEOUT_MS);
        const contentType = response.headers.get('content-type') || '';
        if (isCacheableResponse(response) && contentType.includes('text/html')) {
            await putInCache(RUNTIME_CACHE, request, response, MAX_RUNTIME_ITEMS);
        }
        return response;
    } catch (_error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) return offlinePage;
        throw _error;
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames.map((cacheName) => {
                    if (![STATIC_CACHE, RUNTIME_CACHE, API_CACHE].includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                    return Promise.resolve(false);
                })
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;

    if (request.method !== 'GET' || !url.startsWith('http')) return;

    event.respondWith((async () => {
        if (request.mode === 'navigate') {
            return networkFirstNavigation(request);
        }

        if (IS_DEV) {
            return fetch(request);
        }

        if (isApiRequest(url)) {
            return networkFirst(request, {
                cacheName: API_CACHE,
                cacheResponse: shouldCacheApiResponse(url),
                maxItems: MAX_API_ITEMS,
                timeoutMs: 3000
            });
        }

        if (isStaticAsset(url) || request.destination === 'style' || request.destination === 'script' || request.destination === 'font' || request.destination === 'image') {
            return staleWhileRevalidate(request, STATIC_CACHE, MAX_STATIC_ITEMS);
        }

        return networkFirst(request, {
            cacheName: RUNTIME_CACHE,
            cacheResponse: true,
            maxItems: MAX_RUNTIME_ITEMS
        });
    })());
});

self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting' || event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
