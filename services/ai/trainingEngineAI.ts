import { aiRouter } from './aiRouter';
import type { Exercise } from '../exerciseService';
import type { TrainingSlot } from './workoutTemplates';
import type { SpecialCondition } from './knowledge/specialConditions';
import type { BiomechanicalRestrictions } from './knowledge/conditionDetection';
import { buildDynamicSystemPrompt, buildUserPrompt, type ClientContext } from './prompts/systemPromptBuilder';
import { validateAIResponse, findSafeAlternative } from './validation/exerciseValidator';
import { getRelevantRules, formatRulesForPrompt } from './knowledge/exerciseOntology';
import type { BiomechanicalProfile } from './biomechanicalProfile';
import { createScopedLogger } from '../appLogger';

export interface WorkoutAIContext {
    clientName: string;
    level: string;
    goal: string;
    injuries: string;
    observations: string;
    specialConditions: SpecialCondition[];
    age?: number;
    conditions: Array<{ type: string; location?: string; notes?: string }>;
    restrictions: BiomechanicalRestrictions;
    biomechProfile: BiomechanicalProfile;
}

let currentWorkoutContext: WorkoutAIContext | null = null;
const trainingEngineAILogger = createScopedLogger('trainingEngineAI');

const MAX_AI_RETRIES = 0;

export function setWorkoutAIContext(context: WorkoutAIContext | null) {
    currentWorkoutContext = context;
}

export function shouldPrioritizeAISlot(slot: TrainingSlot): boolean {
    if (slot.intensity === 'high' || slot.intensity === 'very_high') return true;
    return [
        'agachar',
        'hinge',
        'empurrar_horizontal',
        'empurrar_vertical',
        'puxar_horizontal',
        'puxar_vertical'
    ].includes(slot.movement_pattern);
}

export async function selectSlotExerciseWithAI(
    slot: TrainingSlot,
    candidateExercises: Exercise[]
): Promise<Exercise> {
    if (candidateExercises.length < 2) {
        return candidateExercises[0];
    }

    const ctx = currentWorkoutContext || {
        clientName: 'Aluno',
        level: 'Intermediário',
        goal: 'Hipertrofia',
        injuries: 'Nenhuma',
        observations: '',
        specialConditions: [] as SpecialCondition[],
        conditions: [],
        restrictions: {
            avoid_axial_load: false,
            avoid_spinal_shear: false,
            avoid_knee_shear: false,
            avoid_deep_knee_flexion: false,
            avoid_shoulder_overhead: false,
            avoid_spinal_flexion: false,
            avoid_spinal_rotation: false,
            avoid_hip_impact: false,
            max_impact_level: 'high' as const,
            requires_supervision: false,
            prefer_machines: false,
            volume_modifier: 1.0,
            intensity_modifier: 1.0
        },
        biomechProfile: {} as BiomechanicalProfile
    };

    const clientContext: ClientContext = {
        alias: ctx.clientName,
        age: ctx.age,
        level: ctx.level,
        goal: ctx.goal,
        injuriesSummary: ctx.injuries,
        observationsSummary: ctx.observations,
        conditions: ctx.conditions || [],
        specialConditions: ctx.specialConditions || [],
        restrictions: ctx.restrictions,
        biomechProfile: ctx.biomechProfile
    };

    const relevantRules = getRelevantRules({
        conditions: ctx.conditions || [],
        specialConditions: ctx.specialConditions || [],
        age: ctx.age,
        level: ctx.level,
        goal: ctx.goal
    });
    const rulesContext = formatRulesForPrompt(relevantRules);
    const systemPrompt = buildDynamicSystemPrompt(clientContext) + rulesContext;

    const candidatesList = candidateExercises.map((exercise, index) => ({
        num: index + 1,
        name: exercise.name,
        equipment: exercise.equipment?.join(', ') || 'variado',
        is_machine: exercise.is_machine,
        is_compound: exercise.is_compound,
        spinal_load: exercise.spinal_load
    }));

    const userPrompt = buildUserPrompt(
        clientContext,
        {
            movement_pattern: slot.movement_pattern,
            target_muscle: slot.target_muscles?.[0],
            intensity: slot.intensity,
            candidateCount: candidateExercises.length
        },
        candidatesList
    );

    const validationContext = {
        conditions: ctx.conditions || [],
        restrictions: ctx.restrictions,
        biomechProfile: ctx.biomechProfile,
        level: ctx.level,
        goal: ctx.goal
    };

    for (let attempt = 0; attempt <= MAX_AI_RETRIES; attempt++) {
        try {
            const result = await aiRouter.execute({
                action: 'training_intent',
                prompt: `${systemPrompt}\n\n${userPrompt}`,
                metadata: {
                    slot_id: slot.id,
                    type: 'exercise_selection_v3',
                    client_level: ctx.level,
                    client_goal: ctx.goal,
                    has_injuries: ctx.injuries !== 'Nenhuma' && ctx.injuries !== '',
                    conditions_count: (ctx.conditions || []).length,
                    attempt: attempt + 1,
                    rules_injected: relevantRules.length
                }
            });

            if (result.success && result.text) {
                const validation = validateAIResponse(
                    result.text,
                    candidateExercises,
                    validationContext
                );

                if (validation.valid && validation.selectedExercise) {
                    return validation.selectedExercise;
                }

                const hasNonRecoverableSelectedSchemaError = validation.violations.some((violation) => {
                    const normalized = violation.toLowerCase();
                    return normalized.includes('erro de schema')
                        && normalized.includes('selected')
                        && (normalized.includes('nan') || normalized.includes('number'));
                });

                if (hasNonRecoverableSelectedSchemaError) {
                    const safeAlternative = findSafeAlternative(candidateExercises, validationContext);
                    if (safeAlternative) return safeAlternative;
                    break;
                }

                if (attempt === MAX_AI_RETRIES) {
                    const safeAlternative = findSafeAlternative(candidateExercises, validationContext);
                    if (safeAlternative) {
                        return safeAlternative;
                    }
                }
            }
        } catch (error) {
            trainingEngineAILogger.warn('Error selecting slot exercise with AI', {
                attempt: attempt + 1,
                slotId: slot.id,
                movementPattern: slot.movement_pattern,
                error
            });
        }
    }

    return candidateExercises[0];
}
