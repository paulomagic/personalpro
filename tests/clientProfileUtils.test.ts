import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  mapAssessmentsToClientShape,
  buildClientPhysicalUpdatePayload
} from '../services/clientProfileUtils';

test('mapAssessmentsToClientShape maps snake_case fields to camelCase aliases', () => {
  const mapped = mapAssessmentsToClientShape([
    { id: 'a1', body_fat: 18, muscle_mass: 42, visceral_fat: 6 }
  ]);

  assert.equal(mapped[0].bodyFat, 18);
  assert.equal(mapped[0].muscleMass, 42);
  assert.equal(mapped[0].visceralFat, 6);
});

test('buildClientPhysicalUpdatePayload converts bodyFat and keeps partial updates only', () => {
  const payload = buildClientPhysicalUpdatePayload({
    age: 32,
    bodyFat: 15.5
  });

  assert.deepEqual(payload, {
    age: 32,
    body_fat: 15.5
  });
});

test('buildClientPhysicalUpdatePayload preserves null assignment for explicit clears', () => {
  const payload = buildClientPhysicalUpdatePayload({
    weight: null,
    height: null
  });

  assert.deepEqual(payload, {
    weight: null,
    height: null
  });
});
