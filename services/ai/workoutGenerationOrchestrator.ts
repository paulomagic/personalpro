import type { Client } from '../../types';
import type { AdaptiveTrainingSignal } from './adaptiveSignalTypes';
import { applyColdStartProtocol, generateSmartWorkout, isColdStartClient, type AIBuilderExercise } from './aiBuilderWorkoutUtils';
import type { InjuryRiskAssessment } from './injuryRiskService';
import {
    applyPrecisionGuardrailsToMicrocycle,
    buildPrecisionPromptContext,
    type PrecisionProfileResolution
} from './progressionPrecisionService';
import { buildWeeklyMicrocyclePlan } from './weeklyProgressionEngine';

interface WorkoutGenerationRequest {
    client: Client;
    goal: string;
    selectedDays: number;
    observations: string;
    adaptiveSignal: AdaptiveTrainingSignal | null;
    injuryRisk: InjuryRiskAssessment;
    precisionProfile: PrecisionProfileResolution | null;
    ensureExerciseCatalog: () => Promise<AIBuilderExercise[]>;
    mapToLocalExercises: (aiResult: any, localExercises: AIBuilderExercise[]) => any;
}

export interface WorkoutGenerationMetadata {
    source: 'training_engine' | 'ai_router' | 'local';
    provider: string;
    fallbackUsed: boolean;
    coldStartMode: boolean;
    adjustedDaysPerWeek: number;
    adaptiveReadiness?: number;
    injuryRiskScore: number;
    injuryRiskLevel: string;
    precisionSegment?: string;
}

interface WorkoutGenerationResult {
    workout: any;
    metadata: WorkoutGenerationMetadata;
}

interface LocalFallbackParams {
    client: Client;
    observations: string;
    injuryRisk: InjuryRiskAssessment;
    adaptiveSignal: AdaptiveTrainingSignal | null;
    precisionProfile: PrecisionProfileResolution | null;
    selectedDays: number;
    goal: string;
    ensureExerciseCatalog: () => Promise<AIBuilderExercise[]>;
}

function buildCombinedObservations(params: {
    client: Client;
    observations: string;
    adaptiveSignal: AdaptiveTrainingSignal | null;
    adaptiveDays: number;
    injuryRisk: InjuryRiskAssessment;
    precisionProfile: PrecisionProfileResolution | null;
}): string {
    const adaptiveBrief = params.adaptiveSignal
        ? `SINAL_ADAPTATIVO: readiness=${params.adaptiveSignal.readinessScore}; fatigue=${params.adaptiveSignal.fatigueLevel}; volume_delta=${params.adaptiveSignal.recommendedVolumeDeltaPct}%; intensity_delta=${params.adaptiveSignal.recommendedIntensityDeltaPct}%; dias_semana=${params.adaptiveDays}; confianca=${params.adaptiveSignal.confidence}`
        : '';
    const riskBrief = `RISCO_LESAO: score=${params.injuryRisk.score}; level=${params.injuryRisk.level}; conservative=${params.injuryRisk.conservativeMode}; constraints=${params.injuryRisk.recommendedConstraints.join(' | ')}`;
    const precisionBrief = params.precisionProfile ? buildPrecisionPromptContext(params.precisionProfile) : '';

    return [
        params.client.observations,
        params.observations,
        adaptiveBrief,
        riskBrief,
        precisionBrief
    ].filter(Boolean).join(' | ');
}

