import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  classifyInjuryConstraints,
  pseudonymizeClientName,
  sanitizeCoachObservations,
  summarizePreferenceTags
} from '../services/ai/promptPrivacy';

test('pseudonymizeClientName produces deterministic alias', () => {
  assert.equal(pseudonymizeClientName('Maria Silva'), pseudonymizeClientName('Maria Silva'));
  assert.match(pseudonymizeClientName('Maria Silva'), /^ATLETA_[A-Z0-9]+$/);
});

test('classifyInjuryConstraints preserves safe sentinel and categorizes keywords', () => {
  assert.equal(classifyInjuryConstraints('sem_restricoes_reportadas'), 'sem_restricoes_reportadas');
  assert.equal(classifyInjuryConstraints('Dor no joelho e ombro'), 'joelho, ombro');
});

test('summarizePreferenceTags preserves safe sentinel and categorizes preferences', () => {
  assert.equal(summarizePreferenceTags('sem_preferencias_especificas'), 'sem_preferencias_especificas');
  assert.equal(summarizePreferenceTags('Prefere maquina e cardio'), 'maquinas, cardio');
});

test('sanitizeCoachObservations strips identifiers and truncates text', () => {
  const sanitized = sanitizeCoachObservations('Nome: Maria Silva, telefone 11999998888, evitar dor lombar.');
  assert.ok(!sanitized.includes('11999998888'));
  assert.ok(sanitized.includes('dor lombar'));
  assert.ok(sanitized.length <= 220);
});
