
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Configuração Supabase - defina suas credenciais no arquivo .env
// @ts-ignore - Vite env
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
// @ts-ignore - Vite env  
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export { supabase };

// ============ TIPOS ============

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
    observations?: string;
    status: 'active' | 'inactive' | 'at-risk';
    adherence: number;
    created_at: string;
    coach_id: string;
}

// Helper function to map DB snake_case to frontend camelCase
export function mapDBClientToClient(dbClient: DBClient & { avatar?: string }): any {
    return {
        id: dbClient.id,
        name: dbClient.name,
        email: dbClient.email,
        phone: dbClient.phone,
        avatar: dbClient.avatar || dbClient.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbClient.name)}&background=3b82f6&color=fff`,
        goal: dbClient.goal,
        level: dbClient.level as 'Iniciante' | 'Intermediário' | 'Avançado' | 'Atleta',
        status: dbClient.status === 'inactive' ? 'paused' : dbClient.status,
        adherence: dbClient.adherence || 0,
        startDate: dbClient.created_at,
        lastTraining: 'Não registrado',
        observations: dbClient.observations,
        missedClasses: [],
        assessments: [],
        totalClasses: 0,
        completedClasses: 0,
    };
}

export interface Appointment {
    id: string;
    client_id: string;
    coach_id: string;
    date: string;
    time: string;
    duration: string;
    type: 'training' | 'assessment' | 'consultation';
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
    notes?: string;
    created_at: string;
}

export interface Payment {
    id: string;
    client_id: string;
    coach_id: string;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'paid' | 'pending' | 'overdue';
    plan: string;
    created_at: string;
}

export interface Workout {
    id: string;
    client_id: string;
    coach_id: string;
    title: string;
    objective: string;
    duration: string;
    splits: any; // JSON
    created_at: string;
}

// ============ CLIENTS ============

export async function getClients(coachId: string): Promise<DBClient[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('clients')
        .select('*, avatar:avatar_url')
        .eq('coach_id', coachId)
        .order('name');

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return data || [];
}

export async function getClient(clientId: string): Promise<DBClient | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('clients')
        .select('*, avatar:avatar_url')
        .eq('id', clientId)
        .single();

    if (error) {
        console.error('Error fetching client:', error);
        return null;
    }

    return data;
}

export async function createClient(client: Omit<DBClient, 'id' | 'created_at'>): Promise<DBClient | null> {
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

    return data;
}

export async function updateClient(clientId: string, updates: Partial<DBClient>): Promise<DBClient | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

    if (error) {
        console.error('Error updating client:', error);
        return null;
    }

    return data;
}

export interface Assessment {
    id: string;
    client_id: string;
    date: string;
    weight: number;
    body_fat?: number;
    muscle_mass?: number;
    notes?: string;
    [key: string]: any;
}

export async function getAssessments(clientId: string): Promise<Assessment[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching assessments:', error);
        return [];
    }

    return data || [];
}

// ============ APPOINTMENTS ============

export async function getAppointments(coachId: string, date?: string): Promise<Appointment[]> {
    if (!supabase) return [];

    let query = supabase
        .from('appointments')
        .select('*, clients(name, avatar_url, phone)')
        .eq('coach_id', coachId)
        .order('date')
        .order('time');

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    return data || [];
}

export async function createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();

    if (error) {
        console.error('Error creating appointment:', error);
        return null;
    }

    return data;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating appointment:', error);
        return null;
    }

    return data;
}

// ============ PAYMENTS ============

export async function getPayments(coachId: string, status?: string): Promise<Payment[]> {
    if (!supabase) return [];

    let query = supabase
        .from('payments')
        .select('*, clients(name, avatar_url, phone)')
        .eq('coach_id', coachId)
        .order('due_date');

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }

    return data || [];
}

export async function createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();

    if (error) {
        console.error('Error creating payment:', error);
        return null;
    }

    return data;
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating payment:', error);
        return null;
    }

    return data;
}

// ============ WORKOUTS ============

export async function getWorkouts(clientId: string): Promise<Workout[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching workouts:', error);
        return [];
    }

    return data || [];
}

export async function saveWorkout(workout: Omit<Workout, 'id' | 'created_at'>): Promise<Workout | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single();

    if (error) {
        console.error('Error saving workout:', error);
        return null;
    }

    return data;
}

// Save AI-generated workout with metadata
export interface AIWorkoutMetadata {
    model: string;
    optionSelected?: string;
    generatedAt: string;
    clientData?: {
        injuries?: string;
        preferences?: string;
        adherence?: number;
    };
}

export async function saveAIWorkout(
    clientId: string,
    coachId: string,
    workout: any,
    metadata: AIWorkoutMetadata
): Promise<Workout | null> {
    if (!supabase) return null;

    const workoutWithMetadata = {
        client_id: clientId,
        coach_id: coachId,
        title: workout.title || 'Treino IA',
        objective: workout.objective || '',
        duration: workout.duration || '60 min',
        splits: workout.splits || [],
        ai_metadata: metadata, // Extra metadata column
    };

    const { data, error } = await supabase
        .from('workouts')
        .insert(workoutWithMetadata)
        .select()
        .single();

    if (error) {
        console.error('Error saving AI workout:', error);
        return null;
    }

    return data;
}

// ============ AUTH ============

export async function signIn(email: string, password: string) {
    if (!supabase) return { user: null, error: 'Supabase not configured' };

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    return { user: data?.user, error: error?.message };
}

export async function signUp(email: string, password: string, name: string) {
    if (!supabase) return { user: null, error: 'Supabase not configured' };

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });

    return { user: data?.user, error: error?.message };
}

export async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
}

export async function getCurrentUser() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data?.user;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return !!supabase;
}