function applyWorkoutNotes(params: {
    workout: any;
    microcycleWeeks: Array<{
        week: number;
        phase: string;
        focus: string;
        instruction: string;
        volumeDeltaPct: number;
        intensityDeltaPct: number;
    }>;
    injuryRisk: InjuryRiskAssessment;
    precisionProfile: PrecisionProfileResolution | null;
}): any {
    return {
        ...params.workout,
        mesocycle: params.microcycleWeeks.map((week) => ({
            week: week.week,
            phase: week.phase,
            focus: week.focus,
            instruction: week.instruction,
            volumeDeltaPct: week.volumeDeltaPct,
            intensityDeltaPct: week.intensityDeltaPct
        })),
        personalNotes: [
            ...(Array.isArray(params.workout.personalNotes) ? params.workout.personalNotes : []),
            `📅 Microciclo automático (${params.microcycleWeeks.length} semanas) calibrado por sinais reais.`,
            `🛡️ Risco de lesão: ${params.injuryRisk.score}/100 (${params.injuryRisk.level}).`,
            params.precisionProfile ? `🎯 Perfil de precisão IA: ${params.precisionProfile.label} (meta ${params.precisionProfile.target.targetPrecisionScore}/100).` : ''
        ].filter(Boolean)
    };
}

function buildRouterNotes(params: {
    client: Client;
    adaptiveSignal: AdaptiveTrainingSignal | null;
    precisionProfile: PrecisionProfileResolution | null;
    provider: string;
    fallbackUsed: boolean;
}): string[] {
    const notes = [
        `🤖 Treino gerado pelo AIRouter (${params.provider})`,
        params.fallbackUsed ? '🛟 Fallback automático ativado para garantir resposta.' : '✅ Pipeline IA principal estável.'
    ];

    if (params.client.injuries && params.client.injuries.toLowerCase() !== 'nenhuma') {
        notes.push(`⚠️ Considerando: ${params.client.injuries.split('-')[0].trim()}`);
    }
    if (params.client.adherence >= 85) {
        notes.push(`🔥 Volume otimizado: aderência excelente (${params.client.adherence}%)`);
    }
    if (params.client.preferences) {
        notes.push(`❤️ Preferências: ${params.client.preferences.split('.')[0]}`);
    }
    if (params.adaptiveSignal) {
        notes.push(`🧠 Readiness ${params.adaptiveSignal.readinessScore}/100 • ${params.adaptiveSignal.fatigueLevel === 'high' ? 'fadiga alta' : params.adaptiveSignal.fatigueLevel === 'moderate' ? 'fadiga moderada' : 'fadiga baixa'}`);
    }
    if (params.precisionProfile) {
        notes.push(`🎯 Política de precisão: ${params.precisionProfile.label} (meta ${params.precisionProfile.target.targetPrecisionScore}/100).`);
    }

    return notes;
}

function attachGenerationMeta(workout: any, metadata: WorkoutGenerationMetadata): any {
    return {
        ...workout,
        generationMeta: metadata
    };
}

