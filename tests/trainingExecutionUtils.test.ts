import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import type { Workout, WorkoutSplit } from '../types';
import {
  getWorkoutSplits,
  hasPendingSplitSelection,
  resolveActiveSplit,
  resolveExecutionExercises,
  resolveInitialSplitIndex
} from '../services/trainingExecutionUtils';

const makeSplit = (id: string, exerciseName: string): WorkoutSplit => ({
  id,
  name: id,
  description: `Split ${id}`,
  exercises: [
    {
      id: `${id}-1`,
      name: exerciseName,
      category: 'musculacao',
      sets: [{ method: 'simples', reps: '10', load: '20', rest: '60' }]
    }
  ]
});

test('resolveInitialSplitIndex requires selection when workout has multiple splits', () => {
  assert.equal(resolveInitialSplitIndex([]), 0);
  assert.equal(resolveInitialSplitIndex([makeSplit('A', 'Supino')]), 0);
  assert.equal(resolveInitialSplitIndex([makeSplit('A', 'Supino'), makeSplit('B', 'Remada')]), null);
});

test('hasPendingSplitSelection identifies unresolved multi-split state', () => {
  const splits = [makeSplit('A', 'Supino'), makeSplit('B', 'Remada')];
  assert.equal(hasPendingSplitSelection(splits, null), true);
  assert.equal(hasPendingSplitSelection(splits, 0), false);
  assert.equal(hasPendingSplitSelection([makeSplit('A', 'Supino')], null), false);
});

test('resolveActiveSplit guards invalid indexes', () => {
  const splits = [makeSplit('A', 'Supino'), makeSplit('B', 'Remada')];
  assert.equal(resolveActiveSplit(splits, null), null);
  assert.equal(resolveActiveSplit(splits, -1), null);
  assert.equal(resolveActiveSplit(splits, 2), null);
  assert.equal(resolveActiveSplit(splits, 1)?.name, 'B');
});

test('resolveExecutionExercises prefers active split exercises over workout root exercises', () => {
  const workout = {
    id: 'w1',
    title: 'Treino',
    objective: 'Hipertrofia',
    duration: '60',
    exercises: [
      {
        id: 'root-1',
        name: 'Agachamento',
        category: 'musculacao',
        sets: [{ method: 'simples', reps: '8', load: '40', rest: '90' }]
      }
    ],
    splits: [makeSplit('A', 'Supino'), makeSplit('B', 'Remada')]
  } as unknown as Workout;

  const splitExercises = resolveExecutionExercises(workout, workout.splits[1]);
  assert.equal(splitExercises[0]?.name, 'Remada');

  const fallbackExercises = resolveExecutionExercises(workout, null);
  assert.equal(fallbackExercises[0]?.name, 'Agachamento');
});

test('getWorkoutSplits always returns an array', () => {
  const workoutWithSplits = { splits: [makeSplit('A', 'Supino')] } as Workout;
  assert.equal(getWorkoutSplits(workoutWithSplits).length, 1);

  const workoutWithoutSplits = { splits: null } as unknown as Workout;
  assert.equal(getWorkoutSplits(workoutWithoutSplits).length, 0);
});

