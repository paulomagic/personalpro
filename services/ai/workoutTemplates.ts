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
    // ====== AB 2x (INICIANTE/TEMPO LIMITADO) ======
    {
        template_id: 'ab_2',
        name: 'AB Superior/Inferior 2x',
        frequency: 2,
        suitable_goals: ['hipertrofia', 'condicionamento', 'saude', 'emagrecimento'],
        suitable_levels: ['iniciante', 'intermediario'],
        weekly_volume_guideline: { min_sets: 6, max_sets: 10 },
        days: [
            // A: SUPERIOR COMPLETO
            {
                day_id: 'upper_full',
                label: 'A - Superior Completo',
                slots: [
                    { id: 'uf_1', movement_pattern: 'empurrar_horizontal', intensity: 'high', priority: 1 },
                    { id: 'uf_2', movement_pattern: 'puxar_horizontal', intensity: 'high', priority: 2 },
                    { id: 'uf_3', movement_pattern: 'empurrar_vertical', intensity: 'moderate', priority: 3 },
                    { id: 'uf_4', movement_pattern: 'puxar_vertical', intensity: 'moderate', priority: 4 },
                    { id: 'uf_5', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 5 },
                    { id: 'uf_6', movement_pattern: 'isolar_triceps', intensity: 'low', priority: 6 }
                ]
            },
            // B: INFERIOR COMPLETO
            {
                day_id: 'lower_full',
                label: 'B - Inferior Completo',
                slots: [
                    { id: 'lf_1', movement_pattern: 'agachar', intensity: 'high', priority: 1 },
                    { id: 'lf_2', movement_pattern: 'hinge', intensity: 'high', priority: 2 },
                    { id: 'lf_3', movement_pattern: 'agachar', intensity: 'moderate', priority: 3 },
                    { id: 'lf_4', movement_pattern: 'hinge', intensity: 'moderate', target_muscles: ['gluteos'], priority: 4 },
                    { id: 'lf_5', movement_pattern: 'isolar_panturrilha', intensity: 'low', priority: 5 },
                    { id: 'lf_6', movement_pattern: 'core', intensity: 'low', priority: 6 }
                ]
            }
        ]
    },

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
    },

    // ====== BRO SPLIT 5x (CLÁSSICO) ======
    {
        template_id: 'bro_split_5',
        name: 'Bro Split 5x',
        frequency: 5,
        suitable_goals: ['hipertrofia', 'forca'],
        suitable_levels: ['intermediario', 'avancado', 'atleta'],
        weekly_volume_guideline: { min_sets: 16, max_sets: 24 },
        days: [
            // A: PEITO + TRÍCEPS
            {
                day_id: 'chest_triceps',
                label: 'A - Peito e Tríceps',
                slots: [
                    { id: 'ct_1', movement_pattern: 'empurrar_horizontal', intensity: 'very_high', preferred_load: 'axial', priority: 1 },
                    { id: 'ct_2', movement_pattern: 'empurrar_horizontal', intensity: 'high', priority: 2 },
                    { id: 'ct_3', movement_pattern: 'empurrar_horizontal', intensity: 'moderate', priority: 3 },
                    { id: 'ct_4', movement_pattern: 'empurrar_horizontal', intensity: 'low', priority: 4 },
                    { id: 'ct_5', movement_pattern: 'isolar_triceps', intensity: 'moderate', priority: 5 },
                    { id: 'ct_6', movement_pattern: 'isolar_triceps', intensity: 'low', priority: 6 }
                ]
            },
            // B: QUADRÍCEPS + GLÚTEO + PANTURRILHA
            {
                day_id: 'quads_glutes',
                label: 'B - Quadríceps, Glúteo e Panturrilha',
                slots: [
                    { id: 'qg_1', movement_pattern: 'agachar', intensity: 'very_high', preferred_load: 'axial', priority: 1 },
                    { id: 'qg_2', movement_pattern: 'agachar', intensity: 'high', priority: 2 },
                    { id: 'qg_3', movement_pattern: 'hinge', intensity: 'high', target_muscles: ['gluteos'], priority: 3 },
                    { id: 'qg_4', movement_pattern: 'agachar', intensity: 'moderate', priority: 4 },
                    { id: 'qg_5', movement_pattern: 'hinge', intensity: 'moderate', target_muscles: ['gluteos'], priority: 5 },
                    { id: 'qg_6', movement_pattern: 'isolar_panturrilha', intensity: 'moderate', priority: 6 },
                    { id: 'qg_7', movement_pattern: 'isolar_panturrilha', intensity: 'low', priority: 7 }
                ]
            },
            // C: COSTAS + BÍCEPS
            {
                day_id: 'back_biceps',
                label: 'C - Costas e Bíceps',
                slots: [
                    { id: 'bb_1', movement_pattern: 'puxar_vertical', intensity: 'very_high', priority: 1 },
                    { id: 'bb_2', movement_pattern: 'puxar_horizontal', intensity: 'high', priority: 2 },
                    { id: 'bb_3', movement_pattern: 'puxar_horizontal', intensity: 'moderate', priority: 3 },
                    { id: 'bb_4', movement_pattern: 'puxar_vertical', intensity: 'moderate', priority: 4 },
                    { id: 'bb_5', movement_pattern: 'isolar_biceps', intensity: 'moderate', priority: 5 },
                    { id: 'bb_6', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 6 }
                ]
            },
            // D: OMBRO + TRAPÉZIO
            {
                day_id: 'shoulders',
                label: 'D - Ombro e Trapézio',
                slots: [
                    { id: 'sh_1', movement_pattern: 'empurrar_vertical', intensity: 'very_high', priority: 1 },
                    { id: 'sh_2', movement_pattern: 'empurrar_vertical', intensity: 'high', priority: 2 },
                    { id: 'sh_3', movement_pattern: 'isolar_ombro', intensity: 'moderate', priority: 3 },
                    { id: 'sh_4', movement_pattern: 'isolar_ombro', intensity: 'moderate', priority: 4 },
                    { id: 'sh_5', movement_pattern: 'isolar_ombro', intensity: 'low', priority: 5 },
                    { id: 'sh_6', movement_pattern: 'isolar_ombro', intensity: 'low', priority: 6 }
                ]
            },
            // E: POSTERIOR DE COXA + PANTURRILHA
            {
                day_id: 'hamstrings',
                label: 'E - Posterior de Coxa e Panturrilha',
                slots: [
                    { id: 'hm_1', movement_pattern: 'hinge', intensity: 'very_high', preferred_load: 'axial', target_muscles: ['posterior_coxa'], priority: 1 },
                    { id: 'hm_2', movement_pattern: 'hinge', intensity: 'high', target_muscles: ['posterior_coxa'], priority: 2 },
                    { id: 'hm_3', movement_pattern: 'hinge', intensity: 'moderate', target_muscles: ['posterior_coxa'], priority: 3 },
                    { id: 'hm_4', movement_pattern: 'hinge', intensity: 'moderate', target_muscles: ['gluteos'], priority: 4 },
                    { id: 'hm_5', movement_pattern: 'isolar_panturrilha', intensity: 'moderate', priority: 5 },
                    { id: 'hm_6', movement_pattern: 'isolar_panturrilha', intensity: 'low', priority: 6 }
                ]
            }
        ]
    },

    // ====== ABC 3x (INICIANTE) ======
    {
        template_id: 'abc_3',
        name: 'ABC Iniciante 3x',
        frequency: 3,
        suitable_goals: ['hipertrofia', 'condicionamento', 'saude'],
        suitable_levels: ['iniciante'],
        weekly_volume_guideline: { min_sets: 8, max_sets: 12 },
        days: [
            // A: PEITO + OMBRO + TRÍCEPS
            {
                day_id: 'push_day',
                label: 'A - Peito, Ombro e Tríceps',
                slots: [
                    { id: 'pd_1', movement_pattern: 'empurrar_horizontal', intensity: 'high', priority: 1 },
                    { id: 'pd_2', movement_pattern: 'empurrar_horizontal', intensity: 'moderate', priority: 2 },
                    { id: 'pd_3', movement_pattern: 'empurrar_vertical', intensity: 'moderate', priority: 3 },
                    { id: 'pd_4', movement_pattern: 'isolar_ombro', intensity: 'low', priority: 4 },
                    { id: 'pd_5', movement_pattern: 'isolar_triceps', intensity: 'low', priority: 5 }
                ]
            },
            // B: COSTAS + BÍCEPS
            {
                day_id: 'pull_day',
                label: 'B - Costas e Bíceps',
                slots: [
                    { id: 'pld_1', movement_pattern: 'puxar_vertical', intensity: 'high', priority: 1 },
                    { id: 'pld_2', movement_pattern: 'puxar_horizontal', intensity: 'high', priority: 2 },
                    { id: 'pld_3', movement_pattern: 'puxar_horizontal', intensity: 'moderate', priority: 3 },
                    { id: 'pld_4', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 4 },
                    { id: 'pld_5', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 5 }
                ]
            },
            // C: PERNAS COMPLETO
            {
                day_id: 'legs_day',
                label: 'C - Pernas Completo',
                slots: [
                    { id: 'ld_1', movement_pattern: 'agachar', intensity: 'high', priority: 1 },
                    { id: 'ld_2', movement_pattern: 'hinge', intensity: 'high', priority: 2 },
                    { id: 'ld_3', movement_pattern: 'agachar', intensity: 'moderate', priority: 3 },
                    { id: 'ld_4', movement_pattern: 'hinge', intensity: 'moderate', priority: 4 },
                    { id: 'ld_5', movement_pattern: 'isolar_panturrilha', intensity: 'low', priority: 5 }
                ]
            }
        ]
    },

    // ====== ABCD 4x (INTERMEDIÁRIO) ======
    {
        template_id: 'abcd_4',
        name: 'ABCD 4x',
        frequency: 4,
        suitable_goals: ['hipertrofia', 'forca'],
        suitable_levels: ['intermediario', 'avancado'],
        weekly_volume_guideline: { min_sets: 12, max_sets: 18 },
        days: [
            // A: PEITO + TRÍCEPS
            {
                day_id: 'abcd_chest',
                label: 'A - Peito e Tríceps',
                slots: [
                    { id: 'ac_1', movement_pattern: 'empurrar_horizontal', intensity: 'very_high', priority: 1 },
                    { id: 'ac_2', movement_pattern: 'empurrar_horizontal', intensity: 'high', priority: 2 },
                    { id: 'ac_3', movement_pattern: 'empurrar_horizontal', intensity: 'moderate', priority: 3 },
                    { id: 'ac_4', movement_pattern: 'isolar_triceps', intensity: 'moderate', priority: 4 },
                    { id: 'ac_5', movement_pattern: 'isolar_triceps', intensity: 'low', priority: 5 }
                ]
            },
            // B: COSTAS + BÍCEPS
            {
                day_id: 'abcd_back',
                label: 'B - Costas e Bíceps',
                slots: [
                    { id: 'ab_1', movement_pattern: 'puxar_vertical', intensity: 'very_high', priority: 1 },
                    { id: 'ab_2', movement_pattern: 'puxar_horizontal', intensity: 'high', priority: 2 },
                    { id: 'ab_3', movement_pattern: 'puxar_horizontal', intensity: 'moderate', priority: 3 },
                    { id: 'ab_4', movement_pattern: 'isolar_biceps', intensity: 'moderate', priority: 4 },
                    { id: 'ab_5', movement_pattern: 'isolar_biceps', intensity: 'low', priority: 5 }
                ]
            },
            // C: OMBRO + TRAPÉZIO
            {
                day_id: 'abcd_shoulders',
                label: 'C - Ombro e Trapézio',
                slots: [
                    { id: 'as_1', movement_pattern: 'empurrar_vertical', intensity: 'very_high', priority: 1 },
                    { id: 'as_2', movement_pattern: 'empurrar_vertical', intensity: 'high', priority: 2 },
                    { id: 'as_3', movement_pattern: 'isolar_ombro', intensity: 'moderate', priority: 3 },
                    { id: 'as_4', movement_pattern: 'isolar_ombro', intensity: 'low', priority: 4 },
                    { id: 'as_5', movement_pattern: 'isolar_ombro', intensity: 'low', priority: 5 }
                ]
            },
            // D: PERNAS COMPLETO
            {
                day_id: 'abcd_legs',
                label: 'D - Pernas Completo',
                slots: [
                    { id: 'al_1', movement_pattern: 'agachar', intensity: 'very_high', priority: 1 },
                    { id: 'al_2', movement_pattern: 'hinge', intensity: 'high', priority: 2 },
                    { id: 'al_3', movement_pattern: 'agachar', intensity: 'moderate', priority: 3 },
                    { id: 'al_4', movement_pattern: 'hinge', intensity: 'moderate', priority: 4 },
                    { id: 'al_5', movement_pattern: 'isolar_panturrilha', intensity: 'moderate', priority: 5 },
                    { id: 'al_6', movement_pattern: 'core', intensity: 'low', priority: 6 }
                ]
            }
        ]
    },

    // ====== POWERBUILDING 4x (FORÇA + HIPERTROFIA) ======
    {
        template_id: 'powerbuilding_4',
        name: 'Powerbuilding (Força + Hipertrofia)',
        frequency: 4,
        suitable_goals: ['forca', 'hipertrofia'],
        suitable_levels: ['intermediario', 'avancado', 'atleta'],
        weekly_volume_guideline: { min_sets: 14, max_sets: 22 },
        days: [
            // DIA 1: UPPER POWER (Força 3-5 reps)
            {
                day_id: 'upper_power',
                label: 'Upper Power (Força)',
                notes: 'Foco em carga máxima, 3-5 reps, compostos com barra',
                slots: [
                    { id: 'up_1', movement_pattern: 'empurrar_horizontal', intensity: 'very_high', target_muscles: ['peito'], priority: 1 },
                    { id: 'up_2', movement_pattern: 'puxar_horizontal', intensity: 'very_high', target_muscles: ['costas'], priority: 2 },
                    { id: 'up_3', movement_pattern: 'empurrar_vertical', intensity: 'high', target_muscles: ['ombro'], priority: 3 },
                    { id: 'up_4', movement_pattern: 'puxar_vertical', intensity: 'high', target_muscles: ['costas'], priority: 4 }
                ]
            },
            // DIA 2: LOWER POWER (Força 3-5 reps)
            {
                day_id: 'lower_power',
                label: 'Lower Power (Força)',
                notes: 'Agachamento e Terra pesados, 3-5 reps',
                slots: [
                    { id: 'lp_1', movement_pattern: 'agachar', intensity: 'very_high', target_muscles: ['quadriceps'], priority: 1 },
                    { id: 'lp_2', movement_pattern: 'hinge', intensity: 'very_high', target_muscles: ['gluteos', 'posterior'], priority: 2 },
                    { id: 'lp_3', movement_pattern: 'agachar', intensity: 'high', target_muscles: ['quadriceps'], priority: 3 },
                    { id: 'lp_4', movement_pattern: 'isolar_panturrilha', intensity: 'moderate', priority: 4 }
                ]
            },
            // DIA 3: UPPER HYPERTROPHY (Volume 8-12 reps)
            {
                day_id: 'upper_hypertrophy',
                label: 'Upper Hypertrophy (Volume)',
                notes: 'Foco em volume e amplitude, 8-12 reps, halteres e máquinas',
                slots: [
                    { id: 'uh_1', movement_pattern: 'empurrar_horizontal', intensity: 'moderate', target_muscles: ['peito'], priority: 1 },
                    { id: 'uh_2', movement_pattern: 'puxar_vertical', intensity: 'moderate', target_muscles: ['costas'], priority: 2 },
                    { id: 'uh_3', movement_pattern: 'isolar_ombro', intensity: 'low', target_muscles: ['ombro'], priority: 3 },
                    { id: 'uh_4', movement_pattern: 'isolar_biceps', intensity: 'low', target_muscles: ['biceps'], priority: 4 },
                    { id: 'uh_5', movement_pattern: 'isolar_triceps', intensity: 'low', target_muscles: ['triceps'], priority: 5 }
                ]
            },
            // DIA 4: LOWER HYPERTROPHY (Volume 8-12 reps)
            {
                day_id: 'lower_hypertrophy',
                label: 'Lower Hypertrophy (Volume)',
                notes: 'Foco em isolamento e volume, 8-12 reps',
                slots: [
                    { id: 'lh_1', movement_pattern: 'agachar', intensity: 'moderate', target_muscles: ['quadriceps'], priority: 1 },
                    { id: 'lh_2', movement_pattern: 'hinge', intensity: 'moderate', target_muscles: ['gluteos'], priority: 2 },
                    { id: 'lh_3', movement_pattern: 'agachar', intensity: 'low', target_muscles: ['quadriceps'], priority: 3 },
                    { id: 'lh_4', movement_pattern: 'hinge', intensity: 'low', target_muscles: ['posterior'], priority: 4 },
                    { id: 'lh_5', movement_pattern: 'isolar_panturrilha', intensity: 'moderate', priority: 5 }
                ]
            }
        ]
    },

    // ====== LONGEVIDADE ATIVA 2x (IDOSOS +60) ======
    {
        template_id: 'senior_longevity_2',
        name: 'Longevidade Ativa (+60)',
        frequency: 2,
        suitable_goals: ['saude', 'condicionamento'],
        suitable_levels: ['iniciante'],
        weekly_volume_guideline: { min_sets: 6, max_sets: 10 },
        days: [
            // DIA A: FULL BODY POSTURAL
            {
                day_id: 'senior_a',
                label: 'Full Body A (Postural)',
                notes: 'APENAS máquinas, foco em segurança e postura',
                slots: [
                    { id: 'sa_1', movement_pattern: 'agachar', intensity: 'moderate', target_muscles: ['quadriceps'], priority: 1 },
                    { id: 'sa_2', movement_pattern: 'puxar_horizontal', intensity: 'moderate', target_muscles: ['costas'], priority: 2 },
                    { id: 'sa_3', movement_pattern: 'empurrar_horizontal', intensity: 'moderate', target_muscles: ['peito'], priority: 3 },
                    { id: 'sa_4', movement_pattern: 'core', intensity: 'low', target_muscles: ['core'], priority: 4 }
                ]
            },
            // DIA B: FULL BODY FUNCIONAL
            {
                day_id: 'senior_b',
                label: 'Full Body B (Funcional)',
                notes: 'Foco em movimentos funcionais: sentar, levantar, puxar',
                slots: [
                    { id: 'sb_1', movement_pattern: 'agachar', intensity: 'low', target_muscles: ['quadriceps'], priority: 1 },
                    { id: 'sb_2', movement_pattern: 'puxar_vertical', intensity: 'moderate', target_muscles: ['costas'], priority: 2 },
                    { id: 'sb_3', movement_pattern: 'isolar_ombro', intensity: 'low', target_muscles: ['ombro'], priority: 3 },
                    { id: 'sb_4', movement_pattern: 'isolar_panturrilha', intensity: 'low', target_muscles: ['panturrilha'], priority: 4 }
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

    // PRIORIDADE 1: Idoso/Longevidade → Template Senior (SEGURANÇA)
    if (level.toLowerCase().includes('idoso') || level.toLowerCase().includes('senior') ||
        goalLower.includes('longevidade') || goalLower.includes('qualidade')) {
        const senior = WORKOUT_TEMPLATES.find(t => t.template_id === 'senior_longevity_2');
        if (senior) {
            console.log('[TemplateSelector] Idoso/Longevidade detectado → Senior template');
            return senior;
        }
    }

    // PRIORIDADE 2: Força explícita → Powerbuilding
    if (goalLower.includes('força') || goalLower.includes('forca') || goalLower.includes('powerlifting')) {
        const powerbuilding = WORKOUT_TEMPLATES.find(t => t.template_id === 'powerbuilding_4');
        if (powerbuilding && ['intermediario', 'avancado', 'atleta'].includes(levelNorm)) {
            console.log('[TemplateSelector] Força detectada → Powerbuilding template');
            return powerbuilding;
        }
    }

    // Filtra compatíveis (lógica original)
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
