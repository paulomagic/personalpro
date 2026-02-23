import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { buildEdgeAuthHeaders } from '../services/ai/providers/edgeHeaders';

test('buildEdgeAuthHeaders returns null without token', () => {
  assert.equal(buildEdgeAuthHeaders('', 'anon-key'), null);
  assert.equal(buildEdgeAuthHeaders(null, 'anon-key'), null);
});

test('buildEdgeAuthHeaders includes bearer token and anon key', () => {
  const headers = buildEdgeAuthHeaders('jwt-token', 'anon-key');
  assert.deepEqual(headers, {
    Authorization: 'Bearer jwt-token',
    apikey: 'anon-key'
  });
});
