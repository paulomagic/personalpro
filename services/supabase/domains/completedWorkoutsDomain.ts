import { supabase } from '../../supabaseCore';

export interface CompletedWorkoutInput {
    client_id: string;
    workout_id?: string;
    title: string;
    duration: string;
    exercises_count: number;
    sets_completed: number;
    total_load_volume: number;
    feedback_notes?: string;
}

export interface CompletedWorkoutRecord extends CompletedWorkoutInput {
    id: string;
    date?: string;
    created_at?: string;
}

export async function saveCompletedWorkout(workoutData: CompletedWorkoutInput): Promise<CompletedWorkoutRecord | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('completed_workouts')
        .insert(workoutData)
        .select()
        .single();

    if (error) {
        console.error('Error saving completed workout:', error);
        return null;
    }

    return data as CompletedWorkoutRecord;
}

export async function getCompletedWorkouts(clientId: string): Promise<CompletedWorkoutRecord[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('completed_workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching completed workouts:', error);
        return [];
    }

    return (data || []) as CompletedWorkoutRecord[];
}
