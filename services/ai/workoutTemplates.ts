// Workout Templates - Estruturas determinísticas de treino
// Templates são moldes biomecânicos, NÃO texto para IA
// A IA apenas escolhe entre opções pré-validadas

import type { MovementPattern } from './types';

// ============ TIPOS FUNDAMENTAIS ============

export type IntensityLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
export type LoadType = 'axial' | 'non_axial' | 'mixed';
export type TrainingGoal = 'hipertrofia' | 'forca' | 'emagrecimento' | 'gluteos' | 'condicionamento' | 'saude';
export type TrainingLevel = 'iniciante' | 'intermediario' | 'avancado' | 'atleta';

// ============ SLOT - UNIDADE CENTRAL ============

export interface TrainingSlot {
    id: string;
    movement_pattern: MovementPattern;
    intensity: IntensityLevel;
    preferred_load?: LoadType;
    target_muscles?: string[];
    excluded_muscles?: string[];
    allow_unilateral?: boolean;
    max_fatigue_cost?: number;
    priority: number;  // Ordem de execução
}

// ============ DIA DE TREINO ============

export interface TrainingDayTemplate {
    day_id: string;
    label: string;
    slots: TrainingSlot[];
    max_total_fatigue?: number;
    notes?: string;
}

// ============ TEMPLATE SEMANAL ============

export interface WorkoutTemplate {
    template_id: string;
    name: string;
    frequency: number;
    suitable_goals: TrainingGoal[];
    suitable_levels: TrainingLevel[];
    weekly_volume_guideline: { min_sets: number; max_sets: number };
    days: TrainingDayTemplate[];
}

