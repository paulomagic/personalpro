import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '../supabaseCore';

interface CompleteInviteSignupRequest {
    inviteToken: string;
    email: string;
    password: string;
    name: string;
}

interface CompleteInviteSignupResponse {
    success: boolean;
    userId?: string;
    existingAccount?: boolean;
    existingRole?: 'admin' | 'coach' | 'student';
    error?: string;
}

export async function completeInvitedStudentSignup(
    payload: CompleteInviteSignupRequest
): Promise<CompleteInviteSignupResponse> {
    if (!supabase) {
        return { success: false, error: 'Supabase não configurado' };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/complete-invite-signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        return {
            success: false,
            existingAccount: Boolean(data?.existingAccount),
            existingRole: data?.existingRole === 'admin' || data?.existingRole === 'coach' || data?.existingRole === 'student'
                ? data.existingRole
                : undefined,
            error: typeof data?.error === 'string'
                ? data.error
                : 'Falha ao concluir o cadastro do convite'
        };
    }

    return {
        success: Boolean(data?.success),
        userId: typeof data?.userId === 'string' ? data.userId : undefined,
        existingAccount: Boolean(data?.existingAccount),
        existingRole: data?.existingRole === 'admin' || data?.existingRole === 'coach' || data?.existingRole === 'student'
            ? data.existingRole
            : undefined,
        error: typeof data?.error === 'string' ? data.error : undefined
    };
}
