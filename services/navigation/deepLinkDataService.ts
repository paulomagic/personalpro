import type { Client, Workout, WorkoutSplit, Exercise, WorkoutExercise } from '../../types';
import { supabase } from '../supabaseCore';
import { createScopedLogger } from '../appLogger';

interface DBClientRow {
    id: string;
    name: string;
    goal?: string;
    level?: string;
    status?: string;
    adherence?: number;
    avatar_url?: string | null;
    email?: string | null;
    phone?: string | null;
    age?: number | null;
    weight?: number | null;
    height?: number | null;
    created_at?: string;
}

interface DBWorkoutRow {
    id: string;
    client_id: string;
    title?: string;
    objective?: string;
    duration?: string;
    splits?: unknown;
    exercises?: unknown;
}

const deepLinkDataLogger = createScopedLogger('deepLinkDataService');

function normalizeLevel(level: string | undefined | null): Client['level'] {
    const normalized = (level || '').toLowerCase();
    if (normalized.includes('inic')) return 'Iniciante';
    if (normalized.includes('avan')) return 'Avançado';
    if (normalized.includes('atl')) return 'Atleta';
    return 'Intermediário';
}

function normalizeStatus(status: string | undefined | null): Client['status'] {
    if (status === 'inactive') return 'paused';
    if (status === 'at-risk' || status === 'paused') return status;
    return 'active';
}

function mapClientRowToClient(row: DBClientRow): Client {
    return {
        id: row.id,
        name: row.name,
        avatar: row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=3b82f6&color=fff`,
        avatar_url: row.avatar_url || undefined,
        goal: row.goal || 'Condicionamento',
        level: normalizeLevel(row.level),
        adherence: typeof row.adherence === 'number' ? row.adherence : 0,
        lastTraining: 'Não registrado',
        status: normalizeStatus(row.status),
        email: row.email || undefined,
        phone: row.phone || undefined,
        age: row.age || undefined,
        weight: row.weight || undefined,
        height: row.height || undefined,
        startDate: row.created_at || undefined,
        paymentStatus: 'paid',
        missedClasses: [],
        assessments: [],
    };
}

function mapWorkoutRowToWorkout(row: DBWorkoutRow): Workout {
    const splits = Array.isArray(row.splits) ? row.splits as WorkoutSplit[] : [];
    const legacyExercises = Array.isArray(row.exercises) ? row.exercises as (WorkoutExercise[] | Exercise[]) : [];
    const splitExercises = splits.length > 0 && Array.isArray(splits[0]?.exercises)
        ? (splits[0].exercises as WorkoutExercise[])
        : [];

    return {
        id: row.id,
        clientId: row.client_id,
        title: row.title || 'Treino',
        objective: row.objective || '',
        duration: row.duration || '60 min',
        days: splits.length > 0 ? splits.length : 1,
        exercises: splitExercises.length > 0 ? splitExercises : legacyExercises,
        splits,
    };
}

export async function fetchClientByIdForDeepLink(clientId: string): Promise<Client | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('clients')
        .select('id, name, goal, level, status, adherence, avatar_url, email, phone, age, weight, height, created_at')
        .eq('id', clientId)
        .single();

    if (error || !data) {
        if (error?.code !== 'PGRST116') {
            deepLinkDataLogger.error('Error fetching client', error, { clientId });
        }
        return null;
    }

    return mapClientRowToClient(data as DBClientRow);
}

export async function fetchWorkoutByIdForDeepLink(workoutId: string): Promise<Workout | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('workouts')
        .select('id, client_id, title, objective, duration, splits')
        .eq('id', workoutId)
        .single();

    if (error || !data) {
        if (error?.code !== 'PGRST116') {
            deepLinkDataLogger.error('Error fetching workout', error, { workoutId });
        }
        return null;
    }

    return mapWorkoutRowToWorkout(data as DBWorkoutRow);
}