// ============ TEMPLATES ============

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
    // ====== PUSH PULL LEGS 6x ======
    {
        template_id: 'ppl_6',
        name: 'Push Pull Legs 6x',
        frequency: 6,
        suitable_goals: ['hipertrofia', 'forca'],
        suitable_levels: ['intermediario', 'avancado', 'atleta'],
        weekly_volume_guideline: { min_sets: 12, max_sets: 20 },
        days: [
            {
                day_id: 'push_a',
                label: 'Push A',
                slots: [
                    { id: 'push_a_1', movement_pattern: 'empurrar_horizontal', intensity: 'high', preferred_load: 'axial', priority: 1 },
                    { id: 'push_a_2', movement_pattern: 'empurrar_horizontal', intensity: 'moderate', priority: 2 },
                    { id: 'push_a_3', movement_pattern: 'empurrar_vertical', intensity: 'moderate', priority: 3 },
                    { id: 'push_a_4', movement_pattern: 'isolar_ombro', intensity: 'low', priority: 4 },
                    { id: 'push_a_5', movement_pattern: 'isolar_triceps', intensity: 'low', priority: 5 }
                ]
            },
            {
                day_id: 'pull_a',
                label: 'Pull A',
                slots: [
                    { id: 'pull_a_1', movement_pattern: 'puxar_vertical', intensity: 'high', priority: 1 },
                    { id: 'pull_a_2', movement_pattern: 'puxar_horizontal', intensity: 'moderate', priority: 2 },
                    { id: 'pull_a_3', movement_pattern: 'puxar_horizontal', intensity: 'moderate', priority: 3 },
                    { id: 'pull_a_4', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 4 },
                    { id: 'pull_a_5', movement_pattern: 'isolar_biceps', intensity: 'very_low', priority: 5 }
                ]
            },
            {
                day_id: 'legs_a',
                label: 'Legs A',
                slots: [
                    { id: 'legs_a_1', movement_pattern: 'agachar', intensity: 'very_high', preferred_load: 'axial', priority: 1 },
                    { id: 'legs_a_2', movement_pattern: 'agachar', intensity: 'moderate', priority: 2 },
                    { id: 'legs_a_3', movement_pattern: 'hinge', intensity: 'moderate', priority: 3 },
                    { id: 'legs_a_4', movement_pattern: 'agachar', intensity: 'low', priority: 4 },
                    { id: 'legs_a_5', movement_pattern: 'isolar_panturrilha', intensity: 'low', priority: 5 }
                ]
            },
            {
                day_id: 'push_b',
                label: 'Push B',
                slots: [
                    { id: 'push_b_1', movement_pattern: 'empurrar_vertical', intensity: 'high', priority: 1 },
                    { id: 'push_b_2', movement_pattern: 'empurrar_horizontal', intensity: 'moderate', priority: 2 },
                    { id: 'push_b_3', movement_pattern: 'empurrar_horizontal', intensity: 'low', priority: 3 },
                    { id: 'push_b_4', movement_pattern: 'isolar_ombro', intensity: 'low', priority: 4 },
                    { id: 'push_b_5', movement_pattern: 'isolar_triceps', intensity: 'low', priority: 5 }
                ]
            },
            {
                day_id: 'pull_b',
                label: 'Pull B',
                slots: [
                    { id: 'pull_b_1', movement_pattern: 'puxar_horizontal', intensity: 'high', priority: 1 },
                    { id: 'pull_b_2', movement_pattern: 'puxar_vertical', intensity: 'moderate', priority: 2 },
                    { id: 'pull_b_3', movement_pattern: 'puxar_horizontal', intensity: 'low', priority: 3 },
                    { id: 'pull_b_4', movement_pattern: 'isolar_ombro', intensity: 'low', target_muscles: ['ombro'], priority: 4 },
                    { id: 'pull_b_5', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 5 }
                ]
            },
            {
                day_id: 'legs_b',
                label: 'Legs B',
                slots: [
                    { id: 'legs_b_1', movement_pattern: 'hinge', intensity: 'very_high', preferred_load: 'axial', priority: 1 },
                    { id: 'legs_b_2', movement_pattern: 'hinge', intensity: 'moderate', priority: 2 },
                    { id: 'legs_b_3', movement_pattern: 'hinge', intensity: 'moderate', priority: 3 },
                    { id: 'legs_b_4', movement_pattern: 'agachar', intensity: 'low', priority: 4 },
                    { id: 'legs_b_5', movement_pattern: 'core', intensity: 'low', priority: 5 }
                ]
            }
        ]
    },

    // ====== UPPER LOWER 4x ======
    {
        template_id: 'upper_lower_4',
        name: 'Upper Lower 4x',
        frequency: 4,
        suitable_goals: ['hipertrofia', 'forca', 'condicionamento'],
        suitable_levels: ['iniciante', 'intermediario', 'avancado'],
        weekly_volume_guideline: { min_sets: 10, max_sets: 16 },
        days: [
            {
                day_id: 'upper_a',
                label: 'Upper A - Força',
                slots: [
                    { id: 'upper_a_1', movement_pattern: 'empurrar_horizontal', intensity: 'very_high', preferred_load: 'axial', priority: 1 },
                    { id: 'upper_a_2', movement_pattern: 'puxar_horizontal', intensity: 'very_high', priority: 2 },
                    { id: 'upper_a_3', movement_pattern: 'empurrar_vertical', intensity: 'moderate', priority: 3 },
                    { id: 'upper_a_4', movement_pattern: 'puxar_vertical', intensity: 'moderate', priority: 4 },
                    { id: 'upper_a_5', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 5 },
                    { id: 'upper_a_6', movement_pattern: 'isolar_triceps', intensity: 'low', priority: 6 }
                ]
            },
            {
                day_id: 'lower_a',
                label: 'Lower A - Força',
                slots: [
                    { id: 'lower_a_1', movement_pattern: 'agachar', intensity: 'very_high', preferred_load: 'axial', priority: 1 },
                    { id: 'lower_a_2', movement_pattern: 'hinge', intensity: 'very_high', preferred_load: 'axial', priority: 2 },
                    { id: 'lower_a_3', movement_pattern: 'agachar', intensity: 'moderate', priority: 3 },
                    { id: 'lower_a_4', movement_pattern: 'hinge', intensity: 'moderate', priority: 4 },
                    { id: 'lower_a_5', movement_pattern: 'isolar_panturrilha', intensity: 'low', priority: 5 }
                ]
            },
            {
                day_id: 'upper_b',
                label: 'Upper B - Volume',
                slots: [
                    { id: 'upper_b_1', movement_pattern: 'puxar_vertical', intensity: 'high', priority: 1 },
                    { id: 'upper_b_2', movement_pattern: 'empurrar_horizontal', intensity: 'high', priority: 2 },
                    { id: 'upper_b_3', movement_pattern: 'puxar_horizontal', intensity: 'moderate', priority: 3 },
                    { id: 'upper_b_4', movement_pattern: 'empurrar_vertical', intensity: 'moderate', priority: 4 },
                    { id: 'upper_b_5', movement_pattern: 'isolar_ombro', intensity: 'low', priority: 5 },
                    { id: 'upper_b_6', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 6 },
                    { id: 'upper_b_7', movement_pattern: 'isolar_triceps', intensity: 'low', priority: 7 }
                ]
            },
            {
                day_id: 'lower_b',
                label: 'Lower B - Volume',
                slots: [
                    { id: 'lower_b_1', movement_pattern: 'hinge', intensity: 'high', priority: 1 },
                    { id: 'lower_b_2', movement_pattern: 'agachar', intensity: 'moderate', priority: 2 },
                    { id: 'lower_b_3', movement_pattern: 'agachar', intensity: 'moderate', priority: 3 },
                    { id: 'lower_b_4', movement_pattern: 'hinge', intensity: 'moderate', priority: 4 },
                    { id: 'lower_b_5', movement_pattern: 'isolar_panturrilha', intensity: 'low', priority: 5 },
                    { id: 'lower_b_6', movement_pattern: 'core', intensity: 'low', priority: 6 }
                ]
            }
        ]
    },

    // ====== FULL BODY 3x ======
    {
        template_id: 'full_body_3',
        name: 'Full Body 3x',
        frequency: 3,
        suitable_goals: ['hipertrofia', 'condicionamento', 'emagrecimento', 'saude'],
        suitable_levels: ['iniciante', 'intermediario'],
        weekly_volume_guideline: { min_sets: 8, max_sets: 12 },
        days: [
            {
                day_id: 'full_a',
                label: 'Full Body A',
                slots: [
                    { id: 'full_a_1', movement_pattern: 'agachar', intensity: 'high', priority: 1 },
                    { id: 'full_a_2', movement_pattern: 'empurrar_horizontal', intensity: 'high', priority: 2 },
                    { id: 'full_a_3', movement_pattern: 'puxar_horizontal', intensity: 'high', priority: 3 },
                    { id: 'full_a_4', movement_pattern: 'hinge', intensity: 'moderate', priority: 4 },
                    { id: 'full_a_5', movement_pattern: 'core', intensity: 'low', priority: 5 }
                ]
            },
            {
                day_id: 'full_b',
                label: 'Full Body B',
                slots: [
                    { id: 'full_b_1', movement_pattern: 'hinge', intensity: 'high', priority: 1 },
                    { id: 'full_b_2', movement_pattern: 'empurrar_vertical', intensity: 'high', priority: 2 },
                    { id: 'full_b_3', movement_pattern: 'puxar_vertical', intensity: 'high', priority: 3 },
                    { id: 'full_b_4', movement_pattern: 'agachar', intensity: 'moderate', priority: 4 },
                    { id: 'full_b_5', movement_pattern: 'core', intensity: 'low', priority: 5 }
                ]
            },
            {
                day_id: 'full_c',
                label: 'Full Body C',
                slots: [
                    { id: 'full_c_1', movement_pattern: 'agachar', intensity: 'moderate', priority: 1 },
                    { id: 'full_c_2', movement_pattern: 'empurrar_horizontal', intensity: 'moderate', priority: 2 },
                    { id: 'full_c_3', movement_pattern: 'puxar_horizontal', intensity: 'moderate', priority: 3 },
                    { id: 'full_c_4', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 4 },
                    { id: 'full_c_5', movement_pattern: 'isolar_triceps', intensity: 'low', priority: 5 }
                ]
            }
        ]
    },

    // ====== GLUTE FOCUS 4x ======
    {
        template_id: 'glute_focus_4',
        name: 'Glúteos Esculpidos 4x',
        frequency: 4,
        suitable_goals: ['gluteos', 'hipertrofia'],
        suitable_levels: ['iniciante', 'intermediario', 'avancado'],
        weekly_volume_guideline: { min_sets: 12, max_sets: 18 },
        days: [
            {
                day_id: 'glute_a',
                label: 'Glúteo A - Força',
                slots: [
                    { id: 'glute_a_1', movement_pattern: 'hinge', intensity: 'very_high', target_muscles: ['gluteos'], priority: 1 },
                    { id: 'glute_a_2', movement_pattern: 'agachar', intensity: 'high', priority: 2 },
                    { id: 'glute_a_3', movement_pattern: 'hinge', intensity: 'moderate', target_muscles: ['gluteos'], priority: 3 },
                    { id: 'glute_a_4', movement_pattern: 'hinge', intensity: 'low', priority: 4 },
                    { id: 'glute_a_5', movement_pattern: 'isolar_panturrilha', intensity: 'low', priority: 5 }
                ]
            },
            {
                day_id: 'upper_glute',
                label: 'Upper + Glúteo',
                slots: [
                    { id: 'upper_glute_1', movement_pattern: 'empurrar_horizontal', intensity: 'high', priority: 1 },
                    { id: 'upper_glute_2', movement_pattern: 'puxar_horizontal', intensity: 'high', priority: 2 },
                    { id: 'upper_glute_3', movement_pattern: 'hinge', intensity: 'low', target_muscles: ['gluteos'], priority: 3 },
                    { id: 'upper_glute_4', movement_pattern: 'isolar_ombro', intensity: 'low', priority: 4 },
                    { id: 'upper_glute_5', movement_pattern: 'isolar_biceps', intensity: 'very_low', priority: 5 },
                    { id: 'upper_glute_6', movement_pattern: 'isolar_triceps', intensity: 'very_low', priority: 6 }
                ]
            },
            {
                day_id: 'glute_b',
                label: 'Glúteo B - Volume',
                slots: [
                    { id: 'glute_b_1', movement_pattern: 'hinge', intensity: 'high', target_muscles: ['gluteos'], priority: 1 },
                    { id: 'glute_b_2', movement_pattern: 'agachar', intensity: 'moderate', priority: 2 },
                    { id: 'glute_b_3', movement_pattern: 'hinge', intensity: 'moderate', target_muscles: ['gluteos'], priority: 3 },
                    { id: 'glute_b_4', movement_pattern: 'hinge', intensity: 'low', target_muscles: ['gluteos'], priority: 4 },
                    { id: 'glute_b_5', movement_pattern: 'core', intensity: 'low', priority: 5 }
                ]
            },
            {
                day_id: 'lower_complete',
                label: 'Lower Completo',
                slots: [
                    { id: 'lower_complete_1', movement_pattern: 'agachar', intensity: 'high', priority: 1 },
                    { id: 'lower_complete_2', movement_pattern: 'hinge', intensity: 'high', priority: 2 },
                    { id: 'lower_complete_3', movement_pattern: 'agachar', intensity: 'moderate', priority: 3 },
                    { id: 'lower_complete_4', movement_pattern: 'hinge', intensity: 'moderate', target_muscles: ['gluteos'], priority: 4 },
                    { id: 'lower_complete_5', movement_pattern: 'isolar_panturrilha', intensity: 'low', priority: 5 }
                ]
            }
        ]
    }
];

