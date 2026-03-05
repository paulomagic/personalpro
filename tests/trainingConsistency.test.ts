import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { buildConsistencyRecommendation, derivePlannedSessionsPerWeek, deriveSmartGoals, deriveStudentConsistencyStats } from '../services/product/trainingConsistency';
import type { Client, CompletedWorkout, Workout } from '../types';

const baseClient: Client = {
  id: 'client-1',
  name: 'Aluno Teste',
  avatar: '',
  goal: 'Hipertrofia',
  level: 'Intermediário',
  adherence: 82,
  lastTraining: 'Hoje',
  status: 'active',
  startDate: '2026-01-01',
  missedClasses: [],
  assessments: [],
  paymentStatus: 'paid'
};

function createCompletedWorkout(daysAgo: number, overrides: Partial<CompletedWorkout> = {}): CompletedWorkout {
  const date = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    id: `cw-${daysAgo}-${Math.random()}`,
    client_id: baseClient.id,
    title: 'Treino A',
    date,
    duration: '50 min',
    exercises_count: 8,
    sets_completed: 24,
    total_load_volume: 1200,
    created_at: date,
    ...overrides
  };
}

test('derivePlannedSessionsPerWeek prioriza splits do treino atual', () => {
  const currentWorkout = {
    splits: [{}, {}, {}, {}]
  } as Workout;

  assert.equal(derivePlannedSessionsPerWeek(baseClient, currentWorkout), 4);
});

test('deriveStudentConsistencyStats calcula conclusão semanal e streak', () => {
  const history = [
    createCompletedWorkout(0),
    createCompletedWorkout(1),
    createCompletedWorkout(2),
    createCompletedWorkout(8)
  ];

  const stats = deriveStudentConsistencyStats({
    history,
    client: baseClient,
    currentWorkout: { splits: [{}, {}, {}, {}] } as Workout
  });

  assert.equal(stats.workoutsCompleted, 3);
  assert.equal(stats.workoutsPlanned, 4);
  assert.equal(stats.totalMinutes, 150);
  assert.equal(stats.totalLoadVolume, 3600);
  assert.equal(stats.streak, 3);
  assert.equal(stats.completionRate, 75);
  assert.equal(stats.consistencyScore, 77);
});

test('deriveSmartGoals cria metas calibradas pelo histórico recente', () => {
  const goals = deriveSmartGoals({
    history: [createCompletedWorkout(0), createCompletedWorkout(2)],
    client: baseClient,
    currentWorkout: { splits: [{}, {}, {}] } as Workout
  });

  assert.equal(goals.length, 4);
  assert.equal(goals[0].id, 'sessions');
  assert.equal(goals[0].target, 3);
  assert.equal(goals[1].target, 150);
  assert.equal(goals[2].target, 3600);
});

test('buildConsistencyRecommendation ajusta orientação por score', () => {
  assert.match(buildConsistencyRecommendation({
    workoutsCompleted: 5,
    workoutsPlanned: 5,
    totalMinutes: 250,
    totalLoadVolume: 6000,
    streak: 6,
    consistencyScore: 90,
    completionRate: 100,
    lastCompletedAt: new Date().toISOString()
  }), /Consistência alta/);

  assert.match(buildConsistencyRecommendation({
    workoutsCompleted: 1,
    workoutsPlanned: 4,
    totalMinutes: 45,
    totalLoadVolume: 600,
    streak: 1,
    consistencyScore: 40,
    completionRate: 25,
    lastCompletedAt: new Date().toISOString()
  }), /abaixo do ideal/);
});
