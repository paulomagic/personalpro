import { supabase } from '../../supabaseCore';
import { hydrateWorkoutWithVideos } from '../../exerciseService';

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
    if (!supabase) return [];

    const limit = Math.min(Math.max(options.limit ?? 80, 1), 200);
    const offset = Math.max(options.offset ?? 0, 0);

    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching workouts:', error);
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
    if (!supabase) return null;

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
        console.error('Error saving AI workout:', error);
        return null;
    }

    return data;
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

    return data as Workout;
}

export async function getCurrentWorkoutByClient(clientId: string): Promise<Workout | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if ((error as any)?.code !== 'PGRST116') {
            console.error('Error fetching client workout:', error);
        }
        return null;
    }

    if (!data) return null;

    try {
        return await hydrateWorkoutWithVideos(data);
    } catch (hydrateError) {
        console.error('Error hydrating workout:', hydrateError);
        return data as Workout;
    }
}
