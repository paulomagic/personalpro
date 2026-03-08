import { supabase } from '../../supabaseCore';
import { createScopedLogger } from '../../appLogger';

const assessmentsDomainLogger = createScopedLogger('assessmentsDomain');

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
        assessmentsDomainLogger.error('Error fetching assessments', error, { clientId });
        return [];
    }

    return (data || []) as Assessment[];
}

export async function createAssessment(data: CreateAssessmentData): Promise<Assessment | null> {
    if (!supabase) {
        assessmentsDomainLogger.warn('Supabase not configured - assessment not saved', {
            clientId: data.client_id,
            coachId: data.coach_id
        });
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
            assessmentsDomainLogger.error('Error creating assessment', error, {
                clientId: data.client_id,
                coachId: data.coach_id,
                date: data.date
            });
            return null;
        }

        return result as Assessment;
    } catch (error) {
        assessmentsDomainLogger.error('Error in createAssessment', error, {
            clientId: data.client_id,
            coachId: data.coach_id,
            date: data.date
        });
        return null;
    }
}
