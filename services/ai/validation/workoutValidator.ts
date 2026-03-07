// Validação de treinos gerados
// Previne duplicatas, garante cobertura muscular e distribui volume

import type { ResolvedSlot, ResolvedDay, GeneratedWorkout } from '../trainingEngineTypes';
import type { WorkoutTemplate } from '../workoutTemplates';
import type { Exercise } from '../../exerciseService';

export interface DuplicateValidationResult {
    valid: boolean;
    duplicates: Array<{
        exerciseName: string;
        occurrences: number;
        slotIds: string[];
    }>;
    warnings: string[];
}

export interface MuscleGroupCoverage {
    muscleGroup: string;
    required: boolean;
    covered: boolean;
    exercises: string[];
    count: number;
}

export interface MuscleCoverageResult {
    valid: boolean;
    missing: string[];
    covered: MuscleGroupCoverage[];
    warnings: string[];
}

export interface WorkoutValidationResult {
    valid: boolean;
    duplicates: DuplicateValidationResult;
    muscleCoverage: MuscleCoverageResult;
    warnings: string[];
    errors: string[];
}

/**
 * VALIDAÇÃO DE DUPLICATAS POR DIA
 * Detecta e reporta exercícios repetidos no mesmo treino
 */
export function validateNoDuplicatesInDay(
    slots: ResolvedSlot[],
    dayLabel?: string
): DuplicateValidationResult {
    const exerciseMap = new Map<string, { count: number; slotIds: string[] }>();
    const duplicates: DuplicateValidationResult['duplicates'] = [];

    // Contar ocorrências
    slots.forEach(slot => {
        if (!slot.selected) return;

        const exerciseName = slot.selected.name.toLowerCase().trim();
        const existing = exerciseMap.get(exerciseName);

        if (existing) {
            exerciseMap.set(exerciseName, {
                count: existing.count + 1,
                slotIds: [...existing.slotIds, slot.slot_id]
            });
        } else {
            exerciseMap.set(exerciseName, {
                count: 1,
                slotIds: [slot.slot_id]
            });
        }
    });

    // Identificar duplicatas
    exerciseMap.forEach((data, name) => {
        if (data.count > 1) {
            duplicates.push({
                exerciseName: name,
                occurrences: data.count,
                slotIds: data.slotIds
            });
        }
    });

    const warnings = duplicates.map(d =>
        `❌ DUPLICATA: "${d.exerciseName}" aparece ${d.occurrences}x${dayLabel ? ` em ${dayLabel}` : ''}`
    );

    return {
        valid: duplicates.length === 0,
        duplicates,
        warnings
    };
}

/**
 * VALIDAÇÃO DE COBERTURA MUSCULAR
 * Garante que todos os grupos musculares importantes foram trabalhados
 */
export function validateMuscleCoverage(
    template: WorkoutTemplate,
    generatedDays: ResolvedDay[]
): MuscleCoverageResult {
    // Definir grupos musculares obrigatórios por template
    const requiredMuscles = getRequiredMusclesForTemplate(template.template_id);

    const coverage: MuscleGroupCoverage[] = requiredMuscles.map(muscle => {
        const exercises = generatedDays.flatMap(day =>
            day.slots
                .filter(slot => slot.selected)
                .filter(slot => targetsMuscle(slot.selected!, muscle))
                .map(slot => slot.selected!.name)
        );

        return {
            muscleGroup: muscle,
            required: true,
            covered: exercises.length > 0,
            exercises,
            count: exercises.length
        };
    });

    const missing = coverage
        .filter(c => !c.covered)
        .map(c => c.muscleGroup);

    const warnings = missing.map(m =>
        `⚠️  Grupo muscular NÃO COBERTO: ${m}`
    );

    return {
        valid: missing.length === 0,
        missing,
        covered: coverage,
        warnings
    };
}

/**
 * VALIDAÇÃO COMPLETA DO TREINO
 * Executa todas as validações e retorna relatório completo
 */
