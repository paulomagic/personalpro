const CACHE_NAME = 'personalpro-v6';
const STATIC_CACHE = 'personalpro-static-v6';
const DYNAMIC_CACHE = 'personalpro-dynamic-v6';

// Assets estáticos para cachear imediatamente
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/hero.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json'
];

// Padrões de URL para diferentes estratégias de cache
const API_PATTERNS = [
    'supabase.co',
    '/rest/v1/',
    '/auth/v1/',
    '/functions/v1/'
];

const STATIC_PATTERNS = [
    '.js',
    '.css',
    '.woff2',
    '.woff',
    '.ttf',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
    '.ico'
];

// Install event - cache recursos estáticos
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - limpar caches antigos
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Verifica se é uma requisição de API
function isApiRequest(url) {
    return API_PATTERNS.some(pattern => url.includes(pattern));
}

// Verifica se é um asset estático
function isStaticAsset(url) {
    return STATIC_PATTERNS.some(pattern => url.endsWith(pattern));
}

// Estratégia: Network First (para APIs)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Estratégia: Cache First (para assets estáticos)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        throw error;
    }
}

// Estratégia: Stale While Revalidate (para páginas HTML)
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(() => null);

    return cachedResponse || fetchPromise;
}

// Fetch event - aplicar estratégias de cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;

    // Ignorar requisições não-GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar extensões do Chrome e URLs não-http
    if (!url.startsWith('http')) {
        return;
    }

    event.respondWith(
        (async () => {
            try {
                // APIs: Network First
                if (isApiRequest(url)) {
                    return await networkFirst(request);
                }

                // Assets estáticos: Cache First
                if (isStaticAsset(url)) {
                    return await cacheFirst(request);
                }

                // Páginas HTML: Stale While Revalidate
                return await staleWhileRevalidate(request);

            } catch (error) {
                console.log('[SW] Fetch failed, serving offline page:', error);

                // Se falhar e for navegação, mostrar página offline
                if (request.mode === 'navigate') {
                    const offlinePage = await caches.match('/offline.html');
                    if (offlinePage) {
                        return offlinePage;
                    }
                }

                // Tentar retornar do cache como último recurso
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                throw error;
            }
        })()
    );
});

// Escutar mensagens do cliente (para forçar atualização)
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
