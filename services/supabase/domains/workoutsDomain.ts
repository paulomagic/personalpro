import { supabase } from '../../supabaseCore';

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
