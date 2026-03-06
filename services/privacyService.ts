import { supabase } from './supabaseCore';

export type PrivacyRequestType = 'access' | 'export' | 'delete' | 'rectify';

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
