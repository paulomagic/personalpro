import { supabase } from './supabaseCore';
import { getBrowserSummary } from '../utils/browserInfo';

const isDev = typeof window !== 'undefined'
    && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// ============================================
// AI Logging Service
// ============================================

export interface AILogEntry {
    action_type: 'generate_workout' | 'generate_workout_intention' | 'training_intent' | 'refine' | 'regenerate_exercise' | 'insight' | 'message' | 'message_template' | 'analyze_progress';
    provider_used?: string;
    model_used?: string;
    model_name?: string;
    prompt: string;
    response: string | null;
    tokens_input?: number;
    tokens_output?: number;
    latency_ms: number;
    success: boolean;
    schema_valid?: boolean;
    rejection_reason?: string;
    fallback_used?: boolean;
    fallback_provider?: string;
    error_message?: string;
    metadata?: Record<string, any>;
}

export interface ActivityLogEntry {
    action: string;
    resource_type?: string;
    resource_id?: string;
    metadata?: Record<string, any>;
}

export interface FrontendErrorLogEntry {
    type: 'runtime_error' | 'promise_rejection' | 'react_error_boundary';
    message: string;
    stack?: string;
    source?: string;
    line?: number;
    column?: number;
    componentStack?: string;
    metadata?: Record<string, any>;
}

export function redactSensitiveText(value?: string | null): string | null {
    if (!value) return null;

    return value
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
        .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, '[REDACTED_PHONE]')
        .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[REDACTED_CPF]')
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[REDACTED_UUID]')
        .replace(/\b(?:nome|name|cliente|aluno)\s*[:=]\s*([^\n,;]+)/gi, '[REDACTED_PERSON]')
        .replace(/\bclient(?:_id)?\s*[:=]\s*([^\n,;]+)/gi, 'client:[REDACTED_ID]')
        .slice(0, 2000);
}

function sanitizeLogValue(value: unknown, depth = 0): unknown {
    if (value == null) return value;
    if (depth > 3) return '[TRUNCATED_DEPTH]';
    if (typeof value === 'string') return redactSensitiveText(value);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (value instanceof Error) {
        return {
            name: value.name,
            message: redactSensitiveText(value.message),
            stack: redactSensitiveText(value.stack)
        };
    }
    if (Array.isArray(value)) {
        return value.slice(0, 20).map((item) => sanitizeLogValue(item, depth + 1));
    }
    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).slice(0, 30).map(([key, entryValue]) => [
                key,
                sanitizeLogValue(entryValue, depth + 1)
            ])
        );
    }
    return String(value);
}

export function sanitizeLogMetadata(metadata?: Record<string, unknown> | null): Record<string, unknown> | undefined {
    if (!metadata) return undefined;
    return sanitizeLogValue(metadata) as Record<string, unknown>;
}

type AppLogLevel = 'debug' | 'info' | 'warn' | 'error';

function emitConsole(level: AppLogLevel, scope: string, message: string, metadata?: Record<string, unknown>) {
    if (level === 'debug' && !isDev) return;
    const prefix = `[${scope}] ${message}`;
    const payload = sanitizeLogMetadata(metadata);

    if (level === 'debug') {
        console.debug(prefix, payload ?? '');
        return;
    }
    if (level === 'info') {
        if (isDev) console.info(prefix, payload ?? '');
        return;
    }
    if (level === 'warn') {
        console.warn(prefix, payload ?? '');
        return;
    }
    console.error(prefix, payload ?? '');
}

export function createScopedLogger(scope: string, baseMetadata?: Record<string, unknown>) {
    const withBase = (metadata?: Record<string, unknown>) => ({
        ...(baseMetadata || {}),
        ...(metadata || {})
    });

    return {
        debug(message: string, metadata?: Record<string, unknown>) {
            emitConsole('debug', scope, message, withBase(metadata));
        },
        info(message: string, metadata?: Record<string, unknown>) {
            emitConsole('info', scope, message, withBase(metadata));
        },
        warn(message: string, metadata?: Record<string, unknown>) {
            const merged = withBase(metadata);
            emitConsole('warn', scope, message, merged);
            void logActivity({
                action: `app_warn:${scope}`,
                resource_type: 'app_log',
                metadata: {
                    message,
                    level: 'warn',
                    ...sanitizeLogMetadata(merged)
                }
            });
        },
        error(message: string, error?: unknown, metadata?: Record<string, unknown>) {
            const normalizedError = error == null
                ? null
                : error instanceof Error
                    ? error
                    : new Error(typeof error === 'string' ? error : 'unknown_error');
            const merged = withBase({
                ...metadata,
                error_name: normalizedError?.name
            });

            emitConsole('error', scope, message, {
                ...merged,
                error_message: normalizedError?.message
            });

            void logFrontendError({
                type: 'runtime_error',
                message: normalizedError ? `[${scope}] ${message}: ${normalizedError.message}` : `[${scope}] ${message}`,
                stack: normalizedError?.stack,
                metadata: sanitizeLogMetadata(merged)
            });
        }
    };
}

