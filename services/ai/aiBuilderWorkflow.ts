import { logFunnelEvent } from '../loggingService';
import { createScopedLogger } from '../appLogger';
import { saveAIGenerationFeedback } from './feedback/aiGenerationFeedbackService';
import { type AdaptiveTrainingSignal } from './adaptiveSignalsService';
import { mapToLocalExercises, type AIBuilderExercise } from './aiBuilderWorkoutUtils';
import { assessInjuryRisk, type InjuryRiskAssessment } from './injuryRiskService';
import { buildLocalFallbackWorkout, generateWorkoutWithPipeline } from './workoutGenerationOrchestrator';
const aiBuilderWorkflowLogger = createScopedLogger('AIBuilderWorkflow');

interface SubmitFeedbackParams {
    isDemo: boolean;
    type: 'positive' | 'negative';
    selectedClient?: { id?: string } | null;
    result?: { title?: string; objective?: string } | null;
    workoutOptions: Array<{ optionLabel?: string }>;
    selectedOptionIndex: number;
}

export async function submitAIBuilderFeedback({
    isDemo,
    type,
    selectedClient,
    result,
    workoutOptions,
    selectedOptionIndex
}: SubmitFeedbackParams): Promise<void> {
    if (!isDemo) {
        await saveAIGenerationFeedback({
            feedback: type,
            source: 'ai_builder',
            clientId: selectedClient?.id,
            workoutTitle: result?.title,
            optionLabel: workoutOptions[selectedOptionIndex]?.optionLabel,
            objective: result?.objective
        });
    }

    void logFunnelEvent('ai_generation_feedback_submitted', {
        feedback: type,
        clientId: selectedClient?.id,
        optionLabel: workoutOptions[selectedOptionIndex]?.optionLabel
    });
}

interface GenerateAIBuilderWorkoutParams {
    client: any;
    goal: string;
    selectedDays: number;
    observations: string;
    adaptiveSignal: AdaptiveTrainingSignal | null;
    precisionProfile: any;
    ensureExerciseCatalog: () => Promise<AIBuilderExercise[]>;
    mapExercises: typeof mapToLocalExercises;
    setLoading: (loading: boolean) => void;
    setLoadingMessageIndex: (index: number) => void;
    setWorkoutOptions: (options: any[]) => void;
    setSelectedOptionIndex: (index: number) => void;
    setResult: (result: any) => void;
    setActiveTabIndex: (index: number) => void;
    setErrorToast: (message: string | null) => void;
}

