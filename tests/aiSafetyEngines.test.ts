import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import type { Client } from '../types';
import { assessInjuryRisk } from '../services/ai/injuryRiskService';
import { buildWeeklyMicrocyclePlan } from '../services/ai/weeklyProgressionEngine';

function buildClient(overrides: Partial<Client> = {}): Client {
    return {
        id: 'c-1',
        name: 'Aluno Teste',
        avatar: 'https://example.com/avatar.png',
        goal: 'Hipertrofia',
        level: 'Intermediário',
        adherence: 80,
        lastTraining: '2026-03-01',
        status: 'active',
        paymentStatus: 'paid',
        missedClasses: [],
        assessments: [],
        ...overrides
    };
}

test('assessInjuryRisk mantém risco baixo para perfil sem sinais clínicos relevantes', () => {
    const result = assessInjuryRisk({
        client: buildClient({
            age: 29,
            weight: 76,
            height: 176,
            injuries: 'Nenhuma',
            adherence: 92
        }),
        observations: '',
        adaptiveSignal: {
            readinessScore: 82,
            fatigueLevel: 'low',
            recommendedVolumeDeltaPct: 4,
            recommendedIntensityDeltaPct: 2,
            recommendedDaysPerWeek: 4,
            confidence: 0.7,
            sourceSessions: 8,
            rationale: 'bom histórico'
        }
    });

    assert.equal(result.level, 'low');
    assert.equal(result.blockGeneration, false);
    assert.equal(result.conservativeMode, false);
    assert.ok(result.score < 40);
    assert.ok(result.recommendedConstraints.some((line) => line.includes('progressão progressiva padrão')));
});

test('assessInjuryRisk bloqueia geração quando risco clínico agregado é crítico', () => {
    const result = assessInjuryRisk({
        client: buildClient({
            age: 68,
            weight: 118,
            height: 165,
            injuries: 'Hérnia lombar + reconstrução LCA',
            adherence: 32
        }),
        observations: 'dor intensa no joelho e incômodo na lombar',
        adaptiveSignal: {
            readinessScore: 40,
            fatigueLevel: 'high',
            recommendedVolumeDeltaPct: -20,
            recommendedIntensityDeltaPct: -12,
            recommendedDaysPerWeek: 3,
            confidence: 0.75,
            sourceSessions: 10,
            rationale: 'fadiga elevada'
        }
    });

    assert.equal(result.level, 'critical');
    assert.equal(result.blockGeneration, true);
    assert.equal(result.conservativeMode, true);
    assert.equal(result.score, 100);
    assert.ok(result.factors.length >= 5);
});

test('assessInjuryRisk classifica moderado sem bloqueio para perfil de atenção', () => {
    const result = assessInjuryRisk({
        client: buildClient({
            age: 57,
            weight: 95,
            height: 175,
            injuries: 'Nenhuma',
            adherence: 42
        }),
        observations: '',
        adaptiveSignal: {
            readinessScore: 61,
            fatigueLevel: 'moderate',
            recommendedVolumeDeltaPct: -4,
            recommendedIntensityDeltaPct: -2,
            recommendedDaysPerWeek: 4,
            confidence: 0.6,
            sourceSessions: 6,
            rationale: 'fadiga moderada'
        }
    });

    assert.equal(result.level, 'moderate');
    assert.equal(result.blockGeneration, false);
    assert.equal(result.conservativeMode, false);
    assert.ok(result.score >= 40 && result.score < 70);
});

test('buildWeeklyMicrocyclePlan gera progressão padrão para cenário neutro', () => {
    const plan = buildWeeklyMicrocyclePlan({
        goal: 'Hipertrofia',
        daysPerWeek: 4,
        injuryRiskScore: 45,
        adaptiveSignal: {
            readinessScore: 65,
            fatigueLevel: 'moderate',
            recommendedVolumeDeltaPct: 0,
            recommendedIntensityDeltaPct: 0,
            recommendedDaysPerWeek: 4,
            confidence: 0.5,
            sourceSessions: 4,
            rationale: 'baseline'
        }
    });

    assert.equal(plan.weeks.length, 4);
    assert.equal(plan.weeks[1].volumeDeltaPct, 6);
    assert.equal(plan.weeks[2].intensityDeltaPct, 4);
    assert.equal(plan.weeks[3].phase, 'Deload');
    assert.equal(plan.weeks[3].volumeDeltaPct, -25);
});

test('buildWeeklyMicrocyclePlan ativa modo conservador com fadiga alta e risco elevado', () => {
    const plan = buildWeeklyMicrocyclePlan({
        goal: 'Força',
        daysPerWeek: 5,
        injuryRiskScore: 78,
        adaptiveSignal: {
            readinessScore: 43,
            fatigueLevel: 'high',
            recommendedVolumeDeltaPct: -20,
            recommendedIntensityDeltaPct: -12,
            recommendedDaysPerWeek: 3,
            confidence: 0.8,
            sourceSessions: 12,
            rationale: 'alto risco'
        }
    });

    assert.equal(plan.weeks[0].volumeDeltaPct, -12);
    assert.equal(plan.weeks[0].intensityDeltaPct, -8);
    assert.equal(plan.weeks[3].volumeDeltaPct, -30);
    assert.ok(plan.rationale.includes('risco 78'));
});

test('buildWeeklyMicrocyclePlan libera progressão agressiva somente com prontidão alta e risco baixo', () => {
    const plan = buildWeeklyMicrocyclePlan({
        goal: 'Força máxima',
        daysPerWeek: 4,
        injuryRiskScore: 34,
        adaptiveSignal: {
            readinessScore: 88,
            fatigueLevel: 'low',
            recommendedVolumeDeltaPct: 8,
            recommendedIntensityDeltaPct: 5,
            recommendedDaysPerWeek: 5,
            confidence: 0.85,
            sourceSessions: 12,
            rationale: 'ótima prontidão'
        }
    });

    assert.equal(plan.weeks[1].volumeDeltaPct, 8);
    assert.equal(plan.weeks[2].intensityDeltaPct, 5);
    assert.equal(plan.weeks[3].volumeDeltaPct, -20);
});
