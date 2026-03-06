import { supabase } from '../supabaseCore';

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
    error?: string;
}

export async function completeInvitedStudentSignup(
    payload: CompleteInviteSignupRequest
): Promise<CompleteInviteSignupResponse> {
    if (!supabase) {
        return { success: false, error: 'Supabase não configurado' };
    }

    const { data, error } = await supabase.functions.invoke('complete-invite-signup', {
        body: payload
    });

    if (error) {
        return {
            success: false,
            error: error.message || 'Falha ao concluir o cadastro do convite'
        };
    }

    return {
        success: Boolean(data?.success),
        userId: typeof data?.userId === 'string' ? data.userId : undefined,
        existingAccount: Boolean(data?.existingAccount),
        error: typeof data?.error === 'string' ? data.error : undefined
    };
}
