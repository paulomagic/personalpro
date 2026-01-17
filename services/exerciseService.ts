// Exercise Service - Resolução por Intenção
// Consulta tabela exercises por movement_pattern + muscle
// Nunca por nome de exercício

import { supabase } from './supabaseClient';

// ============ TIPOS ============

export type MovementPattern =
    | 'empurrar_horizontal'
    | 'empurrar_vertical'
    | 'puxar_horizontal'
    | 'puxar_vertical'
    | 'agachar'
    | 'hinge'
    | 'core';

export type SpinalLoad = 'baixo' | 'moderado' | 'alto';
export type StabilityDemand = 'baixo' | 'moderado' | 'alto';
export type Difficulty = 'iniciante' | 'intermediario' | 'avancado' | 'atleta';
export type Category = 'forca' | 'cardio' | 'mobilidade' | 'core';
export type Equipment = 'halter' | 'barra' | 'maquina' | 'cabo' | 'peso_corporal';
export type Injury = 'ombro' | 'joelho' | 'coluna' | 'cotovelo' | 'punho';

export interface Exercise {
    id: string;
    slug: string;
    name: string;
    name_en?: string;
    category: Category;
    difficulty: Difficulty;
    primary_muscle: string;
    secondary_muscles: string[];
    movement_pattern: MovementPattern;
    equipment: Equipment[];
    is_compound: boolean;
    is_unilateral: boolean;
    is_machine: boolean;
    spinal_load: SpinalLoad;
    stability_demand: StabilityDemand;
    avoid_for_injuries: Injury[];
    caution_for_injuries: Injury[];
    execution_tips?: string;
    video_url?: string;
    created_at: string;
    updated_at: string;
}

// Intenção abstrata (o que a IA retorna)
export interface ExerciseIntention {
    movement_pattern: MovementPattern;
    primary_muscle: string;
    equipment?: Equipment[];      // Opcional: filtrar por equipamento disponível
    avoid_injuries?: Injury[];    // Opcional: evitar por lesão do aluno
    prefer_compound?: boolean;    // Opcional: preferir compostos
    prefer_machine?: boolean;     // Opcional: preferir máquinas (menos estabilidade)
}

/**
 * Resolve exercício por intenção biomecânica
 * Usado pela IA para transformar intenção abstrata em exercícios reais
 * 
 * Estratégia de fallback:
 * 1. Tenta match exato (pattern + muscle)
 * 2. Se falhar, busca apenas por pattern
 * 3. Filtra por lesões e preferências
 */
export async function resolveExercise(
    intention: ExerciseIntention
): Promise<Exercise[]> {
    if (!supabase) {
        console.warn('Supabase not configured - cannot resolve exercises');
        return [];
    }

    // Normalizar muscle name para match flexível
    const normalizedMuscle = normalizeMuscle(intention.primary_muscle);

    // Primeira tentativa: match exato
    let query = supabase
        .from('exercises')
        .select('*')
        .eq('movement_pattern', intention.movement_pattern)
        .eq('primary_muscle', normalizedMuscle);

    // Filtrar por equipamento disponível
    if (intention.equipment && intention.equipment.length > 0) {
        query = query.overlaps('equipment', intention.equipment);
    }

    // Evitar exercícios incompatíveis com lesões
    if (intention.avoid_injuries && intention.avoid_injuries.length > 0) {
        for (const injury of intention.avoid_injuries) {
            query = query.not('avoid_for_injuries', 'cs', `{${injury}}`);
        }
    }

    // Preferir compostos
    if (intention.prefer_compound !== undefined) {
        query = query.order('is_compound', { ascending: !intention.prefer_compound });
    }

    // Preferir máquinas
    if (intention.prefer_machine !== undefined) {
        query = query.order('is_machine', { ascending: !intention.prefer_machine });
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error resolving exercise:', error);
        return [];
    }

    // Se encontrou resultados, retorna
    if (data && data.length > 0) {
        return data as Exercise[];
    }

    // FALLBACK: busca apenas por movement_pattern
    console.log(`[resolveExercise] Fallback: no match for ${intention.movement_pattern}+${normalizedMuscle}, trying pattern only`);

    let fallbackQuery = supabase
        .from('exercises')
        .select('*')
        .eq('movement_pattern', intention.movement_pattern);

    // Evitar exercícios incompatíveis com lesões
    if (intention.avoid_injuries && intention.avoid_injuries.length > 0) {
        for (const injury of intention.avoid_injuries) {
            fallbackQuery = fallbackQuery.not('avoid_for_injuries', 'cs', `{${injury}}`);
        }
    }

    // Ordenar por compostos primeiro
    fallbackQuery = fallbackQuery.order('is_compound', { ascending: false });
    fallbackQuery = fallbackQuery.limit(1);

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
        console.error('Error in fallback resolution:', fallbackError);
        return [];
    }

    return (fallbackData || []) as Exercise[];
}

/**
 * Normaliza nome do músculo para match
 */
