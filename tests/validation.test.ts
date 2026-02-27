import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { validateImageUrl } from '../utils/validation';

test('validateImageUrl accepts trusted https avatar hosts', () => {
  assert.equal(validateImageUrl('https://ui-avatars.com/api/?name=Paulo'), true);
  assert.equal(validateImageUrl('https://subdomain.googleusercontent.com/avatar.png'), true);
});

test('validateImageUrl rejects http and malformed urls', () => {
  assert.equal(validateImageUrl('http://ui-avatars.com/api/?name=Paulo'), false);
  assert.equal(validateImageUrl('not-a-url'), false);
});

test('validateImageUrl rejects lookalike domains', () => {
  assert.equal(validateImageUrl('https://ui-avatars.com.attacker.net/payload.png'), false);
  assert.equal(validateImageUrl('https://evil-supabase.com.attacker.net/avatar.png'), false);
});