// Log AI action with full details
export async function logAIAction(entry: AILogEntry): Promise<void> {
    try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('ai_logs').insert({
            user_id: user?.id,
            action_type: entry.action_type,
            provider_used: entry.provider_used || 'app',
            model_used: entry.model_used || entry.model_name || 'unknown',
            prompt: redactSensitiveText(entry.prompt),
            response: redactSensitiveText(entry.response),
            tokens_input: entry.tokens_input,
            tokens_output: entry.tokens_output,
            latency_ms: entry.latency_ms,
            success: entry.success,
            error_message: redactSensitiveText(entry.error_message),
            metadata: sanitizeLogMetadata({
                schema_valid: entry.schema_valid,
                rejection_reason: entry.rejection_reason,
                fallback_used: entry.fallback_used,
                fallback_provider: entry.fallback_provider,
                ...entry.metadata
            })
        });

        if (error) {
            emitConsole('warn', 'logging-service', 'Failed to log AI action', { error_message: error.message });
        }
    } catch (e) {
        emitConsole('warn', 'logging-service', 'Error in logAIAction', { error: e });
    }
}

// Log user activity
export async function logActivity(entry: ActivityLogEntry): Promise<void> {
    try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('activity_logs').insert({
            user_id: user?.id,
            action: entry.action,
            resource_type: entry.resource_type,
            resource_id: entry.resource_id,
            user_agent: getBrowserSummary(),
            metadata: sanitizeLogMetadata(entry.metadata)
        });

        if (error) {
            emitConsole('warn', 'logging-service', 'Failed to log activity', { error_message: error.message });
        }
    } catch (e) {
        emitConsole('warn', 'logging-service', 'Error in logActivity', { error: e });
    }
}

export async function logFrontendError(entry: FrontendErrorLogEntry): Promise<void> {
    await logActivity({
        action: `frontend_error:${entry.type}`,
        resource_type: 'frontend',
        metadata: {
            message: redactSensitiveText(entry.message),
            stack: redactSensitiveText(entry.stack),
            source: entry.source,
            line: entry.line,
            column: entry.column,
            componentStack: redactSensitiveText(entry.componentStack),
            ...entry.metadata
        }
    });
}

export async function logFunnelEvent(
    stage: string,
    metadata?: Record<string, any>
): Promise<void> {
    await logActivity({
        action: `funnel:${stage}`,
        resource_type: 'funnel',
        metadata
    });
}

// ============================================
// Admin Data Fetching
// ============================================

export interface AILogFilters {
    startDate?: string;
    endDate?: string;
    actionType?: string;
    success?: boolean;
    limit?: number;
    offset?: number;
}

export interface AIUsageByUser {
    user_id: string | null;
    total_requests: number;
    successful_requests: number;
    success_rate: number;
    total_tokens: number;
    avg_latency_ms: number | null;
    last_request_at: string | null;
}


export async function getAILogs(filters: AILogFilters = {}) {
    let query = supabase
        .from('ai_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
    }
    if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
    }
    if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
    }

    query = query.range(
        filters.offset || 0,
        (filters.offset || 0) + (filters.limit || 50) - 1
    );

    const { data, error, count } = await query;

    if (error) {
        emitConsole('error', 'logging-service', 'Error fetching AI logs', { error_message: error.message });
        return { logs: [], total: 0 };
    }

    return { logs: data || [], total: count || 0 };
}

export async function getActivityLogs(filters: AILogFilters = {}) {
    let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
    }
    if (filters.actionType) {
        query = query.eq('action', filters.actionType);
    }

    query = query.range(
        filters.offset || 0,
        (filters.offset || 0) + (filters.limit || 50) - 1
    );

    const { data, error, count } = await query;

    if (error) {
        emitConsole('error', 'logging-service', 'Error fetching activity logs', { error_message: error.message });
        return { logs: [], total: 0 };
    }

    return { logs: data || [], total: count || 0 };
}

