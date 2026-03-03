import { supabase } from '../../supabaseCore';

export interface DBClient {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    goal: string;
    level: string;
    age?: number;
    weight?: number;
    height?: number;
    body_fat?: number;
    observations?: string;
    injuries?: string;
    preferences?: string;
    status: 'active' | 'inactive' | 'at-risk';
    adherence: number;
    created_at: string;
    coach_id: string;
    monthly_fee?: number;
    payment_day?: number;
    payment_type?: 'monthly' | 'per_session';
    session_price?: number;
}

export function mapDBClientToClient(dbClient: DBClient & { avatar?: string }): any {
    return {
        id: dbClient.id,
        name: dbClient.name,
        email: dbClient.email,
        phone: dbClient.phone,
        avatar: dbClient.avatar || dbClient.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbClient.name)}&background=3b82f6&color=fff`,
        goal: dbClient.goal,
        level: dbClient.level as 'Iniciante' | 'Intermediário' | 'Avançado' | 'Atleta',
        age: dbClient.age,
        weight: dbClient.weight,
        height: dbClient.height,
        status: dbClient.status === 'inactive' ? 'paused' : dbClient.status,
        adherence: dbClient.adherence || 0,
        startDate: dbClient.created_at,
        lastTraining: 'Não registrado',
        observations: dbClient.observations,
        injuries: dbClient.injuries,
        preferences: dbClient.preferences,
        missedClasses: [],
        assessments: [],
        totalClasses: 0,
        completedClasses: 0,
        paymentStatus: 'paid',
        monthly_fee: dbClient.monthly_fee,
        payment_day: dbClient.payment_day,
        payment_type: dbClient.payment_type,
        session_price: dbClient.session_price,
        avatar_url: dbClient.avatar_url || dbClient.avatar,
    };
}

export async function getClients(coachId: string): Promise<DBClient[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('clients')
        .select('*, avatar:avatar_url, avatar_url')
        .eq('coach_id', coachId)
        .order('name');

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return data || [];
}
