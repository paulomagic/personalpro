import { supabase } from './supabaseClient';

// ============================================
// AI Logging Service
// ============================================

export interface AILogEntry {
    action_type: 'generate_workout' | 'generate_workout_intention' | 'refine' | 'regenerate_exercise' | 'insight' | 'message_template' | 'analyze_progress';
    model_used: string;
    prompt: string;
    response: string | null;
    tokens_input?: number;
    tokens_output?: number;
    latency_ms: number;
    success: boolean;
    error_message?: string;
    metadata?: Record<string, any>;
}

export interface ActivityLogEntry {
    action: string;
    resource_type?: string;
    resource_id?: string;
    metadata?: Record<string, any>;
}

function redactSensitiveText(value?: string | null): string | null {
    if (!value) return null;

    return value
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
        .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, '[REDACTED_PHONE]')
        .slice(0, 2000);
}

// Log AI action with full details
export async function logAIAction(entry: AILogEntry): Promise<void> {
    try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('ai_logs').insert({
            user_id: user?.id,
            action_type: entry.action_type,
            model_used: entry.model_used,
            prompt: redactSensitiveText(entry.prompt),
            response: redactSensitiveText(entry.response),
            tokens_input: entry.tokens_input,
            tokens_output: entry.tokens_output,
            latency_ms: entry.latency_ms,
            success: entry.success,
            error_message: redactSensitiveText(entry.error_message),
            metadata: entry.metadata
        });

        if (error) {
            console.warn('Failed to log AI action:', error.message);
        }
    } catch (e) {
        console.warn('Error in logAIAction:', e);
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
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            metadata: entry.metadata
        });

        if (error) {
            console.warn('Failed to log activity:', error.message);
        }
    } catch (e) {
        console.warn('Error in logActivity:', e);
    }
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
        console.error('Error fetching AI logs:', error);
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
        console.error('Error fetching activity logs:', error);
        return { logs: [], total: 0 };
    }

    return { logs: data || [], total: count || 0 };
}

// ============================================
// Admin Metrics
// ============================================

export async function getAIMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

    // Total tokens used & Breakdown by action
    const { data: tokenData } = await supabase
        .from('ai_logs')
        .select('action_type, tokens_input, tokens_output');

    let totalTokensInput = 0;
    let totalTokensOutput = 0;
    const tokensByAction: Record<string, number> = {};

    tokenData?.forEach(log => {
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
        aiFeedback: {
            total: feedbackTotal,
            positive: feedbackPositive,
            negative: feedbackNegative,
            approvalRate: feedbackApprovalRate
        }
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
