import { getLatestFeedback } from './feedback';
import type { AdaptiveTrainingSignal } from './adaptiveSignalTypes';
import { isSupabaseUuid } from '../supabase/utils/identifiers';
export type { AdaptiveTrainingSignal } from './adaptiveSignalTypes';

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function inferPainSignal(notes?: string): boolean {
    if (!notes) return false;
    const text = notes.toLowerCase();
    return text.includes('dor') || text.includes('pain') || text.includes('les') || text.includes('incômodo') || text.includes('incomodo');
}

function inferFatigueLevel(readinessScore: number): 'low' | 'moderate' | 'high' {
    if (readinessScore < 45) return 'high';
    if (readinessScore < 70) return 'moderate';
    return 'low';
}

function buildBaselineAdaptiveTrainingSignal(currentDaysPerWeek: number): AdaptiveTrainingSignal {
    const safeDays = clamp(currentDaysPerWeek || 4, 2, 6);
    return {
        readinessScore: 65,
        fatigueLevel: 'moderate',
        recommendedVolumeDeltaPct: 0,
        recommendedIntensityDeltaPct: 0,
        recommendedDaysPerWeek: safeDays,
        confidence: 0.25,
        sourceSessions: 0,
        rationale: 'Sem histórico suficiente; mantendo baseline com progressão conservadora.'
    };
}

export async function getAdaptiveTrainingSignal(
    studentId: string,
    currentDaysPerWeek: number
): Promise<AdaptiveTrainingSignal> {
    if (!isSupabaseUuid(studentId)) {
        return buildBaselineAdaptiveTrainingSignal(currentDaysPerWeek);
    }

    const feedbacks = await getLatestFeedback(studentId, 12);

    if (!feedbacks.length) {
        return buildBaselineAdaptiveTrainingSignal(currentDaysPerWeek);
    }

    const safeDays = clamp(currentDaysPerWeek || 4, 2, 6);

    const rpeValues = feedbacks.map(f => f.rpe).filter((v): v is number => typeof v === 'number');
    const rirValues = feedbacks.map(f => f.rir).filter((v): v is number => typeof v === 'number');
    const painHits = feedbacks.filter(f => inferPainSignal(f.notes)).length;

    const avgRpe = rpeValues.length ? rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length : 7;
    const avgRir = rirValues.length ? rirValues.reduce((sum, value) => sum + value, 0) / rirValues.length : 2;

    let fatiguePoints = 0;
    fatiguePoints += clamp((avgRpe - 6.5) * 12, 0, 28);
    fatiguePoints += clamp((2 - avgRir) * 10, 0, 20);
    fatiguePoints += clamp((painHits / Math.max(1, feedbacks.length)) * 30, 0, 30);

    const readinessScore = clamp(Math.round(100 - fatiguePoints), 25, 95);
    const fatigueLevel = inferFatigueLevel(readinessScore);

    let recommendedVolumeDeltaPct = 0;
    let recommendedIntensityDeltaPct = 0;
    let dayDelta = 0;

    if (readinessScore < 45) {
        recommendedVolumeDeltaPct = -20;
        recommendedIntensityDeltaPct = -12;
        dayDelta = -1;
    } else if (readinessScore < 60) {
        recommendedVolumeDeltaPct = -10;
        recommendedIntensityDeltaPct = -6;
    } else if (readinessScore > 82) {
        recommendedVolumeDeltaPct = 8;
        recommendedIntensityDeltaPct = 5;
        dayDelta = 1;
    } else if (readinessScore > 72) {
        recommendedVolumeDeltaPct = 4;
        recommendedIntensityDeltaPct = 2;
    }

    const recommendedDaysPerWeek = clamp(safeDays + dayDelta, 2, 6);
    const confidence = clamp(0.35 + feedbacks.length * 0.05, 0.35, 0.9);

    const rationale = `Readiness ${readinessScore}/100 com base em ${feedbacks.length} sessões (RPE médio ${avgRpe.toFixed(1)}, RIR médio ${avgRir.toFixed(1)}).`;

    return {
        readinessScore,
        fatigueLevel,
        recommendedVolumeDeltaPct,
        recommendedIntensityDeltaPct,
        recommendedDaysPerWeek,
        confidence: Number(confidence.toFixed(2)),
        sourceSessions: feedbacks.length,
        rationale
    };
}
