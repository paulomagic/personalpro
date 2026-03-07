import { supabase } from '../../supabaseCore';
import { hydrateWorkoutWithVideos } from '../../exerciseService';
import { isSupabaseUuid } from '../utils/identifiers';
import { createScopedLogger } from '../../appLogger';

const workoutsDomainLogger = createScopedLogger('WorkoutsDomain');

export interface AIWorkoutMetadata {
    model: string;
    optionSelected?: string;
    generatedAt: string;
    coldStartMode?: boolean;
    calibrationPlan?: {
        sessions: number;
        objectives?: string[];
    } | null;
    clientData?: {
        injuries?: string;
        preferences?: string;
        adherence?: number;
    };
    injuryRisk?: {
        score: number;
        level: string;
    } | null;
    precisionProfile?: {
        segment: string;
        label: string;
        targetPrecisionScore: number;
        maxMeanRpeError: number;
        maxMeanRirError: number;
        maxPainRate: number;
    } | null;
}

export interface Workout {
    id: string;
    client_id: string;
    coach_id: string;
    title: string;
    objective: string;
    duration: string;
    splits: any;
    ai_metadata?: AIWorkoutMetadata;
    created_at: string;
}

export interface WorkoutsQueryOptions {
    limit?: number;
    offset?: number;
}

export async function getWorkoutsByClient(
    clientId: string,
    options: WorkoutsQueryOptions = {}
): Promise<Workout[]> {
    if (!supabase || !isSupabaseUuid(clientId)) return [];

    const limit = Math.min(Math.max(options.limit ?? 80, 1), 200);
    const offset = Math.max(options.offset ?? 0, 0);

    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        workoutsDomainLogger.error('Error fetching workouts by client', error, {
            clientId,
            limit,
            offset
        });
        return [];
    }

    return data || [];
}

export async function saveAIWorkout(
    clientId: string,
    coachId: string,
    workout: any,
    metadata: AIWorkoutMetadata
): Promise<Workout | null> {
    if (!supabase || !isSupabaseUuid(clientId) || !isSupabaseUuid(coachId)) return null;

    const workoutWithMetadata = {
        client_id: clientId,
        coach_id: coachId,
        title: workout.title || 'Treino IA',
        objective: workout.objective || '',
        duration: workout.duration || '60 min',
        splits: workout.splits || [],
        ai_metadata: metadata,
    };

    const { data, error } = await supabase
        .from('workouts')
        .insert(workoutWithMetadata)
        .select()
        .single();

    if (error) {
        workoutsDomainLogger.error('Error saving AI workout', error, {
            clientId,
            coachId,
            model: metadata.model
        });
        return null;
    }

    return data;
}

export async function saveWorkout(workout: Omit<Workout, 'id' | 'created_at'>): Promise<Workout | null> {
    if (!supabase || !isSupabaseUuid(workout.client_id) || !isSupabaseUuid(workout.coach_id)) return null;

    const { data, error } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single();

    if (error) {
        workoutsDomainLogger.error('Error saving workout', error, {
            clientId: workout.client_id,
            coachId: workout.coach_id
        });
        return null;
    }

    return data as Workout;
}

export async function getCurrentWorkoutByClient(clientId: string): Promise<Workout | null> {
    if (!supabase || !isSupabaseUuid(clientId)) return null;

    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if ((error as any)?.code !== 'PGRST116') {
            workoutsDomainLogger.error('Error fetching current workout', error, { clientId });
        }
        return null;
    }

    if (!data) return null;

    try {
        return await hydrateWorkoutWithVideos(data);
    } catch (hydrateError) {
        workoutsDomainLogger.error('Error hydrating workout videos', hydrateError, { clientId, workoutId: data.id });
        return data as Workout;
    }
}
