import { supabase } from './supabaseCore';
import { createScopedLogger } from './appLogger';
import type { PrivacyRequestStatus, PrivacyRequestType } from './privacyService';

export interface AdminPrivacyRequestSummary {
    id: string;
    user_id: string;
    request_type: PrivacyRequestType;
    status: PrivacyRequestStatus;
    created_at: string;
    processed_at?: string | null;
    notes?: string | null;
    resolution_notes?: string | null;
    requester_name?: string | null;
    requester_email?: string | null;
}

export interface AdminPrivacyRequestsListResult {
    requests: AdminPrivacyRequestSummary[];
    openDeleteRequests: number;
}

export interface AdminPrivacyDeleteProcessingResult {
    appointments_deleted?: number;
    payments_deleted?: number;
    push_subscriptions_deleted?: number;
    ai_logs_deleted?: number;
    activity_logs_deleted?: number;
    profile_deleted?: number;
}

const adminPrivacyLogger = createScopedLogger('AdminPrivacyRequestsService');

export async function listAdminPrivacyRequests(limit = 20): Promise<AdminPrivacyRequestsListResult> {
    if (!supabase) {
        return { requests: [], openDeleteRequests: 0 };
    }

    const normalizedLimit = Math.min(50, Math.max(5, limit));
    const { data, error } = await supabase.functions.invoke('admin-privacy-requests', {
        body: {
            action: 'list_recent',
            limit: normalizedLimit
        }
    });

    if (error) {
        adminPrivacyLogger.error('Failed to invoke admin privacy requests list', error, { limit: normalizedLimit });
        throw new Error(error.message || 'Falha ao carregar solicitações LGPD.');
    }

    if (!data?.success) {
        throw new Error(data?.error || 'Falha ao carregar solicitações LGPD.');
    }

    return {
        requests: Array.isArray(data.requests) ? data.requests : [],
        openDeleteRequests: Number(data.openDeleteRequests || 0)
    };
}

export async function completeAdminDeletePrivacyRequest(
    requestId: string,
    resolutionNotes?: string
): Promise<AdminPrivacyDeleteProcessingResult | null> {
    if (!supabase) {
        throw new Error('Supabase indisponível.');
    }

    const { data, error } = await supabase.functions.invoke('admin-privacy-requests', {
        body: {
            action: 'complete_delete_request',
            requestId,
            resolutionNotes: resolutionNotes?.trim() || undefined
        }
    });

    if (error) {
        adminPrivacyLogger.error('Failed to invoke admin privacy request completion', error, { requestId });
        throw new Error(error.message || 'Falha ao concluir exclusão LGPD.');
    }

    if (!data?.success) {
        throw new Error(data?.error || 'Falha ao concluir exclusão LGPD.');
    }

    return data?.payload && typeof data.payload === 'object'
        ? data.payload as AdminPrivacyDeleteProcessingResult
        : null;
}
