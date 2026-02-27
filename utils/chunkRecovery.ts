const CHUNK_RELOAD_KEY = 'personalpro:chunk-reload-at';
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

type BrowserLocation = Pick<Location, 'href' | 'pathname' | 'search' | 'hash' | 'replace'>;
type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function canUseBrowserApis(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

export function isLikelyChunkLoadError(message: string | undefined | null): boolean {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return normalized.includes('failed to fetch dynamically imported module')
        || normalized.includes('failed to load module script')
        || normalized.includes('importing a module script failed')
        || normalized.includes('loading chunk')
        || normalized.includes('unexpected token \'<\'');
}

export function tryRecoverFromChunkError(
    locationRef: BrowserLocation,
    storageRef: BrowserStorage,
    now = Date.now()
): boolean {
    const rawLastAttempt = storageRef.getItem(CHUNK_RELOAD_KEY);
    const lastAttempt = rawLastAttempt ? Number(rawLastAttempt) : null;
    if (lastAttempt && !Number.isNaN(lastAttempt) && now - lastAttempt < CHUNK_RELOAD_COOLDOWN_MS) {
        return false;
    }

    storageRef.setItem(CHUNK_RELOAD_KEY, String(now));

    const url = new URL(locationRef.href);
    url.searchParams.set('reload', String(now));
    locationRef.replace(`${url.pathname}${url.search}${url.hash}`);
    return true;
}

export function installChunkRecovery(): void {
    if (!canUseBrowserApis()) return;

    window.addEventListener('error', (event) => {
        const target = event.target as (EventTarget & { src?: string }) | null;
        const isChunkScriptFailure = !!target?.src && target.src.includes('/assets/');
        if (!isChunkScriptFailure && !isLikelyChunkLoadError(event.message)) {
            return;
        }

        const recovered = tryRecoverFromChunkError(window.location, sessionStorage);
        if (!recovered) {
            console.error('[ChunkRecovery] Repeated chunk load failure detected.', event.message || target?.src);
        }
    }, true);

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason as { message?: string } | string | null | undefined;
        const message = typeof reason === 'string' ? reason : reason?.message;
        if (!isLikelyChunkLoadError(message)) {
            return;
        }

        const recovered = tryRecoverFromChunkError(window.location, sessionStorage);
        if (!recovered) {
            console.error('[ChunkRecovery] Repeated dynamic import failure.', message);
        }
    });
}