function normalizeMuscle(muscle: string): string {
    const normalized = muscle.toLowerCase().trim();

    const mapping: Record<string, string> = {
        'posterior': 'posterior_coxa',
        'posterior de coxa': 'posterior_coxa',
        'posteriores': 'posterior_coxa',
        'isquiotibiais': 'posterior_coxa',
        'gluteo': 'gluteos',
        'glúteo': 'gluteos',
        'glúteos': 'gluteos',
        'dorsal': 'costas',
        'dorsais': 'costas',
        'latissimo': 'costas',
        'peitoral': 'peito',
        'peitorais': 'peito',
        'deltoides': 'ombro',
        'deltoide': 'ombro',
        'abdominal': 'core',
        'abdomen': 'core',
        'abs': 'core',
        'quadricep': 'quadriceps',
        'quads': 'quadriceps'
    };

    return mapping[normalized] || normalized;
}

/**
 * Busca todos os exercícios
 * Usado para popular UI de seleção manual
 */
export async function getAllExercises(): Promise<Exercise[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('movement_pattern')
        .order('primary_muscle')
        .order('name');

    if (error) {
        console.error('Error fetching exercises:', error);
        return [];
    }

    return (data || []) as Exercise[];
}

/**
 * Busca exercícios por padrão de movimento
 */
export async function getExercisesByPattern(
    pattern: MovementPattern
): Promise<Exercise[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('movement_pattern', pattern)
        .order('is_compound', { ascending: false })
        .order('name');

    if (error) {
        console.error('Error fetching exercises by pattern:', error);
        return [];
    }

    return (data || []) as Exercise[];
}

/**
 * Busca exercício por slug
 */
export async function getExerciseBySlug(slug: string): Promise<Exercise | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error('Error fetching exercise by slug:', error);
        }
        return null;
    }

    return data as Exercise;
}

/**
 * Busca alternativas seguras para um exercício
 * Usado quando aluno tem lesão que impede o exercício original
 */
export async function findSafeAlternatives(
    originalExercise: Exercise,
    injuries: Injury[]
): Promise<Exercise[]> {
    if (!supabase || injuries.length === 0) return [];

    let query = supabase
        .from('exercises')
        .select('*')
        .eq('movement_pattern', originalExercise.movement_pattern)
        .eq('primary_muscle', originalExercise.primary_muscle)
        .neq('id', originalExercise.id);

    // Excluir exercícios que devem ser evitados
    for (const injury of injuries) {
        query = query.not('avoid_for_injuries', 'cs', `{${injury}}`);
    }

    // Preferir máquinas para lesões (mais estáveis)
    query = query.order('is_machine', { ascending: false });
    query = query.order('spinal_load');

    const { data, error } = await query;

    if (error) {
        console.error('Error finding safe alternatives:', error);
        return [];
    }

    return (data || []) as Exercise[];
}

/**
 * Valida se exercício é seguro para aluno com lesões
 */
export function isExerciseSafe(exercise: Exercise, injuries: Injury[]): {
    safe: boolean;
    caution: boolean;
    blockedBy: Injury[];
    cautionFor: Injury[];
} {
    const blockedBy = injuries.filter(injury =>
        exercise.avoid_for_injuries.includes(injury)
    );

    const cautionFor = injuries.filter(injury =>
        exercise.caution_for_injuries.includes(injury)
    );

    return {
        safe: blockedBy.length === 0,
        caution: cautionFor.length > 0,
        blockedBy,
        cautionFor
    };
}

// ============ HELPERS ============

/**
 * Parse lesões de string do cliente para array tipado
 */
export function parseClientInjuries(injuriesText?: string): Injury[] {
    if (!injuriesText || injuriesText.toLowerCase() === 'nenhuma') return [];

    const injuries: Injury[] = [];
    const text = injuriesText.toLowerCase();

    if (text.includes('ombro')) injuries.push('ombro');
    if (text.includes('joelho')) injuries.push('joelho');
    if (text.includes('coluna') || text.includes('costas') || text.includes('lombar') || text.includes('hérnia')) {
        injuries.push('coluna');
    }
    if (text.includes('cotovelo')) injuries.push('cotovelo');
    if (text.includes('punho') || text.includes('pulso')) injuries.push('punho');

    return injuries;
}

/**
 * Mapeia objetivo do cliente para movement patterns relevantes
 */
export function getPatternsByGoal(goal: string): MovementPattern[] {
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('hipertrofia')) {
        return ['empurrar_horizontal', 'empurrar_vertical', 'puxar_horizontal', 'puxar_vertical', 'agachar', 'hinge'];
    }

    if (goalLower.includes('glúteo')) {
        return ['hinge', 'agachar'];
    }

    if (goalLower.includes('emagrecimento') || goalLower.includes('perda')) {
        return ['agachar', 'hinge', 'empurrar_horizontal', 'puxar_horizontal', 'core'];
    }

    if (goalLower.includes('força')) {
        return ['empurrar_horizontal', 'agachar', 'hinge', 'puxar_horizontal'];
    }

    // Default: full body
    return ['empurrar_horizontal', 'puxar_horizontal', 'agachar', 'hinge', 'core'];
}
