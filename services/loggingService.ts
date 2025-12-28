import { supabase } from './supabaseClient';

// ============================================
// AI Logging Service
// ============================================

export interface AILogEntry {
    action_type: 'generate_workout' | 'refine' | 'regenerate_exercise' | 'insight' | 'message_template' | 'analyze_progress';
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

// Log AI action with full details
export async function logAIAction(entry: AILogEntry): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('ai_logs').insert({
            user_id: user?.id,
            action_type: entry.action_type,
            model_used: entry.model_used,
            prompt: entry.prompt,
            response: entry.response,
            tokens_input: entry.tokens_input,
            tokens_output: entry.tokens_output,
            latency_ms: entry.latency_ms,
            success: entry.success,
            error_message: entry.error_message,
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
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('activity_logs').insert({
            user_id: user?.id,
            action: entry.action,
            resource_type: entry.resource_type,
            resource_id: entry.resource_id,
            user_agent: navigator.userAgent,
            metadata: entry.metadata
        });

        if (error) {
            console.warn('Failed to log activity:', error.message);
        }
    } catch (e) {
        console.warn('Error in logActivity:', e);
    }
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

    // By action type
    const { data: byAction } = await supabase
        .from('ai_logs')
        .select('action_type')
        .gte('created_at', weekAgo);

    const actionCounts: Record<string, number> = {};
    byAction?.forEach(log => {
        actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
    });

    return {
        totalLogs: totalLogs || 0,
        todayLogs: todayLogs || 0,
        successRate: totalLogs ? Math.round((successLogs || 0) / totalLogs * 100) : 0,
        errorsToday: errorsToday || 0,
        byModel: modelCounts,
        byAction: actionCounts
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