export async function generateAIBuilderWorkout({
    client,
    goal,
    selectedDays,
    observations,
    adaptiveSignal,
    precisionProfile,
    ensureExerciseCatalog,
    mapExercises,
    setLoading,
    setLoadingMessageIndex,
    setWorkoutOptions,
    setSelectedOptionIndex,
    setResult,
    setActiveTabIndex,
    setErrorToast
}: GenerateAIBuilderWorkoutParams): Promise<void> {
    const preRisk = assessInjuryRisk({
        client,
        observations,
        adaptiveSignal
    });

    if (preRisk.blockGeneration) {
        setErrorToast(`🚫 Risco de lesão crítico (${preRisk.score}/100). Revise dados clínicos e ajuste restrições antes de gerar.`);
        void logFunnelEvent('workout_generation_blocked_risk', {
            clientId: client.id,
            riskScore: preRisk.score,
            riskLevel: preRisk.level
        });
        return;
    }

    setLoading(true);
    setLoadingMessageIndex(0);
    setWorkoutOptions([]);
    setSelectedOptionIndex(0);

    void logFunnelEvent('workout_generation_started', {
        clientId: client.id,
        goal,
        daysPerWeek: selectedDays,
        injuryRiskScore: preRisk.score,
        injuryRiskLevel: preRisk.level,
        precisionSegment: precisionProfile?.segment
    });

    try {
        const pipelineResult = await generateWorkoutWithPipeline({
            client,
            goal,
            selectedDays,
            observations,
            adaptiveSignal,
            injuryRisk: preRisk,
            precisionProfile,
            ensureExerciseCatalog,
            mapToLocalExercises: mapExercises
        });

        setWorkoutOptions([pipelineResult.workout]);
        setResult(pipelineResult.workout);

        const eventName = pipelineResult.metadata.source === 'local'
            ? 'workout_generation_fallback_local'
            : 'workout_generation_succeeded';

        void logFunnelEvent(eventName, {
            provider: pipelineResult.metadata.provider,
            clientId: client.id,
            optionsCount: 1,
            coldStartMode: pipelineResult.metadata.coldStartMode,
            fallbackUsed: pipelineResult.metadata.fallbackUsed,
            adjustedDaysPerWeek: pipelineResult.metadata.adjustedDaysPerWeek,
            adaptiveReadiness: pipelineResult.metadata.adaptiveReadiness,
            injuryRiskScore: pipelineResult.metadata.injuryRiskScore,
            injuryRiskLevel: pipelineResult.metadata.injuryRiskLevel,
            precisionSegment: pipelineResult.metadata.precisionSegment
        });
    } catch (error) {
        aiBuilderWorkflowLogger.error('Error generating workout', error, {
            clientId: client.id,
            goal,
            selectedDays
        });
        void logFunnelEvent('workout_generation_failed', {
            clientId: client.id,
            coldStartMode: false,
            adaptiveReadiness: adaptiveSignal?.readinessScore,
            precisionSegment: precisionProfile?.segment,
            error: error instanceof Error ? error.message : 'unknown_error'
        });

        const fallbackResult = await buildLocalFallbackWorkout({
            client,
            observations,
            injuryRisk: preRisk,
            adaptiveSignal,
            precisionProfile,
            selectedDays,
            goal,
            ensureExerciseCatalog
        });

        setWorkoutOptions([fallbackResult.workout]);
        setResult(fallbackResult.workout);

        void logFunnelEvent('workout_generation_fallback_local', {
            provider: fallbackResult.metadata.provider,
            clientId: client.id,
            optionsCount: 1,
            coldStartMode: fallbackResult.metadata.coldStartMode,
            fallbackUsed: fallbackResult.metadata.fallbackUsed,
            adjustedDaysPerWeek: fallbackResult.metadata.adjustedDaysPerWeek,
            adaptiveReadiness: fallbackResult.metadata.adaptiveReadiness,
            injuryRiskScore: fallbackResult.metadata.injuryRiskScore,
            injuryRiskLevel: fallbackResult.metadata.injuryRiskLevel,
            precisionSegment: fallbackResult.metadata.precisionSegment
        });
    } finally {
        setLoading(false);
        setActiveTabIndex(0);
    }
}

interface SaveAIBuilderWorkoutParams {
    user: { id?: string } | null;
    isDemo: boolean;
    selectedClient: any;
    result: any;
    workoutOptions: Array<{ optionLabel?: string }>;
    selectedOptionIndex: number;
    injuryRisk: InjuryRiskAssessment | null;
    precisionProfile: any;
    loadWorkoutsDomain: () => Promise<{ saveAIWorkout: (...args: any[]) => Promise<unknown> }>;
    setLoading: (loading: boolean) => void;
    setErrorToast: (message: string | null) => void;
    onDone: () => void;
}