// ============ SELEÇÃO DE TEMPLATE ============

export function selectTemplate(
    goal: string,
    daysPerWeek: number,
    level: string
): WorkoutTemplate | null {
    const goalLower = goal.toLowerCase();
    const levelNorm = normalizeLevel(level);

    // Filtra compatíveis
    const compatible = WORKOUT_TEMPLATES.filter(t => {
        if (!t.suitable_levels.includes(levelNorm)) return false;
        if (Math.abs(t.frequency - daysPerWeek) > 1) return false;
        return true;
    });

    if (compatible.length === 0) {
        return WORKOUT_TEMPLATES.find(t => t.template_id === 'full_body_3') || null;
    }

    // Prioriza por objetivo
    const byGoal = compatible.filter(t =>
        t.suitable_goals.some(g => goalLower.includes(g))
    );

    if (byGoal.length > 0) {
        return byGoal.reduce((best, curr) =>
            Math.abs(curr.frequency - daysPerWeek) < Math.abs(best.frequency - daysPerWeek) ? curr : best
        );
    }

    return compatible.reduce((best, curr) =>
        Math.abs(curr.frequency - daysPerWeek) < Math.abs(best.frequency - daysPerWeek) ? curr : best
    );
}

function normalizeLevel(level: string): TrainingLevel {
    const l = level.toLowerCase();
    if (l.includes('inic')) return 'iniciante';
    if (l.includes('inter')) return 'intermediario';
    if (l.includes('avanc')) return 'avancado';
    if (l.includes('atlet')) return 'atleta';
    return 'intermediario';
}
