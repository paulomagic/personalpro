import { supabase } from './supabaseCore';

export type PrivacyRequestType = 'access' | 'export' | 'delete' | 'rectify';
export type PrivacyRequestStatus = 'open' | 'in_review' | 'completed' | 'rejected' | 'cancelled';

export interface PrivacyRequestSummary {
  id: string;
  created_at: string;
  updated_at: string;
  request_type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  notes?: string | null;
  resolution_notes?: string | null;
  processed_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function createPrivacyRequest(
  requestType: PrivacyRequestType,
  notes?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase indisponível.' };
  }

  const { data, error } = await supabase.rpc('create_privacy_request', {
    p_request_type: requestType,
    p_notes: notes ?? null
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: typeof data === 'string' ? data : undefined };
}

export async function exportMyPrivacyData(): Promise<{ success: boolean; data?: unknown; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase indisponível.' };
  }

  const { data, error } = await supabase.rpc('export_my_privacy_data');
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function listPrivacyRequests(): Promise<{ success: boolean; data?: PrivacyRequestSummary[]; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase indisponível.' };
  }

  const { data, error } = await supabase
    .from('privacy_requests')
    .select('id, created_at, updated_at, request_type, status, notes, resolution_notes, processed_at, metadata')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data ?? []) as PrivacyRequestSummary[] };
}

export async function cancelPrivacyRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase indisponível.' };
  }

  const { data, error } = await supabase.rpc('cancel_my_privacy_request', {
    p_request_id: requestId
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: 'Não foi possível cancelar a solicitação.' };
  }

  return { success: true };
}

export function buildPrivacyExportFilename(prefix = 'personalpro-lgpd-export'): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
}

export function downloadPrivacyJson(payload: unknown, prefix?: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Janela indisponível para exportação.' };
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildPrivacyExportFilename(prefix);
  anchor.click();
  window.URL.revokeObjectURL(url);
  return { success: true };
}
