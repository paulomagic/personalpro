export const LOGIN_ATTEMPTS_KEY = 'personalpro:auth:loginAttempts';
export const LOCK_UNTIL_KEY = 'personalpro:auth:lockUntil';

export interface LockoutState {
    loginAttempts: number;
    lockUntil: number | null;
}

type LockoutReadStorage = Pick<Storage, 'getItem' | 'removeItem'>;
type LockoutWriteStorage = Pick<Storage, 'setItem' | 'removeItem'>;

export function readLockoutState(storage: LockoutReadStorage, nowMs: number = Date.now()): LockoutState {
    const rawAttempts = Number(storage.getItem(LOGIN_ATTEMPTS_KEY) || '0');
    const rawLockUntil = Number(storage.getItem(LOCK_UNTIL_KEY) || '0');

    const loginAttempts = !Number.isNaN(rawAttempts) && rawAttempts > 0 ? rawAttempts : 0;
    const lockUntil = !Number.isNaN(rawLockUntil) && rawLockUntil > nowMs ? rawLockUntil : null;

    if (lockUntil === null) {
        storage.removeItem(LOCK_UNTIL_KEY);
    }

    return { loginAttempts, lockUntil };
}

export function persistLockoutState(storage: LockoutWriteStorage, state: LockoutState, nowMs: number = Date.now()): void {
    if (state.loginAttempts > 0) {
        storage.setItem(LOGIN_ATTEMPTS_KEY, String(state.loginAttempts));
    } else {
        storage.removeItem(LOGIN_ATTEMPTS_KEY);
    }

    if (state.lockUntil && state.lockUntil > nowMs) {
        storage.setItem(LOCK_UNTIL_KEY, String(state.lockUntil));
    } else {
        storage.removeItem(LOCK_UNTIL_KEY);
    }
}

