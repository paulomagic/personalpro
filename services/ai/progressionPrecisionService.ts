import type { SessionFeedback } from './feedback/types';

export type PrecisionProfileSegment =
    | 'novice_rebuild'
    | 'intermediate_progressive'
    | 'advanced_performance'
    | 'longevity_recovery'
    | 'fat_loss_adherence';

export interface PrecisionProfileInput {
    level?: string;
    goal?: string;
    age?: number;
    adherence?: number;
    status?: string;
}

export interface PrecisionTargetPolicy {
    targetPrecisionScore: number;
    maxMeanRpeError: number;
    maxMeanRirError: number;
    maxPainRate: number;
    maxRpeVariance: number;
}

export interface PrecisionProfileResolution {
    segment: PrecisionProfileSegment;
    label: string;
    rationale: string;
    target: PrecisionTargetPolicy;
}

export interface ProgressionPrecisionSignals {
    meanRpeError: number;
    meanRirError: number;
    painRate: number;
    completionRate: number;
    rpeVariance: number;
}

export interface ProgressionPrecisionReport {
    precisionScore: number;
    confidence: number;
    achievedTarget: boolean;
    recommendation: string;
    sampleSize: number;
    signals: ProgressionPrecisionSignals;
}

interface PrecisionWeekShape {
    volumeDeltaPct: number;
    intensityDeltaPct: number;
    instruction?: string;
}

const SEGMENT_TARGETS: Record<PrecisionProfileSegment, PrecisionTargetPolicy> = {
    novice_rebuild: {
        targetPrecisionScore: 78,
        maxMeanRpeError: 1.3,
        maxMeanRirError: 1.1,
        maxPainRate: 0.2,
        maxRpeVariance: 1.4
    },
    intermediate_progressive: {
        targetPrecisionScore: 82,
        maxMeanRpeError: 1,
        maxMeanRirError: 0.9,
        maxPainRate: 0.16,
        maxRpeVariance: 1.2
    },
    advanced_performance: {
        targetPrecisionScore: 87,
        maxMeanRpeError: 0.7,
        maxMeanRirError: 0.7,
        maxPainRate: 0.12,
        maxRpeVariance: 1
    },
    longevity_recovery: {
        targetPrecisionScore: 84,
        maxMeanRpeError: 0.8,
        maxMeanRirError: 0.8,
        maxPainRate: 0.1,
        maxRpeVariance: 0.9
    },
    fat_loss_adherence: {
        targetPrecisionScore: 80,
        maxMeanRpeError: 1.1,
        maxMeanRirError: 1,
        maxPainRate: 0.18,
        maxRpeVariance: 1.3
    }
};

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[]): number {
    if (values.length <= 1) return 0;
    const mean = average(values);
    const variance = average(values.map(value => (value - mean) ** 2));
    return Math.sqrt(variance);
}

function hasGoal(goal: string | undefined, keywords: string[]): boolean {
    if (!goal) return false;
    const normalized = goal.toLowerCase();
    return keywords.some(keyword => normalized.includes(keyword));
}

function inferExpectedRpe(segment: PrecisionProfileSegment): number {
    switch (segment) {
        case 'novice_rebuild':
            return 6.4;
        case 'intermediate_progressive':
            return 7.1;
        case 'advanced_performance':
            return 7.9;
        case 'longevity_recovery':
            return 6.2;
        case 'fat_loss_adherence':
            return 7;
        default:
            return 7;
    }
}

function inferPainSignal(notes?: string): boolean {
    if (!notes) return false;
    const text = notes.toLowerCase();
    return text.includes('dor') || text.includes('pain') || text.includes('inflama') || text.includes('incômodo') || text.includes('incomodo');
}

function resolveSegmentLabel(segment: PrecisionProfileSegment): string {
    switch (segment) {
        case 'novice_rebuild':
            return 'Novato em Construção';
        case 'intermediate_progressive':
            return 'Progressão Intermediária';
        case 'advanced_performance':
            return 'Alta Performance';
        case 'longevity_recovery':
            return 'Longevidade e Recuperação';
        case 'fat_loss_adherence':
            return 'Emagrecimento com Aderência';
        default:
            return 'Progressão Intermediária';
    }
}

