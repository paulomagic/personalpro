import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { View } from '../types';
import {
  resolveUserRole,
  resolvePostLoginView,
  resolveNavigationView,
  calculateLockDurationMs,
  isLockedOut,
  getRemainingLockSeconds,
  canAccessAdminArea,
  createDemoUser
} from '../services/auth/authFlow';

test('resolveUserRole defaults to coach when role is absent', () => {
  const role = resolveUserRole(null, { user_metadata: {}, profile: undefined });
  assert.equal(role, 'coach');
});

test('resolvePostLoginView sends student role to student dashboard', () => {
  const view = resolvePostLoginView({ role: 'student' }, null);
  assert.equal(view, View.STUDENT);
});

test('resolveNavigationView routes home based on role', () => {
  assert.equal(resolveNavigationView('home', 'coach'), View.DASHBOARD);
  assert.equal(resolveNavigationView('home', 'student'), View.STUDENT);
});

test('lockout policy applies exponential backoff from 5th failure', () => {
  assert.equal(calculateLockDurationMs(4), null);
  assert.equal(calculateLockDurationMs(5), 30000);
  assert.equal(calculateLockDurationMs(6), 60000);
});

test('lockout helpers compute remaining seconds', () => {
  const now = 1000;
  const lockUntil = now + 2500;
  assert.equal(isLockedOut(lockUntil, now), true);
  assert.equal(getRemainingLockSeconds(lockUntil, now), 3);
  assert.equal(getRemainingLockSeconds(lockUntil, lockUntil + 1), 0);
});

test('admin access helper validates metadata role', () => {
  const allowed = canAccessAdminArea({
    user_metadata: { role: 'admin' },
    profile: undefined
  });
  assert.equal(allowed, true);
});

test('demo user factory returns deterministic demo identity', () => {
  const demo = createDemoUser();
  assert.equal(demo.isDemo, true);
  assert.equal(demo.id, 'demo-user-id');
  assert.equal(demo.user_metadata?.role, 'coach');
});
