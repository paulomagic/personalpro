// Feedback Service - Supabase Integration
// Handles session feedback storage and retrieval
// Integrates with adaptive progression system

import { supabase } from '@/lib/supabaseClient';
import type { SessionFeedback, ProgressionHistory } from './types';
import { analyzeSessionFeedback, analyzeTrend, DEFAULT_PROGRESSION_CONFIG } from './adaptiveProgression';
import type { ProgressionAdjustment } from './types';

// ============ SAVE FEEDBACK ============

/**
 * Salva feedback de uma sessão no Supabase
 */
export async function saveSessionFeedback(
    feedback: Omit<SessionFeedback, 'session_date'>
): Promise<{ success: boolean; error?: string; id?: string }> {

    try {
        const { data, error } = await supabase
            .from('workout_session_feedback')
            .insert({
                workout_id: feedback.workout_id,
                student_id: feedback.student_id,
                exercise_id: feedback.exercise_id,
                sets_completed: feedback.sets_completed,
                reps_completed: feedback.reps_completed,
                load_used: feedback.load_used,
                rpe: feedback.rpe,
                rir: feedback.rir,
                notes: feedback.notes
            })
            .select('id')
            .single();

        if (error) {
            console.error('[FeedbackService] Error saving feedback:', error);
            return { success: false, error: error.message };
        }

        console.log('[FeedbackService] Feedback saved successfully:', data.id);
        return { success: true, id: data.id };

    } catch (error: any) {
        console.error('[FeedbackService] Unexpected error:', error);
        return { success: false, error: error.message };
    }
}

// ============ RETRIEVE FEEDBACK ============

/**
 * Busca feedback de um aluno para um exercício específico
 */
export async function getExerciseFeedbackHistory(
    studentId: string,
    exerciseId: string,
    limit: number = 10
): Promise<SessionFeedback[]> {

    try {
        const { data, error } = await supabase
            .from('workout_session_feedback')
            .select('*')
            .eq('student_id', studentId)
            .eq('exercise_id', exerciseId)
            .order('session_date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[FeedbackService] Error fetching history:', error);
            return [];
        }

        return data as SessionFeedback[];

    } catch (error) {
        console.error('[FeedbackService] Unexpected error:', error);
        return [];
    }
}

/**
 * Busca último feedback de um aluno
 */
export async function getLatestFeedback(
    studentId: string,
    limit: number = 10
): Promise<SessionFeedback[]> {

    try {
        const { data, error } = await supabase
            .from('workout_session_feedback')
            .select('*')
            .eq('student_id', studentId)
            .order('session_date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[FeedbackService] Error fetching latest:', error);
            return [];
        }

        return data as SessionFeedback[];

    } catch (error) {
        console.error('[FeedbackService] Unexpected error:', error);
        return [];
    }
}

// ============ PROGRESSION ANALYSIS ============

/**
 * Analisa feedback e retorna sugestão de ajuste de carga
 */
export async function getProgressionSuggestion(
    studentId: string,
    exerciseId: string
): Promise<ProgressionAdjustment | null> {

    try {
        // Buscar último feedback
        const feedbacks = await getExerciseFeedbackHistory(studentId, exerciseId, 1);

        if (feedbacks.length === 0) {
            console.log('[FeedbackService] No feedback found for progression analysis');
            return null;
        }

        const latestFeedback = feedbacks[0];

        // Analisar e retornar sugestão
        const adjustment = analyzeSessionFeedback(latestFeedback, DEFAULT_PROGRESSION_CONFIG);

        console.log('[FeedbackService] Progression suggestion:', adjustment);
        return adjustment;

    } catch (error) {
        console.error('[FeedbackService] Error analyzing progression:', error);
        return null;
    }
}

/**
 * Analisa tendência de progresso para um exercício
 */
export async function getProgressionTrend(
    studentId: string,
    exerciseId: string,
    sessionsCount: number = 5
): Promise<{
    trend: 'improving' | 'plateauing' | 'regressing';
    suggestion: string;
    confidence: number;
} | null> {

    try {
        const feedbacks = await getExerciseFeedbackHistory(studentId, exerciseId, sessionsCount);

        if (feedbacks.length < 3) {
            return {
                trend: 'plateauing',
                suggestion: 'Dados insuficientes para análise de tendência (mínimo 3 sessões)',
                confidence: 0.3
            };
        }

        const trend = analyzeTrend(feedbacks, DEFAULT_PROGRESSION_CONFIG);

        console.log('[FeedbackService] Trend analysis:', trend);
        return trend;

    } catch (error) {
        console.error('[FeedbackService] Error analyzing trend:', error);
        return null;
    }
}

/**
 * Busca estatísticas de RIR médio por exercício
 */
export async function getAverageRIRByExercise(
    studentId: string
): Promise<Array<{ exercise_id: string; avg_rir: number; sessions: number }>> {

    try {
        const { data, error } = await supabase
            .rpc('get_average_rir_by_exercise', { p_student_id: studentId });

        if (error) {
            console.error('[FeedbackService] Error fetching RIR stats:', error);
            return [];
        }

        return data || [];

    } catch (error) {
        console.error('[FeedbackService] Unexpected error:', error);
        return [];
    }
}

// ============ EXPORTS ============

export {
    type SessionFeedback,
    type ProgressionAdjustment,
    type ProgressionHistory
} from './types';
