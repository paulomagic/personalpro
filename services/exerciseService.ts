// Exercise Service - Resolução por Intenção
// Consulta tabela exercises por movement_pattern + muscle
// Nunca por nome de exercício

import { supabase } from './supabaseClient';

const isDev = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
    if (isDev) console.log(...args);
};
const debugTime = (label: string) => {
    if (isDev) console.time(label);
};
const debugTimeEnd = (label: string) => {
    if (isDev) console.timeEnd(label);
};

export type MovementPattern =
    | 'empurrar_horizontal'
    | 'empurrar_vertical'
    | 'puxar_horizontal'
    | 'puxar_vertical'
    | 'agachar'
    | 'hinge'
    | 'core'
    // Isolados
    | 'isolar_biceps'
    | 'isolar_triceps'
    | 'isolar_ombro'
    | 'isolar_panturrilha'
    | 'isolar_antebraco';

export type SpinalLoad = 'baixo' | 'moderado' | 'alto';
export type StabilityDemand = 'baixo' | 'moderado' | 'alto';
export type Difficulty = 'iniciante' | 'intermediario' | 'avancado' | 'atleta';
export type Category = 'forca' | 'cardio' | 'mobilidade' | 'core';
export type Equipment = 'halter' | 'barra' | 'maquina' | 'cabo' | 'peso_corporal';
export type Injury = 'ombro' | 'joelho' | 'coluna' | 'cotovelo' | 'punho' | 'quadril';

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

function hasGymEquipment(equipment?: Equipment[]): boolean {
    if (!equipment || equipment.length === 0) return false;
    return equipment.some(eq => eq === 'maquina' || eq === 'cabo' || eq === 'halter' || eq === 'barra');
}

function isBodyweightOnly(exercise: Exercise): boolean {
    const equipment = exercise.equipment || [];
    return equipment.length === 1 && equipment[0] === 'peso_corporal';
}

function isStrengthPattern(pattern: MovementPattern): boolean {
    return pattern !== 'core';
}

function rankExercisesByIntention(
    exercises: Exercise[],
    intention: ExerciseIntention
): Exercise[] {
    const gymAvailable = hasGymEquipment(intention.equipment);

    return [...exercises].sort((a, b) => {
        const score = (exercise: Exercise) => {
            let value = 0;

            if (intention.prefer_compound && exercise.is_compound) value += 12;
            if (intention.prefer_machine && exercise.is_machine) value += 10;

            if (gymAvailable) {
                const hasProgressiveEquipment = exercise.equipment.some(eq =>
                    eq === 'maquina' || eq === 'cabo' || eq === 'halter' || eq === 'barra'
                );
                if (hasProgressiveEquipment) value += 20;

                if (isStrengthPattern(intention.movement_pattern) && isBodyweightOnly(exercise)) {
                    value -= 30;
                }
            }

            if (intention.avoid_injuries && intention.avoid_injuries.length > 0) {
                const cautionMatches = intention.avoid_injuries.filter(injury =>
                    exercise.caution_for_injuries?.includes(injury)
                ).length;
                value -= cautionMatches * 8;
            }

            return value;
        };

        return score(b) - score(a);
    });
}

// ============ CACHE & BATCH QUERY (PERFORMANCE OPTIMIZATION) ============

interface ExerciseCache {
    data: Exercise[];
    timestamp: number;
}

let exerciseCache: ExerciseCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Busca TODOS os exercícios de uma vez (batch query)
 * Usa cache em memória para evitar queries repetidas
 * ~165KB de dados (110 exercícios)
 */
export async function fetchAllExercises(): Promise<Exercise[]> {
    // Check cache first
    if (exerciseCache && (Date.now() - exerciseCache.timestamp < CACHE_TTL)) {
        debugLog('[ExerciseService] Cache hit - returning cached exercises');
        return exerciseCache.data;
    }

    if (!supabase) {
        console.warn('Supabase not configured - cannot fetch exercises');
        return [];
    }

    debugTime('[ExerciseService] fetchAllExercises');

    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

    debugTimeEnd('[ExerciseService] fetchAllExercises');

    if (error) {
        console.error('Error fetching all exercises:', error);
        return [];
    }

    // Update cache
    exerciseCache = {
        data: data || [],
        timestamp: Date.now()
    };

    debugLog(`[ExerciseService] Fetched ${data?.length || 0} exercises`);
    return data || [];
}

