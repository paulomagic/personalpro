// Feedback Service - Supabase Integration
// Handles session feedback storage and retrieval
// Integrates with adaptive progression system

import { supabase } from '../../supabaseClient';
import type { SessionFeedback, ProgressionHistory } from './types';
import { analyzeSessionFeedback, analyzeTrend, DEFAULT_PROGRESSION_CONFIG } from './adaptiveProgression';
import type { ProgressionAdjustment } from './types';
import { logAIAction } from '../../loggingService';
import { buildProgressionPrecisionReport, resolvePrecisionProfile } from '../progressionPrecisionService';

const isDev = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
    if (isDev) console.log(...args);
};

const FEEDBACK_QUEUE_STORAGE_KEY = 'personalpro_feedback_queue_v1';
const PRECISION_TELEMETRY_LAST_RUN_KEY = 'personalpro_precision_telemetry_last_run_v1';
const PRECISION_TELEMETRY_MIN_INTERVAL_MS = 4 * 60 * 1000;
const MAX_QUEUED_FEEDBACK_ITEMS = 80;
const FEEDBACK_QUEUE_RETENTION_MS = 10 * 24 * 60 * 60 * 1000;
const MAX_QUEUE_ATTEMPTS = 8;
const MAX_FEEDBACK_NOTE_LENGTH = 500;

interface QueuedFeedbackItem {
    id: string;
    feedback: Omit<SessionFeedback, 'session_date'>;
    attempts: number;
    queuedAt: string;
    lastError?: string;
}

function sanitizeFeedbackForQueue(
    feedback: Omit<SessionFeedback, 'session_date'>
): Omit<SessionFeedback, 'session_date'> {
    return {
        ...feedback,
        notes: feedback.notes ? feedback.notes.slice(0, MAX_FEEDBACK_NOTE_LENGTH) : feedback.notes
    };
}

function pruneQueuedFeedbackItems(items: QueuedFeedbackItem[]): QueuedFeedbackItem[] {
    const now = Date.now();
    const filtered = items.filter((item) => {
        const queuedAtMs = new Date(item.queuedAt).getTime();
        const isFresh = Number.isFinite(queuedAtMs) && (now - queuedAtMs) <= FEEDBACK_QUEUE_RETENTION_MS;
        const underAttempts = (item.attempts || 0) < MAX_QUEUE_ATTEMPTS;
        return isFresh && underAttempts;
    });

    if (filtered.length <= MAX_QUEUED_FEEDBACK_ITEMS) return filtered;
    return filtered.slice(-MAX_QUEUED_FEEDBACK_ITEMS);
}

function canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function shouldCapturePrecisionTelemetry(studentId: string): boolean {
    if (!canUseStorage()) return true;
    try {
        const raw = window.localStorage.getItem(PRECISION_TELEMETRY_LAST_RUN_KEY);
        const parsed = raw ? JSON.parse(raw) as Record<string, number> : {};
        const now = Date.now();
        const lastRun = parsed[studentId] || 0;
        if (now - lastRun < PRECISION_TELEMETRY_MIN_INTERVAL_MS) {
            return false;
        }
        parsed[studentId] = now;
        window.localStorage.setItem(PRECISION_TELEMETRY_LAST_RUN_KEY, JSON.stringify(parsed));
        return true;
    } catch {
        return true;
    }
}

async function captureProgressionPrecisionTelemetry(studentId: string): Promise<void> {
    if (!studentId || studentId === 'unknown' || !supabase) return;
    if (!shouldCapturePrecisionTelemetry(studentId)) return;

    const startedAt = Date.now();

    try {
        const [feedbacks, clientSnapshotResult] = await Promise.all([
            getLatestFeedback(studentId, 12),
            supabase
                .from('clients')
                .select('goal, level, age, adherence, status')
                .eq('id', studentId)
                .maybeSingle()
        ]);

        if (!feedbacks.length) return;

        const clientSnapshot = clientSnapshotResult?.data;
        const profile = resolvePrecisionProfile({
            level: clientSnapshot?.level,
            goal: clientSnapshot?.goal,
            age: clientSnapshot?.age,
            adherence: clientSnapshot?.adherence,
            status: clientSnapshot?.status
        });
        const report = buildProgressionPrecisionReport({
            feedbacks,
            profile
        });

        await logAIAction({
            action_type: 'analyze_progress',
            model_used: 'progression_precision_v1',
            prompt: `student:${studentId};segment:${profile.segment};sample:${report.sampleSize}`,
            response: `precision=${report.precisionScore};target=${profile.target.targetPrecisionScore};achieved=${report.achievedTarget}`,
            tokens_input: 0,
            tokens_output: 0,
            latency_ms: Date.now() - startedAt,
            success: true,
            metadata: {
                studentId,
                profileSegment: profile.segment,
                profileLabel: profile.label,
                target: profile.target,
                report
            }
        });
    } catch (error: any) {
        console.warn('[FeedbackService] Precision telemetry failed:', error);
        await logAIAction({
            action_type: 'analyze_progress',
            model_used: 'progression_precision_v1',
            prompt: `student:${studentId};telemetry_error`,
            response: null,
            tokens_input: 0,
            tokens_output: 0,
            latency_ms: Date.now() - startedAt,
            success: false,
            error_message: error?.message || 'precision_telemetry_failed'
        });
    }
}

