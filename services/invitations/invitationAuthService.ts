import { supabase } from '../supabaseCore';
import {
    normalizeAcceptInvitationResult,
    normalizeInvitationPreviewFromRpc,
    type InvitationPreview,
} from './invitationUtils';

export async function getInvitationByToken(token: string): Promise<InvitationPreview | null> {
    if (!supabase) return null;

    const { data, error } = await supabase.rpc('get_invitation_by_token', {
        invitation_token: token,
    });

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error('Error fetching invitation:', error);
        }
        return null;
    }

    return normalizeInvitationPreviewFromRpc(data);
}

export async function acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    void userId; // User id is resolved server-side by auth.uid() in RPC

    const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token,
    });

    if (error) {
        console.error('Error accepting invitation:', error);
        return { success: false, error: 'Erro ao aceitar convite' };
    }

    return normalizeAcceptInvitationResult(data);
}