/**
 * Busca exercícios filtrados por movement patterns específicos
 * Mais eficiente que fetchAllExercises se soubermos quais patterns precisamos
 * Reduz de 165KB para ~40-60KB
 */
export async function fetchExercisesByPatterns(patterns: MovementPattern[]): Promise<Exercise[]> {
    if (!supabase) return [];

    debugTime('[ExerciseService] fetchExercisesByPatterns');

    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .in('movement_pattern', patterns)
        .order('name');

    debugTimeEnd('[ExerciseService] fetchExercisesByPatterns');

    if (error) {
        console.error('Error fetching exercises by patterns:', error);
        return [];
    }

    debugLog(`[ExerciseService] Fetched ${data?.length || 0} exercises for ${patterns.length} patterns`);
    return data || [];
}

/**
 * Filtra exercícios EM MEMÓRIA (sem DB query)
 * Substitui query complexa do Supabase por loop local
 * Muito mais rápido que RTT de rede
 */
export function filterExercisesInMemory(
    allExercises: Exercise[],
    criteria: {
        movement_pattern: MovementPattern;
        primary_muscle: string;
        avoid_injuries?: Injury[];
        prefer_compound?: boolean;
        prefer_machine?: boolean;
    }
): Exercise[] {
    debugTime('[ExerciseService] filterExercisesInMemory');

    const filtered = allExercises.filter(ex => {
        // 1. Movement pattern MUST match
        if (ex.movement_pattern !== criteria.movement_pattern) return false;

        // 2. Primary muscle MUST match
        if (ex.primary_muscle !== criteria.primary_muscle) return false;

        // 3. Avoid exercises that are contraindicated for injuries
        if (criteria.avoid_injuries && criteria.avoid_injuries.length > 0) {
            const hasContraindication = criteria.avoid_injuries.some(injury =>
                ex.avoid_for_injuries.includes(injury)
            );
            if (hasContraindication) return false;
        }

        return true;
    });

    // Sort by preferences
    const sorted = filtered.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Prefer compound if requested
        if (criteria.prefer_compound) {
            if (a.is_compound) scoreA += 10;
            if (b.is_compound) scoreB += 10;
        }

        // Prefer machines if requested
        if (criteria.prefer_machine) {
            if (a.is_machine) scoreA += 5;
            if (b.is_machine) scoreB += 5;
        }

        return scoreB - scoreA;
    });

    debugTimeEnd('[ExerciseService] filterExercisesInMemory');

    return sorted.slice(0, 10); // Limit to top 10
}

// ============ ORIGINAL RESOLUTION FUNCTION ============


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

    const { data, error } = await query;

    if (error) {
        console.error('Error resolving exercise:', error);
        return [];
    }

    // Se encontrou resultados, retorna
    if (data && data.length > 0) {
        const ranked = rankExercisesByIntention(data as Exercise[], intention);
        return ranked.slice(0, 10);
    }

    // FALLBACK: busca apenas por movement_pattern
    debugLog(`[resolveExercise] Fallback: no match for ${intention.movement_pattern}+${normalizedMuscle}, trying pattern only`);

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

    fallbackQuery = fallbackQuery.limit(30);

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
        console.error('Error in fallback resolution:', fallbackError);
        return [];
    }

    const rankedFallback = rankExercisesByIntention((fallbackData || []) as Exercise[], intention);
    return rankedFallback.slice(0, 10);
}

/**
 * Normaliza nome do músculo para match
 */
