import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  ExerciseReplacementSchema,
  extractLikelyJson,
  IntentionResponseSchema,
  ProgressAnalysisSchema,
  RefinedWorkoutSchema,
  WorkoutProgramSchema,
} from '../services/ai/responseSchemas';

test('extractLikelyJson removes markdown fences and trailing commas', () => {
  const raw = '```json\n{"title":"A","splits":[{"name":"A","focus":"B","exercises":[{"name":"Supino","sets":4,"reps":"8-12","rest":"60s","targetMuscle":"peito",}],}],}\n```';
  const clean = extractLikelyJson(raw);
  assert.equal(clean.includes('```'), false);
  assert.equal(clean.includes(',}'), false);
  assert.equal(clean.includes(',]'), false);
});

test('WorkoutProgramSchema validates workout payload', () => {
  const payload = {
    title: 'Treino Hipertrofia',
    objective: 'Ganho de massa muscular',
    duration: '60 min',
    splits: [
      {
        name: 'Treino A',
        focus: 'Peito e tríceps',
        exercises: [
          { name: 'Supino reto', sets: 4, reps: '8-12', rest: '60s', targetMuscle: 'peito' }
        ]
      }
    ]
  };
  const result = WorkoutProgramSchema.safeParse(payload);
  assert.equal(result.success, true);
});

test('ProgressAnalysisSchema rejects malformed analysis payload', () => {
  const payload = { summary: 'ok', improvements: 'invalid-string' };
  const result = ProgressAnalysisSchema.safeParse(payload);
  assert.equal(result.success, false);
});

test('ExerciseReplacementSchema validates replacement payload', () => {
  const payload = {
    name: 'Remada baixa',
    sets: 3,
    reps: '10-12',
    rest: '75s',
    targetMuscle: 'costas'
  };
  const result = ExerciseReplacementSchema.safeParse(payload);
  assert.equal(result.success, true);
});

test('RefinedWorkoutSchema requires at least one split', () => {
  const invalid = RefinedWorkoutSchema.safeParse({ splits: [] });
  const valid = RefinedWorkoutSchema.safeParse({
    splits: [
      {
        name: 'A',
        focus: 'B',
        exercises: [{ name: 'Agachamento', sets: 4, reps: '6-8', rest: '120s', targetMuscle: 'quadriceps' }]
      }
    ]
  });
  assert.equal(invalid.success, false);
  assert.equal(valid.success, true);
});

test('IntentionResponseSchema validates movement intentions', () => {
  const payload = {
    title: 'Treino por intenção',
    objective: 'Força',
    splits: [
      {
        name: 'A',
        focus: 'Upper',
        intentions: [
          {
            movement_pattern: 'empurrar_horizontal',
            primary_muscle: 'peito',
            sets: 4,
            reps: '8-10',
            rest: '90s'
          }
        ]
      }
    ]
  };
  const result = IntentionResponseSchema.safeParse(payload);
  assert.equal(result.success, true);
});
