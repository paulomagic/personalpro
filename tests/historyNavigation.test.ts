import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { View, type Client, type Workout } from '../types';
import {
    buildNavigationUrl,
    isView,
    resolvePathFromView,
    resolveViewFromPath,
} from '../services/navigation/historyNavigation';

function makeClient(id: string): Client {
    return {
        id,
        name: 'Cliente Teste',
        avatar: '',
        goal: 'Força',
        level: 'Intermediário',
        adherence: 80,
        lastTraining: 'Hoje',
        status: 'active',
        paymentStatus: 'paid',
        missedClasses: [],
        assessments: [],
    };
}

function makeWorkout(id: string): Workout {
    return {
        id,
        clientId: 'client-1',
        studentId: 'student-1',
        title: 'Treino A',
        objective: 'Hipertrofia',
        duration: '45 min',
        days: 3,
        exercises: [],
        splits: [],
    };
}

test('resolvePathFromView returns stable paths', () => {
    assert.equal(resolvePathFromView(View.LOGIN), '/');
    assert.equal(resolvePathFromView(View.DASHBOARD), '/dashboard');
    assert.equal(resolvePathFromView(View.ADMIN_AI_LOGS), '/admin/ai-logs');
});

test('resolveViewFromPath maps known routes and trims trailing slash', () => {
    assert.equal(resolveViewFromPath('/dashboard'), View.DASHBOARD);
    assert.equal(resolveViewFromPath('/dashboard/'), View.DASHBOARD);
    assert.equal(resolveViewFromPath('/admin/settings'), View.ADMIN_SETTINGS);
    assert.equal(resolveViewFromPath('/unknown'), null);
});

test('buildNavigationUrl appends query for client/workout specific screens', () => {
    const client = makeClient('client-123');
    const workout = makeWorkout('workout-999');

    assert.equal(buildNavigationUrl(View.CLIENT_PROFILE, client, null), '/clients/profile?client=client-123');
    assert.equal(buildNavigationUrl(View.ASSESSMENT, client, null), '/assessment?client=client-123');
    assert.equal(buildNavigationUrl(View.TRAINING_EXECUTION, client, workout), '/training/execution?workout=workout-999');
    assert.equal(buildNavigationUrl(View.DASHBOARD, client, workout), '/dashboard');
});

test('isView validates enum values', () => {
    assert.equal(isView(View.CALENDAR), true);
    assert.equal(isView('RANDOM_VIEW'), false);
    assert.equal(isView(null), false);
});
