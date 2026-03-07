const CACHE_VERSION = 'v51';
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

function hasSensitiveAuth(request) {
    try {
        return request.headers.has('authorization') || request.credentials === 'include';
    } catch (_error) {
        return false;
    }
}

async function clearUserCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames
            .filter((name) => name.startsWith('personalpro-api-') || name.startsWith('personalpro-runtime-'))
            .map((name) => caches.delete(name))
    );
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
    const requestOrigin = new URL(request.url).origin;
    const canFetchFromWorker = requestOrigin === self.location.origin || isApiRequest(request.url);

    const networkUpdate = canFetchFromWorker
        ? fetch(request)
            .then(async (response) => {
                await putInCache(cacheName, request, response, maxItems);
                return response;
            })
            .catch(() => null)
        : Promise.resolve(null);

    if (cached) {
        void networkUpdate;
        return cached;
    }

    const networkResponse = await networkUpdate;
    if (networkResponse) return networkResponse;
    return new Response('', { status: 503, statusText: 'offline-and-not-cached' });
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

async function networkFirstNavigation(event) {
    const request = event.request;
    try {
        const preloaded = await event.preloadResponse;
        if (preloaded) {
            return preloaded;
        }
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
            .then(async () => {
                if (self.registration.navigationPreload) {
                    await self.registration.navigationPreload.enable();
                }
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;

    if (request.method !== 'GET' || !url.startsWith('http')) return;
    const requestUrl = new URL(url);
    const isCrossOrigin = requestUrl.origin !== self.location.origin;

    // Do not intercept generic cross-origin assets (fonts/google icons/third-party scripts),
    // otherwise CSP connect-src is applied to SW fetch and may block valid page resources.
    if (isCrossOrigin && !isApiRequest(url)) return;

    event.respondWith((async () => {
        if (request.mode === 'navigate') {
            return networkFirstNavigation(event);
        }

        if (IS_DEV) {
            return fetch(request);
        }

        if (isApiRequest(url)) {
            const cacheableApi = shouldCacheApiResponse(url) && !hasSensitiveAuth(request);
            return networkFirst(request, {
                cacheName: API_CACHE,
                cacheResponse: cacheableApi,
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
    })().catch(async () => {
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match('/offline.html');
            if (offlinePage) return offlinePage;
        }
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('', { status: 503, statusText: 'offline' });
    }));
});

self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (_error) {
        payload = { body: event.data?.text?.() || 'Você tem uma nova atualização.' };
    }

    const title = payload.title || 'Apex PersonalPro';
    const options = {
        body: payload.body || 'Você tem uma nova atualização.',
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/icon-192.png',
        tag: payload.tag || 'apex-push',
        data: {
            url: payload.url || '/dashboard',
            ...(payload.data || {})
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification?.data?.url || '/dashboard';

    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
            if ('focus' in client) {
                client.focus();
                client.navigate(targetUrl);
                return;
            }
        }
        await self.clients.openWindow(targetUrl);
    })());
});

self.addEventListener('sync', (event) => {
    const tag = event.tag;
    if (tag !== 'flush-feedback-queue' && tag !== 'flush-ai-generation-feedback-queue') {
        return;
    }

    event.waitUntil((async () => {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const messageType = tag === 'flush-feedback-queue'
            ? 'SYNC_FEEDBACK_QUEUE'
            : 'SYNC_AI_GENERATION_FEEDBACK_QUEUE';

        clients.forEach((client) => {
            client.postMessage({ type: messageType });
        });
    })());
});

self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting' || event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }
    if (event.data?.type === 'PURGE_USER_CACHES') {
        event.waitUntil(clearUserCaches());
    }
});
