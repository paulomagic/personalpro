import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  LOCK_UNTIL_KEY,
  LOGIN_ATTEMPTS_KEY,
  persistLockoutState,
  readLockoutState
} from '../services/auth/lockoutStorage';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    }
  };
}

test('persistLockoutState stores active attempts and lock', () => {
  const storage = createMemoryStorage();
  persistLockoutState(storage, { loginAttempts: 3, lockUntil: 5000 }, 1000);

  assert.equal(storage.getItem(LOGIN_ATTEMPTS_KEY), '3');
  assert.equal(storage.getItem(LOCK_UNTIL_KEY), '5000');
});

test('persistLockoutState clears stale values', () => {
  const storage = createMemoryStorage();
  storage.setItem(LOGIN_ATTEMPTS_KEY, '2');
  storage.setItem(LOCK_UNTIL_KEY, '500');

  persistLockoutState(storage, { loginAttempts: 0, lockUntil: 500 }, 1000);

  assert.equal(storage.getItem(LOGIN_ATTEMPTS_KEY), null);
  assert.equal(storage.getItem(LOCK_UNTIL_KEY), null);
});

test('readLockoutState recovers valid data and clears expired lock', () => {
  const storage = createMemoryStorage();
  storage.setItem(LOGIN_ATTEMPTS_KEY, '4');
  storage.setItem(LOCK_UNTIL_KEY, '2000');

  const active = readLockoutState(storage, 1000);
  assert.deepEqual(active, { loginAttempts: 4, lockUntil: 2000 });

  const expired = readLockoutState(storage, 3000);
  assert.deepEqual(expired, { loginAttempts: 4, lockUntil: null });
  assert.equal(storage.getItem(LOCK_UNTIL_KEY), null);
});

