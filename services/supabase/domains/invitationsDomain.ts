import { supabase } from '../../supabaseCore';
import {
    normalizeAcceptInvitationResult,
    normalizeInvitationPreviewFromRpc,
} from '../../invitations/invitationUtils';
import { createScopedLogger } from '../../appLogger';

export interface DBUserProfile {
    id: string;
    role: 'admin' | 'coach' | 'student';
    coach_id?: string;
    client_id?: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface DBInvitation {
    id: string;
    coach_id: string;
    email: string;
    client_id?: string;
    token: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    expires_at: string;
    accepted_at?: string;
    created_at: string;
}

export interface DBInvitationPreview {
    id: string;
    email: string;
    client_id?: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    expires_at: string;
}

const invitationsDomainLogger = createScopedLogger('invitationsDomain');

function generateInvitationToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function createInvitation(
    coachId: string,
    email: string,
    clientId?: string
): Promise<DBInvitation | null> {
    if (!supabase) return null;
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
        .from('invitations')
        .insert({
            coach_id: coachId,
            email: email.toLowerCase().trim(),
            client_id: clientId,
            token,
            status: 'pending',
            expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

    if (error) {
        invitationsDomainLogger.error('Error creating invitation', error, {
            coachId,
            clientId
        });
        return null;
    }

    return data;
}

export async function getInvitationByToken(token: string): Promise<DBInvitationPreview | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('get_invitation_by_token', {
        invitation_token: token
    });
    if (error) {
        if (error.code !== 'PGRST116') {
            invitationsDomainLogger.error('Error fetching invitation', error, { token });
        }
        return null;
    }
    return normalizeInvitationPreviewFromRpc(data);
}

export async function acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    void userId;
    const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token
    });
    if (error) {
        invitationsDomainLogger.error('Error accepting invitation', error, { token, userId });
        return { success: false, error: 'Erro ao aceitar convite' };
    }
    return normalizeAcceptInvitationResult(data);
}

export async function getCoachInvitations(coachId: string): Promise<DBInvitation[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });
    if (error) {
        invitationsDomainLogger.error('Error fetching coach invitations', error, { coachId });
        return [];
    }
    return data || [];
}

export async function cancelInvitation(invitationId: string, coachId: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
        .eq('coach_id', coachId);
    if (error) {
        invitationsDomainLogger.error('Error cancelling invitation', error, {
            invitationId,
            coachId
        });
        return false;
    }
    return true;
}

export async function getCoachStudents(coachId: string): Promise<DBUserProfile[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('coach_id', coachId)
        .eq('role', 'student');
    if (error) {
        invitationsDomainLogger.error('Error fetching coach students', error, { coachId });
        return [];
    }
    return data || [];
}