// ============================================
// Admin Metrics
// ============================================

interface ProductFunnelLogRow {
    user_id: string | null;
    action: string;
    metadata?: Record<string, any> | null;
    created_at: string;
}

function extractEntityId(metadata?: Record<string, any> | null): string {
    if (!metadata || typeof metadata !== 'object') return 'unknown';
    const value = metadata.clientId ?? metadata.studentId ?? metadata.workoutId ?? metadata.coachId;
    return value == null ? 'unknown' : String(value);
}

function percentileFromSorted(values: number[], quantile: number): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];
    const position = Math.min(values.length - 1, Math.max(0, (values.length - 1) * quantile));
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) return values[lower];
    const weight = position - lower;
    return Math.round(values[lower] + (values[upper] - values[lower]) * weight);
}

export async function getAIMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const oneDayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Total logs
    const { count: totalLogs } = await supabase
        .from('ai_logs')
        .select('*', { count: 'exact', head: true });

    // Today's logs
    const { count: todayLogs } = await supabase
        .from('ai_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

    // Success rate
    const { count: successLogs } = await supabase
        .from('ai_logs')
        .select('*', { count: 'exact', head: true })
        .eq('success', true);

    // Errors today
    const { count: errorsToday } = await supabase
        .from('ai_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)
        .eq('success', false);

    // By model
    const { data: byModel } = await supabase
        .from('ai_logs')
        .select('model_used')
        .gte('created_at', weekAgo);

    const modelCounts: Record<string, number> = {};
    byModel?.forEach(log => {
        modelCounts[log.model_used] = (modelCounts[log.model_used] || 0) + 1;
    });

    // By action type with success/error breakdown
    const { data: actionData } = await supabase
        .from('ai_logs')
        .select('action_type, success, latency_ms')
        .gte('created_at', weekAgo);

    const actionCounts: Record<string, number> = {};
    const successByAction: Record<string, { success: number; total: number }> = {};
    const latencyByAction: Record<string, { total: number; count: number }> = {};

    actionData?.forEach(log => {
        const action = log.action_type;
        actionCounts[action] = (actionCounts[action] || 0) + 1;

        // Success rate by action
        if (!successByAction[action]) {
            successByAction[action] = { success: 0, total: 0 };
        }
        successByAction[action].total++;
        if (log.success) successByAction[action].success++;

        // Latency by action
        if (log.latency_ms) {
            if (!latencyByAction[action]) {
                latencyByAction[action] = { total: 0, count: 0 };
            }
            latencyByAction[action].total += log.latency_ms;
            latencyByAction[action].count++;
        }
    });

    // Calculate success rate per action
    const successRateByAction: Record<string, number> = {};
    Object.entries(successByAction).forEach(([action, data]) => {
        successRateByAction[action] = Math.round((data.success / data.total) * 100);
    });

    // Calculate average latency per action
    const avgLatencyByAction: Record<string, number> = {};
    Object.entries(latencyByAction).forEach(([action, data]) => {
        avgLatencyByAction[action] = Math.round(data.total / data.count);
    });

    // Recent errors (last 10)
    const { data: recentErrors } = await supabase
        .from('ai_logs')
        .select('action_type, error_message, created_at, model_used')
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(10);

    // Requests per day (last 7 days)
    const { data: dailyData } = await supabase
        .from('ai_logs')
        .select('created_at, success')
        .gte('created_at', weekAgo);

    const requestsByDay: Record<string, { total: number; success: number }> = {};
    dailyData?.forEach(log => {
        const day = log.created_at.split('T')[0];
        if (!requestsByDay[day]) {
            requestsByDay[day] = { total: 0, success: 0 };
        }
        requestsByDay[day].total++;
        if (log.success) requestsByDay[day].success++;
    });

    // Provider health (used to detect incidents like "Groq stopped being used")
    const { data: providerData } = await supabase
        .from('ai_logs')
        .select('provider_used, action_type, success, created_at, error_message')
        .gte('created_at', weekAgo);

    const trainingActions = new Set([
        'training_intent',
        'generate_workout',
        'generate_workout_intention',
        'regenerate_exercise',
        'refine'
    ]);
    const providerStats: Record<string, {
        total: number;
        success: number;
        total24h: number;
        success24h: number;
        rateLimited24h: number;
        lastSuccessAt: string | null;
    }> = {};

    let workoutActions24h = 0;
    let groqSuccess24h = 0;
    let lastGroqSuccessAt: string | null = null;

    providerData?.forEach((row: any) => {
        const provider = String(row.provider_used || 'none');
        if (!providerStats[provider]) {
            providerStats[provider] = {
                total: 0,
                success: 0,
                total24h: 0,
                success24h: 0,
                rateLimited24h: 0,
                lastSuccessAt: null
            };
        }

        const stats = providerStats[provider];
        stats.total += 1;
        if (row.success) {
            stats.success += 1;
            if (!stats.lastSuccessAt || row.created_at > stats.lastSuccessAt) {
                stats.lastSuccessAt = row.created_at;
            }
        }

        const isLast24h = row.created_at >= oneDayAgoIso;
        if (isLast24h) {
            stats.total24h += 1;
            if (row.success) {
                stats.success24h += 1;
            }
            if (String(row.error_message || '').includes('429')) {
                stats.rateLimited24h += 1;
            }
        }

        if (provider === 'groq' && row.success) {
            if (!lastGroqSuccessAt || row.created_at > lastGroqSuccessAt) {
                lastGroqSuccessAt = row.created_at;
            }
            if (isLast24h) {
                groqSuccess24h += 1;
            }
        }

        if (isLast24h && trainingActions.has(String(row.action_type || ''))) {
            workoutActions24h += 1;
        }
    });

    let providerHealthStatus: 'ok' | 'warning' | 'critical' = 'ok';
    let providerHealthReason = 'Providers operando normalmente.';
    if (workoutActions24h >= 20 && groqSuccess24h === 0) {
        providerHealthStatus = 'critical';
        providerHealthReason = 'Treinos IA ativos sem sucesso no Groq nas últimas 24h.';
    } else if (workoutActions24h >= 5 && groqSuccess24h === 0) {
        providerHealthStatus = 'warning';
        providerHealthReason = 'Baixo/no sucesso no Groq com geração de treino em andamento.';
    }

    // Total tokens used & Breakdown by action
    const { data: tokenData } = await supabase
        .from('ai_logs')
        .select('action_type, provider_used, model_used, tokens_input, tokens_output, created_at, success, latency_ms');

    let totalTokensInput = 0;
    let totalTokensOutput = 0;
    const tokensByAction: Record<string, number> = {};

    tokenData?.forEach((log: any) => {
        const input = log.tokens_input || 0;
        const output = log.tokens_output || 0;
        const total = input + output;

        totalTokensInput += input;
        totalTokensOutput += output;

        tokensByAction[log.action_type] = (tokensByAction[log.action_type] || 0) + total;
    });

    // Tokens do dia
    const { data: todayTokenData } = await supabase
        .from('ai_logs')
        .select('tokens_input, tokens_output')
        .gte('created_at', today);

    let todayTokensInput = 0;
    let todayTokensOutput = 0;

    todayTokenData?.forEach(log => {
        todayTokensInput += log.tokens_input || 0;
        todayTokensOutput += log.tokens_output || 0;
    });

    // Overall average latency
    const { data: allLatency } = await supabase
        .from('ai_logs')
        .select('latency_ms')
        .not('latency_ms', 'is', null);

    let avgLatency = 0;
    if (allLatency && allLatency.length > 0) {
        const totalLatency = allLatency.reduce((sum, log) => sum + (log.latency_ms || 0), 0);
        avgLatency = Math.round(totalLatency / allLatency.length);
    }

    // AI generation feedback (thumbs up/down captured as ai_logs metadata)
    const { data: aiFeedbackLogs } = await supabase
        .from('ai_logs')
        .select('metadata, created_at')
        .eq('model_used', 'feedback')
        .gte('created_at', weekAgo);

    let feedbackPositive = 0;
    let feedbackNegative = 0;
    aiFeedbackLogs?.forEach((log: any) => {
        const feedback = log?.metadata?.feedback;
        if (feedback === 'positive') feedbackPositive++;
        if (feedback === 'negative') feedbackNegative++;
    });
    const feedbackTotal = feedbackPositive + feedbackNegative;
    const feedbackApprovalRate = feedbackTotal > 0
        ? Math.round((feedbackPositive / feedbackTotal) * 100)
        : 0;

    // Progression precision telemetry (captured from real session feedback loop)
    const { data: precisionLogs } = await supabase
        .from('ai_logs')
        .select('metadata, created_at')
        .eq('model_used', 'progression_precision_v1')
        .gte('created_at', weekAgo);

    const precisionScores: number[] = [];
    const precisionConfidence: number[] = [];
    let precisionTargetHit = 0;
    const precisionBySegment: Record<string, { total: number; hit: number; sumScore: number }> = {};

    precisionLogs?.forEach((log: any) => {
        const report = log?.metadata?.report;
        const segment = String(log?.metadata?.profileSegment || 'unknown');
        const score = Number(report?.precisionScore);
        const confidence = Number(report?.confidence);
        const achieved = Boolean(report?.achievedTarget);

        if (Number.isFinite(score)) {
            precisionScores.push(score);
        }
        if (Number.isFinite(confidence)) {
            precisionConfidence.push(confidence);
        }
        if (achieved) {
            precisionTargetHit += 1;
        }

        if (!precisionBySegment[segment]) {
            precisionBySegment[segment] = { total: 0, hit: 0, sumScore: 0 };
        }
        precisionBySegment[segment].total += 1;
        precisionBySegment[segment].hit += achieved ? 1 : 0;
        precisionBySegment[segment].sumScore += Number.isFinite(score) ? score : 0;
    });

    const precisionTotal = precisionScores.length;
    const avgPrecisionScore = precisionTotal
        ? Math.round(precisionScores.reduce((sum, value) => sum + value, 0) / precisionTotal)
        : 0;
    const precisionHitRate = precisionTotal
        ? Math.round((precisionTargetHit / precisionTotal) * 100)
        : 0;
    const avgPrecisionConfidence = precisionConfidence.length
        ? Number((precisionConfidence.reduce((sum, value) => sum + value, 0) / precisionConfidence.length).toFixed(2))
        : 0;

    const precisionBySegmentNormalized: Record<string, { total: number; hitRate: number; avgScore: number }> = {};
    Object.entries(precisionBySegment).forEach(([segment, data]) => {
        precisionBySegmentNormalized[segment] = {
            total: data.total,
            hitRate: data.total ? Math.round((data.hit / data.total) * 100) : 0,
            avgScore: data.total ? Math.round(data.sumScore / data.total) : 0
        };
    });

    // Product funnel metrics (7 days): TTA, generation conversion, local fallback, workout completion
    const funnelActions = [
        'funnel:workout_generation_started',
        'funnel:workout_generation_succeeded',
        'funnel:workout_generation_fallback_local',
        'funnel:workout_generation_failed',
        'funnel:workout_save_succeeded',
        'funnel:workout_started',
        'funnel:workout_execution_started',
        'funnel:workout_finished',
        'funnel:workout_execution_finished'
    ];

    const { data: productFunnelData } = await supabase
        .from('activity_logs')
        .select('user_id, action, metadata, created_at')
        .in('action', funnelActions)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: true });

    const funnel = {
        generationStarted: 0,
        generationSucceeded: 0,
        generationFallbackLocal: 0,
        generationFailed: 0,
        workoutSaveSucceeded: 0,
        workoutStarted: 0,
        workoutFinished: 0
    };

    const pendingGenerationStarts = new Map<string, number[]>();
    const ttaSamplesSeconds: number[] = [];

    (productFunnelData as ProductFunnelLogRow[] | null)?.forEach((row) => {
        const action = String(row.action || '');
        const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
        const key = `${row.user_id || 'anon'}:${extractEntityId(metadata)}`;
        const createdAtMs = new Date(row.created_at).getTime();
        if (!Number.isFinite(createdAtMs)) return;

        if (action === 'funnel:workout_generation_started') {
            funnel.generationStarted += 1;
            const queue = pendingGenerationStarts.get(key) || [];
            queue.push(createdAtMs);
            pendingGenerationStarts.set(key, queue);
            return;
        }

        if (action === 'funnel:workout_generation_succeeded') {
            funnel.generationSucceeded += 1;
        } else if (action === 'funnel:workout_generation_fallback_local') {
            funnel.generationFallbackLocal += 1;
        } else if (action === 'funnel:workout_generation_failed') {
            funnel.generationFailed += 1;
        } else if (action === 'funnel:workout_save_succeeded') {
            funnel.workoutSaveSucceeded += 1;
        } else if (action === 'funnel:workout_started' || action === 'funnel:workout_execution_started') {
            funnel.workoutStarted += 1;
        } else if (action === 'funnel:workout_finished' || action === 'funnel:workout_execution_finished') {
            funnel.workoutFinished += 1;
        }

        if (action === 'funnel:workout_generation_succeeded' || action === 'funnel:workout_generation_fallback_local') {
            const queue = pendingGenerationStarts.get(key);
            if (!queue || queue.length === 0) return;
            const startAtMs = queue.shift();
            if (startAtMs == null) return;
            if (queue.length === 0) pendingGenerationStarts.delete(key);
            const deltaSeconds = Math.round((createdAtMs - startAtMs) / 1000);
            if (deltaSeconds >= 0 && deltaSeconds <= 6 * 60 * 60) {
                ttaSamplesSeconds.push(deltaSeconds);
            }
        }
    });

    const generatedCount = funnel.generationSucceeded + funnel.generationFallbackLocal;
    const completionRate = funnel.workoutStarted > 0
        ? Math.round((funnel.workoutFinished / funnel.workoutStarted) * 100)
        : 0;
    const localFallbackRate = funnel.generationStarted > 0
        ? Math.round((funnel.generationFallbackLocal / funnel.generationStarted) * 100)
        : 0;
    const generationConversionRate = funnel.generationStarted > 0
        ? Math.round((generatedCount / funnel.generationStarted) * 100)
        : 0;
    const saveConversionRate = generatedCount > 0
        ? Math.round((funnel.workoutSaveSucceeded / generatedCount) * 100)
        : 0;

    const sortedTta = [...ttaSamplesSeconds].sort((a, b) => a - b);
    const ttaAvgSeconds = sortedTta.length > 0
        ? Math.round(sortedTta.reduce((sum, value) => sum + value, 0) / sortedTta.length)
        : 0;
    const ttaP50Seconds = percentileFromSorted(sortedTta, 0.5);
    const ttaP90Seconds = percentileFromSorted(sortedTta, 0.9);

    let usageByUser: AIUsageByUser[] = [];
    try {
        const { data: usageRows, error: usageError } = await supabase
            .rpc('get_ai_usage_by_user', { p_days: 30, p_limit: 20 });
        if (!usageError && Array.isArray(usageRows)) {
            usageByUser = usageRows.map((row: any) => ({
                user_id: row.user_id || null,
                total_requests: Number(row.total_requests || 0),
                successful_requests: Number(row.successful_requests || 0),
                success_rate: Number(row.success_rate || 0),
                total_tokens: Number(row.total_tokens || 0),
                avg_latency_ms: row.avg_latency_ms == null ? null : Number(row.avg_latency_ms),
                last_request_at: row.last_request_at || null
            }));
        }
    } catch {
        usageByUser = [];
    }

    return {
        totalLogs: totalLogs || 0,
        todayLogs: todayLogs || 0,
        successRate: totalLogs ? Math.round((successLogs || 0) / totalLogs * 100) : 0,
        errorsToday: errorsToday || 0,
        byModel: modelCounts,
        byAction: actionCounts,
        totalTokensInput,
        totalTokensOutput,
        totalTokens: totalTokensInput + totalTokensOutput,
        todayTokensInput,
        todayTokensOutput,
        todayTokens: todayTokensInput + todayTokensOutput,
        tokensByAction,
        // New detailed metrics
        successRateByAction,
        avgLatencyByAction,
        avgLatency,
        recentErrors: recentErrors || [],
        requestsByDay,
        providerHealth: {
            status: providerHealthStatus,
            reason: providerHealthReason,
            workoutActions24h,
            groqSuccess24h,
            lastGroqSuccessAt,
            byProvider: providerStats
        },

        aiFeedback: {
            total: feedbackTotal,
            positive: feedbackPositive,
            negative: feedbackNegative,
            approvalRate: feedbackApprovalRate
        },
        progressionPrecision: {
            total: precisionTotal,
            avgScore: avgPrecisionScore,
            hitRate: precisionHitRate,
            avgConfidence: avgPrecisionConfidence,
            bySegment: precisionBySegmentNormalized
        },
        productMetrics: {
            windowDays: 7,
            funnel,
            generationConversionRate,
            localFallbackRate,
            saveConversionRate,
            workoutCompletionRate: completionRate,
            tta: {
                samples: ttaSamplesSeconds.length,
                avgSeconds: ttaAvgSeconds,
                p50Seconds: ttaP50Seconds,
                p90Seconds: ttaP90Seconds
            }
        },
        usageByUser
    };
}

export async function getSystemMetrics() {
    // Total workouts saved
    const { count: totalWorkouts } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true });

    // Total clients
    const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

    // Activity today
    const today = new Date().toISOString().split('T')[0];
    const { count: activityToday } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

    return {
        totalWorkouts: totalWorkouts || 0,
        totalClients: totalClients || 0,
        activityToday: activityToday || 0
    };
}