export function validateWorkout(
    template: WorkoutTemplate,
    workout: GeneratedWorkout
): WorkoutValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validar duplicatas em cada dia
    const duplicatesResults = workout.days.map(day =>
        validateNoDuplicatesInDay(day.slots, day.label)
    );

    const allDuplicates = duplicatesResults.reduce((acc, result) => ({
        valid: acc.valid && result.valid,
        duplicates: [...acc.duplicates, ...result.duplicates],
        warnings: [...acc.warnings, ...result.warnings]
    }), { valid: true, duplicates: [], warnings: [] } as DuplicateValidationResult);

    warnings.push(...allDuplicates.warnings);
    if (!allDuplicates.valid) {
        errors.push('Duplicatas detectadas em um ou mais treinos');
    }

    // 2. Validar cobertura muscular
    const muscleCoverage = validateMuscleCoverage(template, workout.days);
    warnings.push(...muscleCoverage.warnings);
    if (!muscleCoverage.valid) {
        errors.push(`Grupos musculares não cobertos: ${muscleCoverage.missing.join(', ')}`);
    }

    return {
        valid: allDuplicates.valid && muscleCoverage.valid,
        duplicates: allDuplicates,
        muscleCoverage,
        warnings,
        errors
    };
}

/**
 * CORREÇÃO AUTOMÁTICA DE DUPLICATAS
 * Remove duplicatas mantendo apenas a primeira ocorrência
 */
export function removeDuplicatesFromDay(slots: ResolvedSlot[]): {
    cleaned: ResolvedSlot[];
    removed: string[];
} {
    const seenExercises = new Set<string>();
    const removed: string[] = [];

    const cleaned = slots.filter(slot => {
        if (!slot.selected) return true;

        const exerciseName = slot.selected.name.toLowerCase().trim();

        if (seenExercises.has(exerciseName)) {
            removed.push(slot.selected.name);
            console.warn(`[Validator] 🔄 Removendo duplicata: ${slot.selected.name} (slot ${slot.slot_id})`);
            return false;
        }

        seenExercises.add(exerciseName);
        return true;
    });

    return { cleaned, removed };
}

// ============ HELPERS ============

/**
 * Mapear grupos musculares obrigatórios por template
 */
function getRequiredMusclesForTemplate(templateId: string): string[] {
    const muscleMap: Record<string, string[]> = {
        'upper_lower_4': [
            'peito', 'costas', 'ombro', 'biceps', 'triceps',  // Upper
            'quadriceps', 'gluteos', 'posterior_coxa', 'panturrilha'  // Lower ← CRÍTICO
        ],
        'ppl_6': [
            'peito', 'ombro', 'triceps',  // Push
            'costas', 'biceps',           // Pull
            'quadriceps', 'gluteos', 'posterior_coxa', 'panturrilha'  // Legs
        ],
        'full_body_3': [
            'peito', 'costas', 'quadriceps', 'gluteos', 'core'
        ],
        'ab_2': [
            'peito', 'costas', 'ombro', 'quadriceps', 'gluteos'
        ],
        'glute_focus_4': [
            'gluteos', 'posterior_coxa', 'quadriceps', 'peito', 'costas'
        ],
        'bro_split_5': [
            'peito', 'costas', 'ombro', 'biceps', 'triceps',
            'quadriceps', 'gluteos', 'posterior_coxa', 'panturrilha'
        ]
    };

    return muscleMap[templateId] || ['peito', 'costas', 'pernas'];
}

/**
 * Verificar se exercício trabalha músculo alvo
 */
function targetsMuscle(exercise: Exercise, muscle: string): boolean {
    const muscleLower = muscle.toLowerCase().trim();

    // Normalizar variações
    const muscleVariations: Record<string, string[]> = {
        'posterior_coxa': ['posterior', 'isquiotibiais', 'femoral'],
        'gluteos': ['glúteo', 'glúteos', 'gluteo', 'gluteos'],
        'quadriceps': ['quadríceps', 'quadriceps', 'coxa'],
        'panturrilha': ['panturrilha', 'panturrilhas', 'gastrocnêmio'],
        'biceps': ['bíceps', 'biceps'],
        'triceps': ['tríceps', 'triceps']
    };

    const variations = muscleVariations[muscleLower] || [muscleLower];

    // Check primary muscle
    const primaryMatch = variations.some(v =>
        exercise.primary_muscle?.toLowerCase().includes(v)
    );

    // Check secondary muscles
    const secondaryMatch = exercise.secondary_muscles?.some(sm =>
        variations.some(v => sm.toLowerCase().includes(v))
    );

    return primaryMatch || secondaryMatch;
}
