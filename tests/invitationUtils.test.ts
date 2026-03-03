import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  normalizeAcceptInvitationResult,
  normalizeInvitationPreviewFromRpc
} from '../services/invitations/invitationUtils';

test('normalizeInvitationPreviewFromRpc returns null for empty or invalid payloads', () => {
  assert.equal(normalizeInvitationPreviewFromRpc(null), null);
  assert.equal(normalizeInvitationPreviewFromRpc([]), null);
  assert.equal(normalizeInvitationPreviewFromRpc([{}]), null);
});

test('normalizeInvitationPreviewFromRpc normalizes valid payload', () => {
  const normalized = normalizeInvitationPreviewFromRpc([
    {
      id: 'inv-1',
      email: 'aluno@teste.com',
      client_id: 'client-1',
      status: 'pending',
      expires_at: '2026-03-01T00:00:00.000Z'
    }
  ]);

  assert.equal(normalized?.id, 'inv-1');
  assert.equal(normalized?.email, 'aluno@teste.com');
  assert.equal(normalized?.client_id, 'client-1');
  assert.equal(normalized?.status, 'pending');
});

test('normalizeAcceptInvitationResult handles success and explicit errors', () => {
  assert.deepEqual(normalizeAcceptInvitationResult({ success: true }), { success: true });
  assert.deepEqual(normalizeAcceptInvitationResult({ success: false, error: 'expirado' }), { success: false, error: 'expirado' });
  assert.deepEqual(normalizeAcceptInvitationResult({ success: false }), { success: false, error: 'Convite inválido ou expirado' });
});

