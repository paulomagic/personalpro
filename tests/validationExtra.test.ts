import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  sanitizeText,
  validateBodyFat,
  validateEmail,
  validateMeasurement,
  validatePhone,
  validateWeight
} from '../utils/validation';

test('validateWeight enforces min/max range', () => {
  assert.equal(validateWeight(80).valid, true);
  assert.equal(validateWeight(19).valid, false);
  assert.equal(validateWeight(301).valid, false);
});

test('validateBodyFat enforces min/max range', () => {
  assert.equal(validateBodyFat(15).valid, true);
  assert.equal(validateBodyFat(2).valid, false);
  assert.equal(validateBodyFat(61).valid, false);
});

test('validateMeasurement rejects negatives', () => {
  assert.equal(validateMeasurement(42).valid, true);
  assert.equal(validateMeasurement(-1).valid, false);
});

test('validateEmail accepts valid and rejects invalid formats', () => {
  assert.equal(validateEmail('coach@personalpro.app').valid, true);
  assert.equal(validateEmail('invalido-sem-arroba').valid, false);
});

test('validatePhone supports brazilian 10/11 digits only', () => {
  assert.equal(validatePhone('(11) 99999-9999').valid, true);
  assert.equal(validatePhone('119999999').valid, false);
  assert.equal(validatePhone('').valid, true);
});

test('sanitizeText escapes html-sensitive characters', () => {
  const dirty = `<script>alert("x")</script>'`;
  const clean = sanitizeText(dirty);
  assert.equal(clean.includes('<script>'), false);
  assert.match(clean, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;&#039;/);
});

