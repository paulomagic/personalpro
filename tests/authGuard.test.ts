import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { normalizeAuthGuardResult } from '../services/auth/authGuard';

test('normalizeAuthGuardResult returns allowed on 2xx with allowed=true', () => {
  const result = normalizeAuthGuardResult(200, { allowed: true, retry_after_seconds: 0 });
  assert.deepEqual(result, { allowed: true, retryAfterSeconds: 0 });
});

test('normalizeAuthGuardResult blocks on 429 and preserves retry hint', () => {
  const result = normalizeAuthGuardResult(429, {
    allowed: false,
    retry_after_seconds: 12,
    error: 'Too many authentication attempts'
  });
  assert.equal(result.allowed, false);
  assert.equal(result.retryAfterSeconds, 12);
  assert.equal(result.error, 'Too many authentication attempts');
});

test('normalizeAuthGuardResult fail-opens on infrastructure status errors', () => {
  const result = normalizeAuthGuardResult(503, null);
  assert.equal(result.allowed, true);
  assert.equal(result.retryAfterSeconds, 0);
  assert.equal(result.error, undefined);
});
