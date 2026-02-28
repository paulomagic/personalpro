import { supabase } from './supabaseCore';

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

export async function getUserProfile(userId: string): Promise<DBUserProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        if (error?.code !== 'PGRST116') {
            console.error('[getUserProfile] Error fetching profile:', error);
        }
        return null;
    }

    return data;
}

export async function countPendingRescheduleRequests(coachId: string): Promise<number> {
    if (!supabase) return 0;

    const { count, error } = await supabase
        .from('reschedule_requests')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'pending');

    if (error) {
        console.error('Error counting pending requests:', error);
        return 0;
    }

    return count || 0;
}