export function resolvePrecisionProfile(input: PrecisionProfileInput): PrecisionProfileResolution {
    const level = (input.level || '').toLowerCase();
    const goal = (input.goal || '').toLowerCase();
    const age = input.age || 0;
    const adherence = input.adherence ?? 70;
    const status = (input.status || '').toLowerCase();

    let segment: PrecisionProfileSegment = 'intermediate_progressive';
    let rationale = 'Perfil padrão de progressão contínua.';

    if (age >= 55 || hasGoal(goal, ['saúde', 'saude', 'reabilita', 'mobilidade'])) {
        segment = 'longevity_recovery';
        rationale = 'Prioriza segurança articular e recuperação entre estímulos.';
    } else if (hasGoal(goal, ['emagrec', 'perda'])) {
        segment = 'fat_loss_adherence';
        rationale = 'Equilibra gasto energético com aderência sustentável.';
    } else if (level.includes('iniciante') || adherence < 55 || status === 'at-risk') {
        segment = 'novice_rebuild';
        rationale = 'Exige progressão mais conservadora e previsível.';
    } else if ((level.includes('avançado') || level.includes('atleta')) && adherence >= 75) {
        segment = 'advanced_performance';
        rationale = 'Tolera progressão agressiva com controle fino de carga.';
    }

    return {
        segment,
        label: resolveSegmentLabel(segment),
        rationale,
        target: SEGMENT_TARGETS[segment]
    };
}

function buildRecommendation(signals: ProgressionPrecisionSignals, target: PrecisionTargetPolicy): string {
    const drivers = [
        { key: 'rpe', ratio: signals.meanRpeError / Math.max(0.1, target.maxMeanRpeError) },
        { key: 'rir', ratio: signals.meanRirError / Math.max(0.1, target.maxMeanRirError) },
        { key: 'pain', ratio: signals.painRate / Math.max(0.01, target.maxPainRate) },
        { key: 'completion', ratio: (1 - signals.completionRate) / 0.15 },
        { key: 'variance', ratio: signals.rpeVariance / Math.max(0.1, target.maxRpeVariance) }
    ];
    const top = drivers.sort((a, b) => b.ratio - a.ratio)[0];

    if (!top || top.ratio <= 1) {
        return 'Modelo estável para o perfil atual. Manter progressão gradual com monitoramento semanal.';
    }
    if (top.key === 'pain') {
        return 'Elevar filtros de segurança: reduzir intensidade e bloquear progressões em exercícios com dor reportada.';
    }
    if (top.key === 'completion') {
        return 'Reduzir densidade e duração da sessão para recuperar consistência antes de subir carga.';
    }
    if (top.key === 'rpe' || top.key === 'rir') {
        return 'Recalibrar progressão de carga/reps para convergir ao alvo de esforço do perfil.';
    }
    return 'Diminuir variabilidade entre sessões para estabilizar o estímulo e aumentar previsibilidade.';
}