export async function generateWorkoutWithPipeline(params: WorkoutGenerationRequest): Promise<WorkoutGenerationResult> {
    const coldStartMode = isColdStartClient(params.client);
    const effectiveAdaptiveSignal = params.adaptiveSignal && params.adaptiveSignal.confidence >= 0.35
        ? params.adaptiveSignal
        : null;
    const adaptiveDaysBase = effectiveAdaptiveSignal?.recommendedDaysPerWeek || params.selectedDays;
    const riskAwareDays = params.injuryRisk.conservativeMode ? Math.max(2, adaptiveDaysBase - 1) : adaptiveDaysBase;
    const adaptiveDays = riskAwareDays;
    const effectiveGoal = params.goal || params.client.goal;
    const combinedObservations = buildCombinedObservations({
        client: params.client,
        observations: params.observations,
        adaptiveSignal: effectiveAdaptiveSignal,
        adaptiveDays,
        injuryRisk: params.injuryRisk,
        precisionProfile: params.precisionProfile
    });

    const weeklyMicrocycle = buildWeeklyMicrocyclePlan({
        goal: effectiveGoal,
        daysPerWeek: adaptiveDays,
        adaptiveSignal: effectiveAdaptiveSignal,
        injuryRiskScore: params.injuryRisk.score,
        coldStartMode
    });
    const guardedMicrocycleWeeks = params.precisionProfile
        ? applyPrecisionGuardrailsToMicrocycle(weeklyMicrocycle.weeks, params.precisionProfile.segment)
        : weeklyMicrocycle.weeks;

    const baseMetadata: Omit<WorkoutGenerationMetadata, 'source' | 'provider' | 'fallbackUsed'> = {
        coldStartMode,
        adjustedDaysPerWeek: adaptiveDays,
        adaptiveReadiness: effectiveAdaptiveSignal?.readinessScore,
        injuryRiskScore: params.injuryRisk.score,
        injuryRiskLevel: params.injuryRisk.level,
        precisionSegment: params.precisionProfile?.segment
    };

    const [{ generateWorkout }, { generateTrainingIntent, isAIAvailable }] = await Promise.all([
        import('./trainingEngine'),
        import('./aiRouter')
    ]);

    const engineResult = await generateWorkout({
        name: params.client.name,
        goal: effectiveGoal,
        level: params.client.level,
        daysPerWeek: adaptiveDays,
        injuries: params.client.injuries,
        observations: combinedObservations,
        birthDate: params.client.birthDate,
        age: params.client.age,
        weight: params.client.weight,
        height: params.client.height,
        useAI: isAIAvailable()
    });

    if (engineResult && engineResult.days.length > 0) {
        let workout = {
            title: `${engineResult.template_name} - ${params.client.name}`,
            objective: `Template ${engineResult.template_id} otimizado para ${effectiveGoal}`,
            splits: engineResult.days.map((day) => ({
                name: day.label,
                focus: day.label,
                exercises: day.slots
                    .filter((slot) => slot.selected)
                    .map((slot) => ({
                        name: slot.selected!.name,
                        sets: slot.sets,
                        reps: slot.reps,
                        rest: slot.rest,
                        targetMuscle: slot.selected!.primary_muscle,
                        method: 'simples',
                        technique: ''
                    }))
            })),
            personalNotes: [
                `🎯 Template: ${engineResult.template_name}`,
                '📊 Arquitetura determinística com slots',
                effectiveAdaptiveSignal
                    ? `🧠 Readiness ${effectiveAdaptiveSignal.readinessScore}/100 | ajuste ${effectiveAdaptiveSignal.recommendedVolumeDeltaPct >= 0 ? '+' : ''}${effectiveAdaptiveSignal.recommendedVolumeDeltaPct}% volume`
                    : '',
                params.client.injuries && params.client.injuries.toLowerCase() !== 'nenhuma'
                    ? `⚠️ Considerando: ${params.client.injuries.split('-')[0].trim()}`
                    : '',
                params.precisionProfile ? `🎯 Política de precisão: ${params.precisionProfile.label}` : ''
            ].filter(Boolean),
            optionLabel: 'Engine'
        };

        if (coldStartMode) {
            workout = applyColdStartProtocol(workout);
        }

        workout = applyWorkoutNotes({
            workout,
            microcycleWeeks: guardedMicrocycleWeeks,
            injuryRisk: params.injuryRisk,
            precisionProfile: params.precisionProfile
        });

        const metadata: WorkoutGenerationMetadata = {
            ...baseMetadata,
            source: 'training_engine',
            provider: 'training_engine',
            fallbackUsed: false
        };

        return {
            workout: attachGenerationMeta(workout, metadata),
            metadata
        };
    }

    const intentResult = await generateTrainingIntent({
        name: params.client.name,
        goal: effectiveGoal,
        level: params.client.level,
        days: adaptiveDays,
        injuries: params.client.injuries,
        preferences: params.client.preferences,
        adherence: params.client.adherence,
        equipment: ['Academia completa', 'Halteres', 'Barras', 'Máquinas'],
        sessionDuration: coldStartMode ? 50 : 60
    });

    if (intentResult && Array.isArray(intentResult.splits) && intentResult.splits.length > 0) {
        const localExercises = await params.ensureExerciseCatalog();
        const mappedResult = params.mapToLocalExercises({
            title: intentResult.title,
            objective: intentResult.objective,
            splits: intentResult.splits.map((split) => ({
                name: split.name,
                focus: split.focus,
                exercises: split.exercises.map((item) => ({
                    name: item.exercise?.name || 'Exercício',
                    sets: item.sets,
                    reps: item.reps,
                    rest: item.rest,
                    targetMuscle: item.exercise?.primary_muscle || 'Geral',
                    technique: item.notes || item.exercise?.execution_tips || ''
                }))
            }))
        }, localExercises);

        const withNotes = {
            ...mappedResult,
            personalNotes: buildRouterNotes({
                client: params.client,
                adaptiveSignal: effectiveAdaptiveSignal,
                precisionProfile: params.precisionProfile,
                provider: intentResult.provider,
                fallbackUsed: intentResult.fallbackUsed
            }),
            optionLabel: 'Router'
        };
        const withColdStart = coldStartMode ? applyColdStartProtocol(withNotes) : withNotes;
        const workout = applyWorkoutNotes({
            workout: withColdStart,
            microcycleWeeks: guardedMicrocycleWeeks,
            injuryRisk: params.injuryRisk,
            precisionProfile: params.precisionProfile
        });

        const metadata: WorkoutGenerationMetadata = {
            ...baseMetadata,
            source: 'ai_router',
            provider: `ai_router:${intentResult.provider}`,
            fallbackUsed: intentResult.fallbackUsed
        };

        return {
            workout: attachGenerationMeta(workout, metadata),
            metadata
        };
    }

    return buildLocalFallbackWorkout({
        client: params.client,
        observations: params.observations,
        injuryRisk: params.injuryRisk,
        adaptiveSignal: params.adaptiveSignal,
        precisionProfile: params.precisionProfile,
        selectedDays: params.selectedDays,
        goal: effectiveGoal,
        ensureExerciseCatalog: params.ensureExerciseCatalog
    });
}