function normalizeMuscle(muscle: string): string {
    const normalized = muscle.toLowerCase().trim();

    const mapping: Record<string, string> = {
        // Posterior
        'posterior': 'posterior_coxa',
        'posterior de coxa': 'posterior_coxa',
        'posteriores': 'posterior_coxa',
        'isquiotibiais': 'posterior_coxa',
        'hamstrings': 'posterior_coxa',
        // Glúteos
        'gluteo': 'gluteos',
        'glúteo': 'gluteos',
        'glúteos': 'gluteos',
        'glutes': 'gluteos',
        // Costas
        'dorsal': 'costas',
        'dorsais': 'costas',
        'latissimo': 'costas',
        'lats': 'costas',
        'back': 'costas',
        // Peito
        'peitoral': 'peito',
        'peitorais': 'peito',
        'chest': 'peito',
        // Ombro
        'deltoides': 'ombro',
        'deltoide': 'ombro',
        'shoulders': 'ombro',
        'delts': 'ombro',
        // Core
        'abdominal': 'core',
        'abdomen': 'core',
        'abs': 'core',
        'obliquos': 'core',
        // Quadríceps
        'quadricep': 'quadriceps',
        'quads': 'quadriceps',
        // Bíceps
        'bicep': 'biceps',
        // Tríceps
        'tricep': 'triceps',
        // Panturrilha
        'panturrilhas': 'panturrilha',
        'calves': 'panturrilha',
        'calf': 'panturrilha',
        'gastrocnemio': 'panturrilha',
        // Antebraço
        'forearms': 'antebraco',
        'antebracos': 'antebraco'
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
    // NOVO: Detectar lesões de quadril (artrose, etc.)
    if (text.includes('quadril') || text.includes('artrose') || text.includes('hip')) {
        injuries.push('quadril');
    }

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

/**
 * Hidrata exercícios de um treino com URLs de vídeo atualizadas
 * Resolve o problema de treinos antigos (snapshots) que não têm os vídeos novos
 */
export async function hydrateWorkoutWithVideos(workout: any): Promise<any> {
    if (!supabase || !workout) return workout;

    // 1. Coletar todos os nomes/slugs de exercícios do treino
    const exerciseNames: string[] = [];
    const exerciseIds: string[] = [];

    // Função auxiliar para processar lista de exercícios
    const processExercises = (exercises: any[]) => {
        if (!Array.isArray(exercises)) return;
        exercises.forEach(ex => {
            if (ex.name) exerciseNames.push(ex.name);
            if (ex.id && ex.id.length > 5) exerciseIds.push(ex.id); // IDs curtos costumam ser mocks
        });
    };

    // Coletar do nível raiz (se houver)
    if (workout.exercises) processExercises(workout.exercises);

    // Coletar dos splits
    if (workout.splits) {
        workout.splits.forEach((split: any) => {
            if (split.exercises) processExercises(split.exercises);
        });
    }

    if (exerciseNames.length === 0 && exerciseIds.length === 0) return workout;

    try {
        // 2. Buscar TODOS os exercícios que têm vídeo (para permitir match fuzzy)
        // Não usamos .in() pois os nomes podem ter diferenças sutis (ex: "Leg Press 45" vs "Leg Press 45°")
        const { data: dbExercises, error } = await supabase
            .from('exercises')
            .select('slug, name, video_url')
            .not('video_url', 'is', null); // Só o que tem vídeo

        if (error || !dbExercises || dbExercises.length === 0) {
            debugLog('[Hydration] Nenhum exercício com vídeo encontrado no banco');
            return workout;
        }

        debugLog(`[Hydration] Encontrados ${dbExercises.length} exercícios com vídeo no banco`);

        // Helper para normalizar strings para comparação
        const normalize = (str: string) => {
            return str.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
                .replace(/[^a-z0-9]/g, ""); // Remove tudo que não for letra ou número (incluindo espaços e símbolos)
        };

        // Criar mapa de vídeos: Nome Normalizado -> URL
        const videoMap = new Map<string, string>();
        dbExercises.forEach(ex => {
            if (ex.video_url) {
                videoMap.set(normalize(ex.name), ex.video_url);
                // Também mapear pelo slug removendo hífens
                if (ex.slug) videoMap.set(ex.slug.replace(/-/g, ''), ex.video_url);
            }
        });

        // 3. Injetar vídeos no objeto workout
        const workoutCopy = JSON.parse(JSON.stringify(workout));

        const injectVideos = (exercises: any[]) => {
            if (!Array.isArray(exercises)) return;
            exercises.forEach(ex => {
                if (!ex.name) return;

                // Se já tem vídeo, mantém (mas se for um placeholder antigo, poderia substituir)
                if (!ex.videoUrl) {
                    const key = normalize(ex.name);
                    const url = videoMap.get(key);

                    if (url) {
                        ex.videoUrl = url;
                        debugLog(`[Hydration] Vídeo injetado para: ${ex.name} -> ${url}`);
                    }
                }
            });
        };

        if (workoutCopy.exercises) injectVideos(workoutCopy.exercises);
        if (workoutCopy.splits) {
            workoutCopy.splits.forEach((split: any) => {
                if (split.exercises) injectVideos(split.exercises);
            });
        }

        return workoutCopy;

    } catch (err) {
        console.error('Error hydrating workout videos:', err);
        return workout; // Retorna original em caso de erro
    }
}
