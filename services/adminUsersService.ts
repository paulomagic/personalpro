import { supabase } from './supabaseCore';
import { createScopedLogger } from './appLogger';

export type AdminManagedUserRole = 'admin' | 'coach' | 'student';
export type AdminManagedUserStatus = 'active' | 'invited' | 'inactive';

export interface AdminManagedUser {
    id: string;
    email: string;
    name: string;
    role: AdminManagedUserRole;
    avatar_url: string | null;
    created_at: string | null;
    updated_at: string | null;
    last_login_at: string | null;
    invited_at: string | null;
    status: AdminManagedUserStatus;
    coach_id: string | null;
    client_id: string | null;
}

export interface AdminUsersSummary {
    total: number;
    admin: number;
    coach: number;
    student: number;
    active: number;
    invited: number;
    inactive: number;
}

const adminUsersLogger = createScopedLogger('AdminUsersService');

export async function listAdminUsers(search?: string): Promise<{
    users: AdminManagedUser[];
    counts: AdminUsersSummary;
}> {
    if (!supabase) {
        return {
            users: [],
            counts: { total: 0, admin: 0, coach: 0, student: 0, active: 0, invited: 0, inactive: 0 }
        };
    }

    const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
            action: 'list',
            search: search || '',
            limit: 150
        }
    });

    if (error) {
        adminUsersLogger.error('Failed to invoke admin-users list', error, { search });
        throw new Error(error.message || 'Falha ao carregar usuários.');
    }

    if (!data?.success) {
        throw new Error(data?.error || 'Falha ao carregar usuários.');
    }

    return {
        users: Array.isArray(data.users) ? data.users : [],
        counts: data.counts || { total: 0, admin: 0, coach: 0, student: 0, active: 0, invited: 0, inactive: 0 }
    };
}

export async function inviteCoachUser(payload: { name: string; email: string }): Promise<void> {
    if (!supabase) {
        throw new Error('Supabase indisponível para convidar usuário.');
    }

    const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
            action: 'invite_coach',
            name: payload.name,
            email: payload.email
        }
    });

    if (error) {
        adminUsersLogger.error('Failed to invoke admin-users invite', error, { email: payload.email });
        throw new Error(error.message || 'Falha ao enviar convite.');
    }

    if (!data?.success) {
        throw new Error(data?.error || 'Falha ao enviar convite.');
    }
}