export async function buildLocalFallbackWorkout(params: LocalFallbackParams): Promise<WorkoutGenerationResult> {
    const coldStartMode = isColdStartClient(params.client);
    const effectiveAdaptiveSignal = params.adaptiveSignal && params.adaptiveSignal.confidence >= 0.35
        ? params.adaptiveSignal
        : null;
    const adaptiveDaysBase = effectiveAdaptiveSignal?.recommendedDaysPerWeek || params.selectedDays;
    const adaptiveDays = params.injuryRisk.conservativeMode ? Math.max(2, adaptiveDaysBase - 1) : adaptiveDaysBase;
    const weeklyMicrocycle = buildWeeklyMicrocyclePlan({
        goal: params.goal,
        daysPerWeek: adaptiveDays,
        adaptiveSignal: effectiveAdaptiveSignal,
        injuryRiskScore: params.injuryRisk.score,
        coldStartMode
    });
    const guardedMicrocycleWeeks = params.precisionProfile
        ? applyPrecisionGuardrailsToMicrocycle(weeklyMicrocycle.weeks, params.precisionProfile.segment)
        : weeklyMicrocycle.weeks;

    const localExercises = await params.ensureExerciseCatalog();
    let workout = generateSmartWorkout(params.client, params.observations, localExercises);
    if (coldStartMode) {
        workout = applyColdStartProtocol(workout);
    }
    workout = applyWorkoutNotes({
        workout,
        microcycleWeeks: guardedMicrocycleWeeks,
        injuryRisk: params.injuryRisk,
        precisionProfile: params.precisionProfile
    });

    const metadata: WorkoutGenerationMetadata = {
        source: 'local',
        provider: 'local',
        fallbackUsed: true,
        coldStartMode,
        adjustedDaysPerWeek: adaptiveDays,
        adaptiveReadiness: effectiveAdaptiveSignal?.readinessScore,
        injuryRiskScore: params.injuryRisk.score,
        injuryRiskLevel: params.injuryRisk.level,
        precisionSegment: params.precisionProfile?.segment
    };

    return {
        workout: attachGenerationMeta(workout, metadata),
        metadata
    };
}
