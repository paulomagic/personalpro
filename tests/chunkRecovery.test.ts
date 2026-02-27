import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { isLikelyChunkLoadError, tryRecoverFromChunkError } from '../utils/chunkRecovery';

function createMockStorage() {
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

test('isLikelyChunkLoadError identifies dynamic import errors', () => {
  assert.equal(isLikelyChunkLoadError('Failed to fetch dynamically imported module'), true);
  assert.equal(isLikelyChunkLoadError('Failed to load module script'), true);
  assert.equal(isLikelyChunkLoadError('Network timeout'), false);
});

test('tryRecoverFromChunkError reloads only once inside cooldown window', () => {
  const locationRef = {
    href: 'https://personalpro-omega.vercel.app/?a=1',
    pathname: '/',
    search: '?a=1',
    hash: '',
    replaceUrl: '',
    replace(url: string) {
      this.replaceUrl = url;
    }
  };
  const storageRef = createMockStorage();

  const firstAttempt = tryRecoverFromChunkError(locationRef, storageRef, 1000);
  assert.equal(firstAttempt, true);
  assert.match(locationRef.replaceUrl, /reload=1000/);

  const secondAttempt = tryRecoverFromChunkError(locationRef, storageRef, 1500);
  assert.equal(secondAttempt, false);
});