export function buildProgressionPrecisionReport(params: {
    feedbacks: SessionFeedback[];
    profile: PrecisionProfileResolution;
    lookbackSessions?: number;
}): ProgressionPrecisionReport {
    const lookback = clamp(params.lookbackSessions || 8, 3, 20);
    const recent = params.feedbacks.slice(0, lookback);
    const sampleSize = recent.length;

    if (sampleSize === 0) {
        return {
            precisionScore: 65,
            confidence: 0.25,
            achievedTarget: false,
            recommendation: 'Sem dados suficientes para auditar precisão. Coletar mais feedbacks reais.',
            sampleSize: 0,
            signals: {
                meanRpeError: 0,
                meanRirError: 0,
                painRate: 0,
                completionRate: 0,
                rpeVariance: 0
            }
        };
    }

    const expectedRpe = inferExpectedRpe(params.profile.segment);
    const validRpe = recent.map(item => item.rpe).filter((value): value is number => typeof value === 'number');
    const validRir = recent.map(item => item.rir).filter((value): value is number => typeof value === 'number');

    const meanRpe = validRpe.length ? average(validRpe) : expectedRpe;
    const meanRir = validRir.length ? average(validRir) : 2;
    const rpeVariance = validRpe.length > 1 ? stdDev(validRpe) : 0.6;
    const painRate = recent.filter(item => inferPainSignal(item.notes)).length / sampleSize;

    const completionRates = recent.map(item => {
        const expectedSets = Math.max(item.reps_completed?.length || 0, item.sets_completed || 0, 1);
        return clamp((item.sets_completed || 0) / expectedSets, 0, 1);
    });
    const completionRate = average(completionRates);

    const signals: ProgressionPrecisionSignals = {
        meanRpeError: Math.abs(meanRpe - expectedRpe),
        meanRirError: Math.abs(meanRir - 2),
        painRate,
        completionRate,
        rpeVariance
    };

    const precisionPenalty =
        signals.meanRpeError * 13 +
        signals.meanRirError * 15 +
        signals.painRate * 30 +
        Math.max(0, 0.9 - signals.completionRate) * 45 +
        Math.max(0, signals.rpeVariance - params.profile.target.maxRpeVariance) * 8;

    const precisionScore = clamp(Math.round(100 - precisionPenalty), 25, 99);
    const achievedTarget =
        precisionScore >= params.profile.target.targetPrecisionScore &&
        signals.meanRpeError <= params.profile.target.maxMeanRpeError &&
        signals.meanRirError <= params.profile.target.maxMeanRirError &&
        signals.painRate <= params.profile.target.maxPainRate;

    const confidence = Number(clamp(0.35 + sampleSize * 0.07, 0.35, 0.95).toFixed(2));

    return {
        precisionScore,
        confidence,
        achievedTarget,
        recommendation: buildRecommendation(signals, params.profile.target),
        sampleSize,
        signals
    };
}

export function buildPrecisionPromptContext(profile: PrecisionProfileResolution): string {
    return `PRECISION_POLICY: segment=${profile.segment}; label=${profile.label}; target_score>=${profile.target.targetPrecisionScore}; max_rpe_error<=${profile.target.maxMeanRpeError}; max_rir_error<=${profile.target.maxMeanRirError}; max_pain_rate<=${profile.target.maxPainRate}`;
}

export function applyPrecisionGuardrailsToMicrocycle<T extends PrecisionWeekShape>(
    weeks: T[],
    segment: PrecisionProfileSegment
): T[] {
    const guardrailsBySegment: Record<PrecisionProfileSegment, {
        maxPositiveVolume: number;
        maxPositiveIntensity: number;
        minNegativeVolume: number;
        minNegativeIntensity: number;
    }> = {
        novice_rebuild: { maxPositiveVolume: 6, maxPositiveIntensity: 3, minNegativeVolume: -35, minNegativeIntensity: -18 },
        intermediate_progressive: { maxPositiveVolume: 10, maxPositiveIntensity: 5, minNegativeVolume: -30, minNegativeIntensity: -15 },
        advanced_performance: { maxPositiveVolume: 14, maxPositiveIntensity: 7, minNegativeVolume: -26, minNegativeIntensity: -12 },
        longevity_recovery: { maxPositiveVolume: 5, maxPositiveIntensity: 2, minNegativeVolume: -36, minNegativeIntensity: -20 },
        fat_loss_adherence: { maxPositiveVolume: 8, maxPositiveIntensity: 4, minNegativeVolume: -32, minNegativeIntensity: -16 }
    };
    const guard = guardrailsBySegment[segment];

    return weeks.map(week => {
        const guardedVolume = clamp(week.volumeDeltaPct, guard.minNegativeVolume, guard.maxPositiveVolume);
        const guardedIntensity = clamp(week.intensityDeltaPct, guard.minNegativeIntensity, guard.maxPositiveIntensity);
        const changed = guardedVolume !== week.volumeDeltaPct || guardedIntensity !== week.intensityDeltaPct;
        const instruction = changed
            ? `${week.instruction || ''} Guardrail de precisão aplicado ao perfil para reduzir ruído adaptativo.`.trim()
            : week.instruction;

        return {
            ...week,
            volumeDeltaPct: guardedVolume,
            intensityDeltaPct: guardedIntensity,
            instruction
        };
    });
}
