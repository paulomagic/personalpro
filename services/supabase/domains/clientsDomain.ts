import { supabase } from '../../supabaseCore';
import { isSupabaseUuid } from '../utils/identifiers';

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

interface ClientSensitiveDataRpcRow {
    client_id?: string;
    injuries: string | null;
    observations: string | null;
    preferences: string | null;
    bmi?: number | null;
}

export interface ClientsQueryOptions {
    limit?: number;
    offset?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'at-risk' | 'paused';
}

export interface CreateClientInput extends Omit<DBClient, 'id' | 'created_at'> {}

function mergeClientSensitiveData(
    client: DBClient,
    sensitive: ClientSensitiveDataRpcRow | null
): DBClient {
    if (!sensitive) return client;
    return {
        ...client,
        injuries: sensitive.injuries ?? client.injuries,
        observations: sensitive.observations ?? client.observations,
        preferences: sensitive.preferences ?? client.preferences
    };
}

async function getClientSensitiveData(clientId: string): Promise<ClientSensitiveDataRpcRow | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
        .rpc('get_client_sensitive_data', { p_client_id: clientId })
        .maybeSingle();

    if (error) return null;
    return (data as ClientSensitiveDataRpcRow | null) ?? null;
}

async function getClientsSensitiveDataMap(clientIds: string[]): Promise<Map<string, ClientSensitiveDataRpcRow>> {
    const safeIds = clientIds.filter(Boolean);
    if (!supabase || !safeIds.length) return new Map();

    const { data, error } = await supabase.rpc('get_clients_sensitive_data', {
        p_client_ids: safeIds
    });

    if (error || !Array.isArray(data)) return new Map();

    const rows = data as ClientSensitiveDataRpcRow[];
    const entries = rows
        .filter((row) => typeof row?.client_id === 'string' && row.client_id)
        .map((row) => [row.client_id as string, row] as const);

    return new Map(entries);
}

async function enrichClientsWithSensitiveData(clients: DBClient[]): Promise<DBClient[]> {
    if (!clients.length) return clients;

    const result: DBClient[] = [];
    const chunkSize = 20;
    for (let i = 0; i < clients.length; i += chunkSize) {
        const chunk = clients.slice(i, i + chunkSize);
        const sensitiveMap = await getClientsSensitiveDataMap(chunk.map((client) => client.id));
        const enrichedChunk = chunk.map((client) =>
            mergeClientSensitiveData(client, sensitiveMap.get(client.id) ?? null)
        );
        result.push(...enrichedChunk);
    }

    return result;
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

export async function getClients(
    coachId: string,
    options: ClientsQueryOptions = {}
): Promise<DBClient[]> {
    if (!supabase || !isSupabaseUuid(coachId)) return [];

    const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);
    const offset = Math.max(options.offset ?? 0, 0);
    const normalizedStatus = options.status === 'paused' ? 'inactive' : options.status;

    let query = supabase
        .from('clients')
        .select('*, avatar:avatar_url, avatar_url')
        .eq('coach_id', coachId)
        .order('name')
        .range(offset, offset + limit - 1);

    if (options.search && options.search.trim()) {
        query = query.ilike('name', `%${options.search.trim()}%`);
    }
    if (normalizedStatus) {
        query = query.eq('status', normalizedStatus);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    const clients = (data || []) as DBClient[];
    return enrichClientsWithSensitiveData(clients);
}

export async function getClientById(clientId: string): Promise<DBClient | null> {
    if (!supabase || !isSupabaseUuid(clientId)) return null;

    const { data, error } = await supabase
        .from('clients')
        .select('*, avatar:avatar_url, avatar_url, body_fat')
        .eq('id', clientId)
        .single();

    if (error) {
        console.error('Error fetching client:', error);
        return null;
    }

    const client = data as DBClient;
    const sensitive = await getClientSensitiveData(client.id);
    return mergeClientSensitiveData(client, sensitive);
}

export async function createClient(client: CreateClientInput): Promise<DBClient | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();

    if (error) {
        console.error('Error creating client:', error);
        return null;
    }

    return data as DBClient;
}

export async function updateClientById(clientId: string, updates: Partial<DBClient>): Promise<DBClient | null> {
    if (!supabase || !isSupabaseUuid(clientId)) return null;

    const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

    if (error) {
        console.error('[updateClient] Error:', error.message, error.code, error.details, error.hint);
        return null;
    }

    return data as DBClient;
}

export async function deleteClientCascade(clientId: string): Promise<boolean> {
    if (!supabase || !isSupabaseUuid(clientId)) return false;

    try {
        await supabase.from('assessments').delete().eq('client_id', clientId);
        await supabase.from('payments').delete().eq('client_id', clientId);
        await supabase.from('workouts').delete().eq('client_id', clientId);
        await supabase.from('appointments').delete().eq('client_id', clientId);

        const { error: clientError } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (clientError) {
            console.error('Error deleting client:', clientError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteClientCascade:', error);
        return false;
    }
}
