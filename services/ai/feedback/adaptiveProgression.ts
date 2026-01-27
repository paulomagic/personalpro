// Adaptive Progression - Análise de Feedback e Ajuste Automático
// Implementa lógica de progressão baseada em RPE/RIR pós-sessão
// Fontes: Mike Tuchscherer (RTS), Renaissance Periodization

import type {
    SessionFeedback,
    ProgressionAdjustment,
    ProgressionConfig,
    DEFAULT_PROGRESSION_CONFIG,
    AdjustmentReason
} from './types';

// ============ ANÁLISE DE FEEDBACK ============

/**
 * Analisa feedback de uma sessão e sugere ajuste de carga
 * Baseado em RIR (Reps in Reserve) e completude das séries
 */
export function analyzeSessionFeedback(
    feedback: SessionFeedback,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
): ProgressionAdjustment {

    const { target_rir, rir_tolerance, load_increase_percent, load_decrease_percent, min_reps_for_increase } = config;

    // ============ REGRA 1: RIR MUITO BAIXO (Muito Difícil) ============
    // Se RIR < alvo - tolerância → Reduzir carga
    if (feedback.rir !== undefined && feedback.rir < target_rir - rir_tolerance) {
        const reduction = load_decrease_percent / 100;
        const suggestedLoad = Math.round(feedback.load_used * (1 - reduction) * 4) / 4; // Arredonda para 0.25kg

        return {
            exercise_id: feedback.exercise_id,
            current_load: feedback.load_used,
            suggested_load: suggestedLoad,
            load_change_percent: -load_decrease_percent,
            adjustment_reason: 'too_hard',
            confidence: 0.9,
            notes: `RIR ${feedback.rir} está abaixo do alvo ${target_rir}. Reduzindo carga para recuperação.`
        };
    }

    // ============ REGRA 2: RIR MUITO ALTO (Muito Fácil) ============
    // Se RIR > alvo + tolerância E completou todas as reps → Aumentar carga
    if (feedback.rir !== undefined && feedback.rir > target_rir + rir_tolerance) {
        const allSetsCompleted = feedback.reps_completed.every(r => r >= min_reps_for_increase);

        if (allSetsCompleted) {
            const increase = load_increase_percent / 100;
            const suggestedLoad = Math.round(feedback.load_used * (1 + increase) * 4) / 4; // Arredonda para 0.25kg

            return {
                exercise_id: feedback.exercise_id,
                current_load: feedback.load_used,
                suggested_load: suggestedLoad,
                load_change_percent: load_increase_percent,
                adjustment_reason: 'too_easy',
                confidence: 0.95,
                notes: `RIR ${feedback.rir} está acima do alvo ${target_rir} e todas as séries foram completadas. Aumentando carga.`
            };
        } else {
            // RIR alto mas não completou todas as reps → Manter carga, aumentar reps
            return {
                exercise_id: feedback.exercise_id,
                current_load: feedback.load_used,
                suggested_load: feedback.load_used,
                load_change_percent: 0,
                adjustment_reason: 'increase_reps',
                confidence: 0.85,
                notes: `RIR ${feedback.rir} está alto, mas nem todas as séries foram completadas. Mantenha a carga e tente completar mais reps.`
            };
        }
    }

    // ============ REGRA 3: OPTIMAL (No Alvo) ============
    // RIR dentro da tolerância → Manter carga, progressão de reps
    return {
        exercise_id: feedback.exercise_id,
        current_load: feedback.load_used,
        suggested_load: feedback.load_used,
        load_change_percent: 0,
        adjustment_reason: 'optimal',
        confidence: 1.0,
        notes: `RIR ${feedback.rir || 'N/A'} está no alvo. Continue com a mesma carga e tente aumentar reps gradualmente.`
    };
}

/**
 * Analisa múltiplas sessões e detecta tendências
 * Útil para ajustes de longo prazo
 */
export function analyzeTrend(
    feedbacks: SessionFeedback[],
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
): {
    trend: 'improving' | 'plateauing' | 'regressing';
    suggestion: string;
    confidence: number;
} {

    if (feedbacks.length < 3) {
        return {
            trend: 'plateauing',
            suggestion: 'Dados insuficientes para análise de tendência (mínimo 3 sessões)',
            confidence: 0.3
        };
    }

    // Ordenar por data
    const sorted = [...feedbacks].sort((a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );

    // Calcular volume total (sets × reps médias) para cada sessão
    const volumes = sorted.map(f => {
        const avgReps = f.reps_completed.reduce((a, b) => a + b, 0) / f.reps_completed.length;
        return f.sets_completed * avgReps;
    });

    // Detectar tendência
    const firstHalf = volumes.slice(0, Math.floor(volumes.length / 2));
    const secondHalf = volumes.slice(Math.floor(volumes.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const improvement = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (improvement > 5) {
        return {
            trend: 'improving',
            suggestion: 'Progresso consistente! Continue com a estratégia atual.',
            confidence: 0.85
        };
    } else if (improvement < -5) {
        return {
            trend: 'regressing',
            suggestion: 'Volume está diminuindo. Considere deload ou verificar recuperação.',
            confidence: 0.8
        };
    } else {
        return {
            trend: 'plateauing',
            suggestion: 'Progresso estagnado. Considere variar estímulo (rep range, tempo sob tensão, etc.)',
            confidence: 0.75
        };
    }
}

/**
 * Calcula carga sugerida baseada em RPE (Rating of Perceived Exertion)
 * Alternativa quando RIR não está disponível
 */
export function calculateLoadFromRPE(
    currentLoad: number,
    currentRPE: number,
    targetRPE: number = 8
): ProgressionAdjustment {

    // Tabela de conversão RPE → % ajuste
    // RPE 10 = Máximo esforço
    // RPE 8 = 2 reps em reserva (ideal para hipertrofia)
    // RPE 6 = 4 reps em reserva (muito fácil)

    const rpeDiff = currentRPE - targetRPE;

    if (rpeDiff > 1) {
        // RPE muito alto → Reduzir 5%
        return {
            exercise_id: '',
            current_load: currentLoad,
            suggested_load: Math.round(currentLoad * 0.95 * 4) / 4,
            load_change_percent: -5,
            adjustment_reason: 'too_hard',
            confidence: 0.8,
            notes: `RPE ${currentRPE} está acima do alvo ${targetRPE}`
        };
    } else if (rpeDiff < -1) {
        // RPE muito baixo → Aumentar 2.5%
        return {
            exercise_id: '',
            current_load: currentLoad,
            suggested_load: Math.round(currentLoad * 1.025 * 4) / 4,
            load_change_percent: 2.5,
            adjustment_reason: 'too_easy',
            confidence: 0.8,
            notes: `RPE ${currentRPE} está abaixo do alvo ${targetRPE}`
        };
    } else {
        // RPE no alvo
        return {
            exercise_id: '',
            current_load: currentLoad,
            suggested_load: currentLoad,
            load_change_percent: 0,
            adjustment_reason: 'optimal',
            confidence: 0.9,
            notes: `RPE ${currentRPE} está no alvo`
        };
    }
}

// ============ EXPORTS ============

export { DEFAULT_PROGRESSION_CONFIG } from './types';
