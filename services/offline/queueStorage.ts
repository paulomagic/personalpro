interface QueueRecord<T> {
    key: string;
    value: T[];
    updatedAt: number;
}

const DB_NAME = 'personalpro_offline_v1';
const DB_VERSION = 1;
const STORE_NAME = 'queues';

function canUseLocalStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function canUseIndexedDB(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function readLocalStorageQueue<T>(key: string): T[] {
    if (!canUseLocalStorage()) return [];
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeLocalStorageQueue<T>(key: string, items: T[]): boolean {
    if (!canUseLocalStorage()) return false;
    try {
        window.localStorage.setItem(key, JSON.stringify(items));
        return true;
    } catch {
        return false;
    }
}

function removeLocalStorageQueue(key: string): void {
    if (!canUseLocalStorage()) return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        // noop
    }
}

function openQueueDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (!canUseIndexedDB()) {
            reject(new Error('indexeddb_unavailable'));
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('indexeddb_open_failed'));
    });
}

async function readIndexedDBQueue<T>(key: string): Promise<T[] | null> {
    const db = await openQueueDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
            const record = request.result as QueueRecord<T> | undefined;
            resolve(Array.isArray(record?.value) ? record!.value : []);
        };
        request.onerror = () => reject(request.error || new Error('indexeddb_read_failed'));
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
    });
}

async function writeIndexedDBQueue<T>(key: string, items: T[]): Promise<boolean> {
    const db = await openQueueDb();

    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record: QueueRecord<T> = {
            key,
            value: items,
            updatedAt: Date.now()
        };
        store.put(record);
        tx.oncomplete = () => {
            db.close();
            resolve(true);
        };
        tx.onerror = () => {
            db.close();
            resolve(false);
        };
    });
}

export async function readQueueWithFallback<T>(
    indexedDbKey: string,
    legacyLocalStorageKey?: string
): Promise<T[]> {
    if (!canUseIndexedDB()) {
        const fallbackKey = legacyLocalStorageKey || indexedDbKey;
        return readLocalStorageQueue<T>(fallbackKey);
    }

    try {
        const current = await readIndexedDBQueue<T>(indexedDbKey);
        if (current && current.length > 0) {
            return current;
        }

        if (!legacyLocalStorageKey) return current || [];
        const legacy = readLocalStorageQueue<T>(legacyLocalStorageKey);
        if (legacy.length > 0) {
            const migrated = await writeIndexedDBQueue(indexedDbKey, legacy);
            if (migrated) {
                removeLocalStorageQueue(legacyLocalStorageKey);
                return legacy;
            }
        }
        return legacy;
    } catch {
        const fallbackKey = legacyLocalStorageKey || indexedDbKey;
        return readLocalStorageQueue<T>(fallbackKey);
    }
}

export async function writeQueueWithFallback<T>(
    indexedDbKey: string,
    items: T[],
    legacyLocalStorageKey?: string
): Promise<boolean> {
    if (!canUseIndexedDB()) {
        const fallbackKey = legacyLocalStorageKey || indexedDbKey;
        return writeLocalStorageQueue(fallbackKey, items);
    }

    try {
        const wrote = await writeIndexedDBQueue(indexedDbKey, items);
        if (wrote && legacyLocalStorageKey) {
            removeLocalStorageQueue(legacyLocalStorageKey);
        }
        return wrote;
    } catch {
        const fallbackKey = legacyLocalStorageKey || indexedDbKey;
        return writeLocalStorageQueue(fallbackKey, items);
    }
}
