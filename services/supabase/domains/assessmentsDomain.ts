import { supabase } from '../../supabaseCore';

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

export interface CreateAssessmentData {
    client_id: string;
    coach_id: string;
    date: string;
    weight?: number;
    body_fat?: number;
    muscle_mass?: number;
    measures?: Record<string, number>;
    skinfolds?: Record<string, number>;
    photos?: string[];
    notes?: string;
}

export async function getAssessmentsByClient(clientId: string): Promise<Assessment[]> {
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

    return (data || []) as Assessment[];
}

export async function createAssessment(data: CreateAssessmentData): Promise<Assessment | null> {
    if (!supabase) {
        console.warn('Supabase not configured - assessment not saved');
        return null;
    }

    try {
        const { data: result, error } = await supabase
            .from('assessments')
            .insert({
                client_id: data.client_id,
                coach_id: data.coach_id,
                date: data.date,
                weight: data.weight,
                body_fat: data.body_fat,
                muscle_mass: data.muscle_mass,
                measures: data.measures,
                skinfolds: data.skinfolds,
                photos: data.photos,
                notes: data.notes
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating assessment:', error);
            return null;
        }

        return result as Assessment;
    } catch (error) {
        console.error('Error in createAssessment:', error);
        return null;
    }
}