export async function saveAIBuilderWorkoutSelection({
    user,
    isDemo,
    selectedClient,
    result,
    workoutOptions,
    selectedOptionIndex,
    injuryRisk,
    precisionProfile,
    loadWorkoutsDomain,
    setLoading,
    setErrorToast,
    onDone
}: SaveAIBuilderWorkoutParams): Promise<void> {
    if (!user?.id) {
        setErrorToast('Você precisa estar logado para salvar treinos.');
        return;
    }

    if (isDemo) {
        setErrorToast('Salvamento está indisponível no modo demonstração.');
        return;
    }

    setLoading(true);

    try {
        if (selectedClient && result) {
            void logFunnelEvent('workout_save_started', {
                coachId: user.id,
                clientId: selectedClient.id,
                coldStartMode: !!result?.coldStartMode,
                precisionSegment: precisionProfile?.segment
            });

            const { saveAIWorkout } = await loadWorkoutsDomain();
            const metadata = {
                model: result?.generationMeta?.provider || 'local',
                optionSelected: workoutOptions[selectedOptionIndex]?.optionLabel || 'default',
                generatedAt: new Date().toISOString(),
                coldStartMode: !!result?.coldStartMode,
                calibrationPlan: result?.calibrationPlan || null,
                injuryRisk: injuryRisk ? {
                    score: injuryRisk.score,
                    level: injuryRisk.level
                } : null,
                precisionProfile: precisionProfile ? {
                    segment: precisionProfile.segment,
                    label: precisionProfile.label,
                    targetPrecisionScore: precisionProfile.target.targetPrecisionScore,
                    maxMeanRpeError: precisionProfile.target.maxMeanRpeError,
                    maxMeanRirError: precisionProfile.target.maxMeanRirError,
                    maxPainRate: precisionProfile.target.maxPainRate
                } : null,
                clientData: {
                    injuries: selectedClient.injuries,
                    preferences: selectedClient.preferences,
                    adherence: selectedClient.adherence
                }
            };

            await saveAIWorkout(selectedClient.id, user.id, result, metadata);

            void logFunnelEvent('workout_save_succeeded', {
                coachId: user.id,
                clientId: selectedClient.id,
                coldStartMode: !!result?.coldStartMode,
                precisionSegment: precisionProfile?.segment
            });
        }
    } catch (error) {
        aiBuilderWorkflowLogger.error('Error saving workout', error, {
            coachId: user.id,
            clientId: selectedClient?.id
        });
        void logFunnelEvent('workout_save_failed', {
            coachId: user.id,
            clientId: selectedClient?.id,
            precisionSegment: precisionProfile?.segment,
            error: error instanceof Error ? error.message : 'unknown_error'
        });
    } finally {
        setLoading(false);
        onDone();
    }
}

export function exportAIBuilderWorkoutToPdf(result: any, selectedClient?: { name?: string } | null): void {
    if (!result) return;

    const escapeHtml = (value: unknown) =>
        String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;

    try {
        printWindow.opener = null;
    } catch {
        // noop
    }

    printWindow.document.write(`
        <html>
          <head>
            <title>${escapeHtml(result.title || 'Treino Apex')}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
              h1 { color: #2563eb; font-size: 24px; margin-bottom: 10px; }
              .header { margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
              .split { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; }
              h3 { margin-top: 0; color: #0f172a; margin-bottom: 15px; }
              .exercise { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
              .exercise:last-child { border-bottom: none; }
              .meta { font-size: 12px; color: #64748b; font-weight: bold; }
              .name { font-weight: bold; font-size: 14px; }
              .details { font-size: 13px; color: #334155; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${escapeHtml(result.title || 'Treino Personalizado')}</h1>
              <p><strong>Objetivo:</strong> ${escapeHtml(result.objective)}</p>
              <p><strong>Cliente:</strong> ${escapeHtml(selectedClient?.name)}</p>
            </div>
            ${result.splits.map((split: any) => `
              <div class="split">
                <h3>${escapeHtml(split.name)}</h3>
                ${split.exercises.map((exercise: any) => `
                  <div class="exercise">
                    <div>
                      <div class="name">${escapeHtml(exercise.name)}</div>
                      <div class="meta">${escapeHtml(exercise.targetMuscle)}</div>
                    </div>
                    <div class="details">
                      ${escapeHtml(exercise.sets)} séries x ${escapeHtml(exercise.reps)} <br/>
                      Descanso: ${escapeHtml(exercise.rest)}
                    </div>
                  </div>
                `).join('')}
              </div>
            `).join('')}
            <script>window.print();</script>
          </body>
        </html>
      `);
    printWindow.document.close();
}

export function shareAIBuilderWorkoutOnWhatsApp(result: any, selectedClient: { name?: string } | null, activeTabIndex: number): void {
    if (!result) return;

    const currentSplit = result.splits?.[activeTabIndex];
    let message = `🏋️ *${result.title}*\n\n`;
    message += `📋 *${currentSplit?.name}*\n\n`;

    currentSplit?.exercises?.forEach((exercise: any, index: number) => {
        message += `${index + 1}. *${exercise.name}*\n`;
        message += `   ${exercise.sets} séries x ${exercise.reps} • Descanso: ${exercise.rest}\n\n`;
    });

    message += `\n💪 Bom treino, ${selectedClient?.name}!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
}