function readFeedbackQueue(): QueuedFeedbackItem[] {
    if (!canUseStorage()) return [];
    try {
        const raw = window.localStorage.getItem(FEEDBACK_QUEUE_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const queue = Array.isArray(parsed) ? parsed : [];
        const pruned = pruneQueuedFeedbackItems(queue);
        if (pruned.length !== queue.length) {
            writeFeedbackQueue(pruned);
        }
        return pruned;
    } catch (error) {
        console.warn('[FeedbackService] Failed to read feedback queue:', error);
        return [];
    }
}

function writeFeedbackQueue(items: QueuedFeedbackItem[]): boolean {
    if (!canUseStorage()) return false;
    try {
        const pruned = pruneQueuedFeedbackItems(items);
        window.localStorage.setItem(FEEDBACK_QUEUE_STORAGE_KEY, JSON.stringify(pruned));
        return true;
    } catch (error) {
        console.warn('[FeedbackService] Failed to write feedback queue:', error);
        return false;
    }
}

function pushFeedbackToQueue(
    feedback: Omit<SessionFeedback, 'session_date'>,
    errorMessage?: string
): { queued: boolean; queueSize: number } {
    const queue = readFeedbackQueue();
    queue.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        feedback: sanitizeFeedbackForQueue(feedback),
        attempts: 0,
        queuedAt: new Date().toISOString(),
        lastError: errorMessage
    });
    const normalizedQueue = pruneQueuedFeedbackItems(queue);
    const queued = writeFeedbackQueue(normalizedQueue);
    return {
        queued,
        queueSize: normalizedQueue.length
    };
}

let flushScheduled = false;
function scheduleQueuedFeedbackFlush(delayMs = 5000): void {
    if (flushScheduled || typeof window === 'undefined') return;
    flushScheduled = true;
    window.setTimeout(async () => {
        try {
            await flushQueuedFeedback();
        } finally {
            flushScheduled = false;
        }
    }, delayMs);
}

export async function flushQueuedFeedback(maxItems = 20): Promise<{
    processed: number;
    success: number;
    failed: number;
    remaining: number;
}> {
    const queue = readFeedbackQueue();
    if (queue.length === 0) {
        return { processed: 0, success: 0, failed: 0, remaining: 0 };
    }

    if (!supabase) {
        return { processed: 0, success: 0, failed: 0, remaining: queue.length };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { processed: 0, success: 0, failed: 0, remaining: queue.length };
    }

    const processed = queue.slice(0, maxItems);
    const kept: QueuedFeedbackItem[] = queue.slice(maxItems);

    let success = 0;
    let failed = 0;

    for (const item of processed) {
        const result = await saveSessionFeedback(item.feedback);
        if (result.success) {
            success++;
            continue;
        }

        failed++;
        if ((item.attempts || 0) + 1 >= MAX_QUEUE_ATTEMPTS) {
            continue;
        }
        kept.push({
            ...item,
            attempts: item.attempts + 1,
            lastError: result.error || item.lastError
        });
    }

    writeFeedbackQueue(kept);

    if (kept.length > 0) {
        scheduleQueuedFeedbackFlush(15000);
    }

    return {
        processed: processed.length,
        success,
        failed,
        remaining: kept.length
    };
}

// ============ SAVE FEEDBACK ============

/**
 * Salva feedback de uma sessão no Supabase
 */
export async function saveSessionFeedback(
    feedback: Omit<SessionFeedback, 'session_date'>
): Promise<{ success: boolean; error?: string; id?: string }> {

    if (!supabase) {
        return { success: false, error: 'Supabase indisponível' };
    }

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

        debugLog('[FeedbackService] Feedback saved successfully:', data.id);
        void captureProgressionPrecisionTelemetry(feedback.student_id);
        return { success: true, id: data.id };

    } catch (error: any) {
        console.error('[FeedbackService] Unexpected error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Salva feedback com estratégia resiliente (queue local + retry)
 */
export async function saveSessionFeedbackWithRetry(
    feedback: Omit<SessionFeedback, 'session_date'>
): Promise<{ success: boolean; error?: string; id?: string; queued?: boolean; queueSize?: number }> {
    const online = typeof navigator === 'undefined' ? true : navigator.onLine;

    if (!online || !supabase) {
        const queueResult = pushFeedbackToQueue(feedback, !supabase ? 'Supabase indisponível' : 'Offline');
        return queueResult.queued
            ? { success: true, queued: true, queueSize: queueResult.queueSize }
            : { success: false, error: 'Falha ao enfileirar feedback offline' };
    }

    const result = await saveSessionFeedback(feedback);
    if (result.success) {
        void flushQueuedFeedback();
        return result;
    }

    const queueResult = pushFeedbackToQueue(feedback, result.error);
    if (queueResult.queued) {
        scheduleQueuedFeedbackFlush();
        return {
            success: true,
            queued: true,
            queueSize: queueResult.queueSize
        };
    }

    return result;
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
            debugLog('[FeedbackService] No feedback found for progression analysis');
            return null;
        }

        const latestFeedback = feedbacks[0];

        // Analisar e retornar sugestão
        const adjustment = analyzeSessionFeedback(latestFeedback, DEFAULT_PROGRESSION_CONFIG);

        debugLog('[FeedbackService] Progression suggestion:', adjustment);
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

        debugLog('[FeedbackService] Trend analysis:', trend);
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
