import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import type { SessionFeedback } from '../services/ai/feedback/types';
import {
    applyPrecisionGuardrailsToMicrocycle,
    buildProgressionPrecisionReport,
    resolvePrecisionProfile
} from '../services/ai/progressionPrecisionService';

test('resolvePrecisionProfile prioriza perfil de longevidade para aluno 55+', () => {
    const profile = resolvePrecisionProfile({
        level: 'Intermediário',
        goal: 'Saúde e mobilidade',
        age: 61,
        adherence: 82,
        status: 'active'
    });

    assert.equal(profile.segment, 'longevity_recovery');
    assert.equal(profile.target.targetPrecisionScore, 84);
});

test('applyPrecisionGuardrailsToMicrocycle limita picos para perfil novice_rebuild', () => {
    const guarded = applyPrecisionGuardrailsToMicrocycle([
        { volumeDeltaPct: 14, intensityDeltaPct: 9, instruction: 'Pico' },
        { volumeDeltaPct: -45, intensityDeltaPct: -30, instruction: 'Deload extremo' }
    ], 'novice_rebuild');

    assert.equal(guarded[0].volumeDeltaPct, 6);
    assert.equal(guarded[0].intensityDeltaPct, 3);
    assert.equal(guarded[1].volumeDeltaPct, -35);
    assert.equal(guarded[1].intensityDeltaPct, -18);
});

test('buildProgressionPrecisionReport identifica baixa precisão quando dor e erro de esforço sobem', () => {
    const feedbacks: SessionFeedback[] = [
        {
            workout_id: 'w1',
            student_id: 'c1',
            exercise_id: 'e1',
            session_date: '2026-03-01',
            sets_completed: 2,
            reps_completed: [8, 7, 6, 5],
            load_used: 50,
            rpe: 9.5,
            rir: 0,
            notes: 'Dor no joelho após as séries'
        },
        {
            workout_id: 'w1',
            student_id: 'c1',
            exercise_id: 'e2',
            session_date: '2026-02-27',
            sets_completed: 2,
            reps_completed: [8, 7, 6, 5],
            load_used: 52,
            rpe: 9,
            rir: 0,
            notes: 'pain and discomfort'
        },
        {
            workout_id: 'w1',
            student_id: 'c1',
            exercise_id: 'e3',
            session_date: '2026-02-25',
            sets_completed: 2,
            reps_completed: [8, 7, 6, 5],
            load_used: 51,
            rpe: 9.2,
            rir: 0,
            notes: 'dor persistente'
        }
    ];

    const profile = resolvePrecisionProfile({
        level: 'Intermediário',
        goal: 'Hipertrofia',
        age: 32,
        adherence: 75,
        status: 'active'
    });
    const report = buildProgressionPrecisionReport({ feedbacks, profile });

    assert.equal(report.achievedTarget, false);
    assert.ok(report.precisionScore < profile.target.targetPrecisionScore);
    assert.ok(report.signals.painRate >= 0.66);
});
