import React, { useEffect, useMemo, useState } from 'react';
import { Client } from '../types';
import { useQuery } from '@tanstack/react-query';
import { logFunnelEvent } from '../services/loggingService';
import { flushAIGenerationFeedbackQueue, saveAIGenerationFeedback } from '../services/ai/feedback/aiGenerationFeedbackService';
import { getAdaptiveTrainingSignal, type AdaptiveTrainingSignal } from '../services/ai/adaptiveSignalsService';
import { assessInjuryRisk, type InjuryRiskAssessment } from '../services/ai/injuryRiskService';
import { buildWeeklyMicrocyclePlan } from '../services/ai/weeklyProgressionEngine';
import {
  applyPrecisionGuardrailsToMicrocycle,
  buildPrecisionPromptContext,
  resolvePrecisionProfile
} from '../services/ai/progressionPrecisionService';
import { useAIBuilderWorkoutEditing } from '../services/ai/hooks/useAIBuilderWorkoutEditing';
import {
  applyColdStartProtocol,
  generateSmartWorkout,
  isColdStartClient,
  type AIBuilderExercise
} from '../services/ai/aiBuilderWorkoutUtils';
import PageHeader from '../components/PageHeader';
import AIBuilderWizardHeader from '../components/aiBuilder/AIBuilderWizardHeader';
import AIBuilderWizardStepProfile from '../components/aiBuilder/AIBuilderWizardStepProfile';
import AIBuilderWizardStepRisk from '../components/aiBuilder/AIBuilderWizardStepRisk';
import AIBuilderWizardStepGenerate from '../components/aiBuilder/AIBuilderWizardStepGenerate';
import AIBuilderErrorToast from '../components/aiBuilder/AIBuilderErrorToast';
import AIBuilderResultModal from '../components/aiBuilder/AIBuilderResultModal';

// Feature flag: use new AI Router (Groq + intention-based)
const USE_NEW_AI_ROUTER = true;

interface AIBuilderViewProps {
  user: any;
  onBack: () => void;
  onDone: () => void;
}

type MockExercise = AIBuilderExercise;

const loadDemoData = () => import('../mocks/demoData');
const loadTrainingEngine = () => import('../services/ai/trainingEngine');
const loadAIRouter = () => import('../services/ai/aiRouter');
const loadClientsDomain = () => import('../services/supabase/domains/clientsDomain');
const loadWorkoutsDomain = () => import('../services/supabase/domains/workoutsDomain');


const AIBuilderView: React.FC<AIBuilderViewProps> = ({ user, onBack, onDone }) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedGoal, setSelectedGoal] = useState('Hipertrofia');
  const [selectedDays, setSelectedDays] = useState(4);
  const [observations, setObservations] = useState('');
  const [result, setResult] = useState<any>(null);
  const [workoutOptions, setWorkoutOptions] = useState<any[]>([]); // Multiple AI options
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [exerciseCatalog, setExerciseCatalog] = useState<MockExercise[]>([]);
  const [loadingExerciseCatalog, setLoadingExerciseCatalog] = useState(false);

  const ensureExerciseCatalog = async (): Promise<MockExercise[]> => {
    if (exerciseCatalog.length > 0) return exerciseCatalog;

    setLoadingExerciseCatalog(true);
    try {
      const { mockExercises } = await loadDemoData();
      const catalog = mockExercises as MockExercise[];
      setExerciseCatalog(catalog);
      return catalog;
    } finally {
      setLoadingExerciseCatalog(false);
    }
  };

  const loadFallbackClients = async (): Promise<Client[]> => {
    const { mockClients } = await loadDemoData();
    return mockClients as Client[];
  };

  const {
    data: clients = [],
    isLoading: fetchingClients
  } = useQuery<Client[]>({
    queryKey: ['ai-builder-clients', user?.id, user?.isDemo],
    enabled: Boolean(user?.id || user?.isDemo),
    queryFn: async () => {
      try {
        if (user?.id) {
          const { getClients, mapDBClientToClient } = await loadClientsDomain();
          const dbClients = await getClients(user.id, { limit: 100 });
          if (dbClients && dbClients.length > 0) {
            return dbClients.map(mapDBClientToClient) as Client[];
          }
        }
        return await loadFallbackClients();
      } catch (error) {
        console.error('Error fetching clients:', error);
        return await loadFallbackClients();
      }
    }
  });

  const handleFeedback = async (type: 'positive' | 'negative') => {
    setFeedback(type);
    await saveAIGenerationFeedback({
      feedback: type,
      source: 'ai_builder',
      clientId: selectedClient?.id,
      workoutTitle: result?.title,
      optionLabel: workoutOptions[selectedOptionIndex]?.optionLabel,
      objective: result?.objective
    });
    void logFunnelEvent('ai_generation_feedback_submitted', {
      feedback: type,
      clientId: selectedClient?.id,
      optionLabel: workoutOptions[selectedOptionIndex]?.optionLabel
    });
  };
  const [editingExercise, setEditingExercise] = useState<{ splitIdx: number, exIdx: number } | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [adaptiveSignal, setAdaptiveSignal] = useState<AdaptiveTrainingSignal | null>(null);
  const [loadingAdaptiveSignal, setLoadingAdaptiveSignal] = useState(false);
  const [injuryRisk, setInjuryRisk] = useState<InjuryRiskAssessment | null>(null);
  const precisionProfile = useMemo(() => {
    if (!selectedClient) return null;
    return resolvePrecisionProfile({
      level: selectedClient.level,
      goal: selectedGoal || selectedClient.goal,
      age: selectedClient.age,
      adherence: selectedClient.adherence,
      status: selectedClient.status
    });
  }, [selectedClient, selectedGoal]);

  // Update exercise in result
  const updateExercise = (splitIdx: number, exIdx: number, field: string, value: string | number) => {
    if (!result) return;
    const newResult = { ...result };
    newResult.splits[splitIdx].exercises[exIdx][field] = value;
    setResult(newResult);
  };

  // Remove exercise
  const removeExercise = (splitIdx: number, exIdx: number) => {
    if (!result) return;
    const newResult = { ...result };
    newResult.splits[splitIdx].exercises.splice(exIdx, 1);
    setResult(newResult);
    setEditingExercise(null);
  };

  // Add exercise to current split
  const addExercise = (exercise: any) => {
    if (!result) return;
    const newResult = { ...result };
    newResult.splits[activeTabIndex].exercises.push({
      name: exercise.name,
      sets: 4,
      reps: exercise.sets?.[0]?.reps || '12',
      rest: '60s',
      targetMuscle: exercise.targetMuscle || 'Geral'
    });
    setResult(newResult);
    setShowAddExercise(false);
    setExerciseSearch('');
  };

  const openAddExerciseModal = async () => {
    await ensureExerciseCatalog();
    setShowAddExercise(true);
  };

  // Filtered exercises for search
  const filteredExercisesForAdd = exerciseCatalog.filter(ex =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    (ex.targetMuscle || '').toLowerCase().includes(exerciseSearch.toLowerCase())
  ).slice(0, 20);

  const quickTags = [
    '+ Lesão no ombro',
    '+ Sem equipamentos',
    '+ Treino curto (30min)',
    '+ Foco em core'
  ];

  const messages = [
    "Analisando perfil biotipológico...",
    "Otimizando volume de treinamento...",
    "Selecionando exercícios de alta sinergia...",
    "Ajustando densidade e descanso...",
    "Finalizando protocolo de elite..."
  ];

  useEffect(() => {
    if (!clients.length) {
      setSelectedClient(null);
      return;
    }

    setSelectedClient((current) => {
      if (!current) return clients[0];
      const stillExists = clients.find((client) => client.id === current.id);
      return stillExists || clients[0];
    });
  }, [clients]);

  useEffect(() => {
    void flushAIGenerationFeedbackQueue();
    const onOnline = () => {
      void flushAIGenerationFeedbackQueue();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  useEffect(() => {
    if (!selectedClient?.id) {
      setAdaptiveSignal(null);
      return;
    }

    let cancelled = false;
    const loadAdaptiveSignal = async () => {
      setLoadingAdaptiveSignal(true);
      try {
        const signal = await getAdaptiveTrainingSignal(selectedClient.id, selectedDays);
        if (!cancelled) {
          setAdaptiveSignal(signal);
        }
      } catch (error) {
        console.error('Error loading adaptive signal:', error);
        if (!cancelled) setAdaptiveSignal(null);
      } finally {
        if (!cancelled) setLoadingAdaptiveSignal(false);
      }
    };

    void loadAdaptiveSignal();
    return () => {
      cancelled = true;
    };
  }, [selectedClient?.id, selectedDays]);

  useEffect(() => {
    if (!selectedClient) {
      setInjuryRisk(null);
      return;
    }

    const risk = assessInjuryRisk({
      client: selectedClient,
      observations,
      adaptiveSignal
    });
    setInjuryRisk(risk);
  }, [selectedClient, observations, adaptiveSignal]);

  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  const canAdvanceFromProfileStep = Boolean(selectedClient && selectedGoal);
  const canAdvanceFromRiskStep = Boolean(selectedClient);

  const goToWizardStep = (step: 1 | 2 | 3) => {
    if (step === 2 && !canAdvanceFromProfileStep) return;
    if (step === 3 && !canAdvanceFromRiskStep) return;
    setWizardStep(step);
  };

  const handleContinueFromProfile = () => {
    if (!canAdvanceFromProfileStep) {
      setErrorToast('Selecione o aluno e o objetivo para continuar.');
      return;
    }
    setWizardStep(2);
  };

  const handleContinueFromRisk = () => {
    if (!canAdvanceFromRiskStep) {
      setErrorToast('Selecione um aluno para continuar.');
      return;
    }
    setWizardStep(3);
  };

  // Auto-hide error toast after 5 seconds
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
      }, 800);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Check if exercise exists in local DB
  const mapToLocalExercises = (aiResult: any, localExercises: MockExercise[]) => {
    if (!aiResult || !aiResult.splits) return aiResult;

    const mappedSplits = aiResult.splits.map((split: any) => ({
      ...split,
      exercises: split.exercises.map((ex: any) => {
        // Try strict match first
        let localMatch = localExercises.find(me => me.name.toLowerCase() === ex.name.toLowerCase());

        // Try fuzzy match
        if (!localMatch) {
          localMatch = localExercises.find(me =>
            me.name.toLowerCase().includes(ex.name.toLowerCase()) ||
            ex.name.toLowerCase().includes(me.name.toLowerCase())
          );
        }

        if (localMatch) {
          return {
            ...ex,
            id: localMatch.id, // Link to local ID
            videoUrl: `https://videos.apex-app.com/${localMatch.id}.mp4`, // Hypothetical video link
            isVerified: true
          };
        }
        return { ...ex, isVerified: false };
      })
    }));

    return { ...aiResult, splits: mappedSplits };
  };

  const {
    regeneratingId,
    refinementInput,
    isRefining,
    setRefinementInput,
    handleRegenerateExercise,
    handleRefine
  } = useAIBuilderWorkoutEditing({
    selectedClient,
    result,
    setResult,
    ensureExerciseCatalog,
    mapToLocalExercises,
    setErrorToast
  });

  const handleGenerate = async () => {
    if (!selectedClient) return;
    const preRisk = assessInjuryRisk({
      client: selectedClient,
      observations,
      adaptiveSignal
    });

    if (preRisk.blockGeneration) {
      setErrorToast(`🚫 Risco de lesão crítico (${preRisk.score}/100). Revise dados clínicos e ajuste restrições antes de gerar.`);
      void logFunnelEvent('workout_generation_blocked_risk', {
        clientId: selectedClient.id,
        riskScore: preRisk.score,
        riskLevel: preRisk.level
      });
      return;
    }

    setLoading(true);
    setLoadingMessageIndex(0);
    setWorkoutOptions([]);
    setSelectedOptionIndex(0);
    const effectiveAdaptiveSignal = adaptiveSignal && adaptiveSignal.confidence >= 0.35 ? adaptiveSignal : null;
    const adaptiveDaysBase = effectiveAdaptiveSignal?.recommendedDaysPerWeek || selectedDays;
    const riskAwareDays = preRisk.conservativeMode ? Math.max(2, adaptiveDaysBase - 1) : adaptiveDaysBase;
    const adaptiveDays = riskAwareDays;
    const adaptiveBrief = effectiveAdaptiveSignal
      ? `SINAL_ADAPTATIVO: readiness=${effectiveAdaptiveSignal.readinessScore}; fatigue=${effectiveAdaptiveSignal.fatigueLevel}; volume_delta=${effectiveAdaptiveSignal.recommendedVolumeDeltaPct}%; intensity_delta=${effectiveAdaptiveSignal.recommendedIntensityDeltaPct}%; dias_semana=${adaptiveDays}; confianca=${effectiveAdaptiveSignal.confidence}`
      : '';
    const riskBrief = `RISCO_LESAO: score=${preRisk.score}; level=${preRisk.level}; conservative=${preRisk.conservativeMode}; constraints=${preRisk.recommendedConstraints.join(' | ')}`;
    const precisionBrief = precisionProfile ? buildPrecisionPromptContext(precisionProfile) : '';
    const coldStartMode = isColdStartClient(selectedClient);
    const effectiveGoal = selectedGoal || selectedClient.goal;
    const combinedObservations = [selectedClient.observations, observations, adaptiveBrief, riskBrief, precisionBrief]
      .filter(Boolean)
      .join(' | ');
    const weeklyMicrocycle = buildWeeklyMicrocyclePlan({
      goal: effectiveGoal,
      daysPerWeek: adaptiveDays,
      adaptiveSignal: effectiveAdaptiveSignal,
      injuryRiskScore: preRisk.score,
      coldStartMode
    });
    const guardedMicrocycleWeeks = precisionProfile
      ? applyPrecisionGuardrailsToMicrocycle(weeklyMicrocycle.weeks, precisionProfile.segment)
      : weeklyMicrocycle.weeks;
    const applyMicrocycle = (baseWorkout: any) => ({
      ...baseWorkout,
      mesocycle: guardedMicrocycleWeeks.map(week => ({
        week: week.week,
        phase: week.phase,
        focus: week.focus,
        instruction: week.instruction,
        volumeDeltaPct: week.volumeDeltaPct,
        intensityDeltaPct: week.intensityDeltaPct
      })),
      personalNotes: [
        ...(Array.isArray(baseWorkout.personalNotes) ? baseWorkout.personalNotes : []),
        `📅 Microciclo automático (${guardedMicrocycleWeeks.length} semanas) calibrado por sinais reais.`,
        `🛡️ Risco de lesão: ${preRisk.score}/100 (${preRisk.level}).`,
        precisionProfile ? `🎯 Perfil de precisão IA: ${precisionProfile.label} (meta ${precisionProfile.target.targetPrecisionScore}/100).` : ''
      ].filter(Boolean)
    });

    void logFunnelEvent('workout_generation_started', {
      clientId: selectedClient.id,
      goal: effectiveGoal,
      daysPerWeek: selectedDays,
      adjustedDaysPerWeek: adaptiveDays,
      coldStartMode,
      adaptiveReadiness: effectiveAdaptiveSignal?.readinessScore,
      injuryRiskScore: preRisk.score,
      injuryRiskLevel: preRisk.level,
      precisionSegment: precisionProfile?.segment
    });

    try {
      // NEW: Deterministic Training Engine with slot-based templates
      if (USE_NEW_AI_ROUTER) {
        const [{ generateWorkout: generateWithEngine }, { isAIAvailable: isNewAIAvailable }] = await Promise.all([
          loadTrainingEngine(),
          loadAIRouter()
        ]);

        const engineResult = await generateWithEngine({
          name: selectedClient.name,
          goal: effectiveGoal,
          level: selectedClient.level,
          daysPerWeek: adaptiveDays,
          injuries: selectedClient.injuries,
          observations: combinedObservations,          // Usa observações do cliente + input do coach
          birthDate: selectedClient.birthDate,        // NOVO: calcula idade para idoso/adolescente
          age: selectedClient.age,                     // NOVO: ou usa idade direta se disponível
          weight: selectedClient.weight,
          height: selectedClient.height,
          useAI: isNewAIAvailable() // Reativado: bug de age mapeado corrigido
        });

        if (engineResult && engineResult.days.length > 0) {
          // Convert engine result to existing UI format
          let aiResult = {
            title: `${engineResult.template_name} - ${selectedClient.name}`,
            objective: `Template ${engineResult.template_id} otimizado para ${effectiveGoal}`,
            splits: engineResult.days.map(day => ({
              name: day.label,
              focus: day.label,
              exercises: day.slots
                .filter(slot => slot.selected)
                .map(slot => ({
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
              `📊 Arquitetura determinística com slots`,
              effectiveAdaptiveSignal
                ? `🧠 Readiness ${effectiveAdaptiveSignal.readinessScore}/100 | ajuste ${effectiveAdaptiveSignal.recommendedVolumeDeltaPct >= 0 ? '+' : ''}${effectiveAdaptiveSignal.recommendedVolumeDeltaPct}% volume`
                : '',
              selectedClient.injuries && selectedClient.injuries.toLowerCase() !== 'nenhuma'
                ? `⚠️ Considerando: ${selectedClient.injuries.split('-')[0].trim()}`
                : '',
              precisionProfile ? `🎯 Política de precisão: ${precisionProfile.label}` : ''
            ].filter(Boolean),
            optionLabel: 'Engine'
          };
          if (coldStartMode) {
            aiResult = applyColdStartProtocol(aiResult);
          }
          aiResult = applyMicrocycle(aiResult);

          setWorkoutOptions([aiResult]);
          setResult(aiResult);
          void logFunnelEvent('workout_generation_succeeded', {
            provider: 'training_engine',
            clientId: selectedClient.id,
            optionsCount: 1,
            coldStartMode,
            injuryRiskScore: preRisk.score,
            precisionSegment: precisionProfile?.segment
          });
          setLoading(false);
          setActiveTabIndex(0);
          return;
        }
      }

      // FALLBACK 1: Router by intention (single call, centralized providers + logging)
      const { generateTrainingIntent } = await loadAIRouter();
      const intentResult = await generateTrainingIntent({
        name: selectedClient.name,
        goal: effectiveGoal,
        level: selectedClient.level,
        days: adaptiveDays,
        injuries: selectedClient.injuries,
        preferences: selectedClient.preferences,
        adherence: selectedClient.adherence,
        equipment: ['Academia completa', 'Halteres', 'Barras', 'Máquinas'],
        sessionDuration: coldStartMode ? 50 : 60
      });

      if (intentResult && Array.isArray(intentResult.splits) && intentResult.splits.length > 0) {
        const localExercises = await ensureExerciseCatalog();
        const mappedResult = mapToLocalExercises({
          title: intentResult.title,
          objective: intentResult.objective,
          splits: intentResult.splits.map(split => ({
            name: split.name,
            focus: split.focus,
            exercises: split.exercises.map(item => ({
              name: item.exercise?.name || 'Exercício',
              sets: item.sets,
              reps: item.reps,
              rest: item.rest,
              targetMuscle: item.exercise?.primary_muscle || 'Geral',
              technique: item.notes || item.exercise?.execution_tips || ''
            }))
          }))
        }, localExercises);

        const personalNotes = [
          `🤖 Treino gerado pelo AIRouter (${intentResult.provider})`,
          intentResult.fallbackUsed ? '🛟 Fallback automático ativado para garantir resposta.' : '✅ Pipeline IA principal estável.'
        ];
        if (selectedClient.injuries && selectedClient.injuries.toLowerCase() !== 'nenhuma') {
          personalNotes.push(`⚠️ Considerando: ${selectedClient.injuries.split('-')[0].trim()}`);
        }
        if (selectedClient.adherence >= 85) {
          personalNotes.push(`🔥 Volume otimizado: aderência excelente (${selectedClient.adherence}%)`);
        }
        if (selectedClient.preferences) {
          personalNotes.push(`❤️ Preferências: ${selectedClient.preferences.split('.')[0]}`);
        }
        if (effectiveAdaptiveSignal) {
          personalNotes.push(`🧠 Readiness ${effectiveAdaptiveSignal.readinessScore}/100 • ${effectiveAdaptiveSignal.fatigueLevel === 'high' ? 'fadiga alta' : effectiveAdaptiveSignal.fatigueLevel === 'moderate' ? 'fadiga moderada' : 'fadiga baixa'}`);
        }
        if (precisionProfile) {
          personalNotes.push(`🎯 Política de precisão: ${precisionProfile.label} (meta ${precisionProfile.target.targetPrecisionScore}/100).`);
        }

        const withNotes = { ...mappedResult, personalNotes, optionLabel: 'Router' };
        const withColdStart = coldStartMode ? applyColdStartProtocol(withNotes) : withNotes;
        const finalResult = applyMicrocycle(withColdStart);

        setWorkoutOptions([finalResult]);
        setResult(finalResult);
        void logFunnelEvent('workout_generation_succeeded', {
          provider: `ai_router:${intentResult.provider}`,
          clientId: selectedClient.id,
          optionsCount: 1,
          coldStartMode,
          fallbackUsed: intentResult.fallbackUsed,
          adaptiveReadiness: effectiveAdaptiveSignal?.readinessScore,
          injuryRiskScore: preRisk.score,
          precisionSegment: precisionProfile?.segment
        });
      } else {
        // FALLBACK 2: Local deterministic generation
        const localExercisesForFallback = await ensureExerciseCatalog();
        let workout = generateSmartWorkout(selectedClient, observations, localExercisesForFallback);
        if (coldStartMode) {
          workout = applyColdStartProtocol(workout);
        }
        workout = applyMicrocycle(workout);
        setWorkoutOptions([workout]);
        setResult(workout);
        void logFunnelEvent('workout_generation_fallback_local', {
          clientId: selectedClient.id,
          coldStartMode,
          adaptiveReadiness: effectiveAdaptiveSignal?.readinessScore,
          injuryRiskScore: preRisk.score,
          precisionSegment: precisionProfile?.segment
        });
      }
    } catch (error) {
      console.error('Error generating workout:', error);
      void logFunnelEvent('workout_generation_failed', {
        clientId: selectedClient.id,
        coldStartMode,
        adaptiveReadiness: effectiveAdaptiveSignal?.readinessScore,
        precisionSegment: precisionProfile?.segment,
        error: error instanceof Error ? error.message : 'unknown_error'
      });
      const localExercisesForFallback = await ensureExerciseCatalog();
      let workout = generateSmartWorkout(selectedClient, observations, localExercisesForFallback);
      if (coldStartMode) {
        workout = applyColdStartProtocol(workout);
      }
      workout = applyMicrocycle(workout);
      setWorkoutOptions([workout]);
      setResult(workout);
      void logFunnelEvent('workout_generation_fallback_local', {
        clientId: selectedClient.id,
        coldStartMode,
        adaptiveReadiness: effectiveAdaptiveSignal?.readinessScore,
        injuryRiskScore: preRisk.score,
        precisionSegment: precisionProfile?.segment
      });
    } finally {
      setLoading(false);
      setActiveTabIndex(0);
    }
  };

  // Select workout option
  const selectWorkoutOption = (index: number) => {
    setSelectedOptionIndex(index);
    setResult(workoutOptions[index]);
    setActiveTabIndex(0);
  };

  const handleSaveWorkout = async () => {
    if (!user?.id) {
      setErrorToast('Você precisa estar logado para salvar treinos.');
      return;
    }

    setLoading(true);
    // Use a loading message if available or just wait

    try {
      if (selectedClient && result) {
        void logFunnelEvent('workout_save_started', {
          coachId: user.id,
          clientId: selectedClient.id,
          coldStartMode: !!result?.coldStartMode,
          precisionSegment: precisionProfile?.segment
        });
        const { saveAIWorkout } = await loadWorkoutsDomain();
        // Prepare metadata
        const metadata = {
          model: 'gemini-2.5-flash',
          optionSelected: workoutOptions[selectedOptionIndex]?.optionLabel || 'default',
          generatedAt: new Date().toISOString(),
          coldStartMode: !!result?.coldStartMode,
          calibrationPlan: result?.calibrationPlan || null,
          injuryRisk: injuryRisk
            ? {
              score: injuryRisk.score,
              level: injuryRisk.level
            }
            : null,
          precisionProfile: precisionProfile
            ? {
              segment: precisionProfile.segment,
              label: precisionProfile.label,
              targetPrecisionScore: precisionProfile.target.targetPrecisionScore,
              maxMeanRpeError: precisionProfile.target.maxMeanRpeError,
              maxMeanRirError: precisionProfile.target.maxMeanRirError,
              maxPainRate: precisionProfile.target.maxPainRate
            }
            : null,
          clientData: {
            injuries: selectedClient.injuries,
            preferences: selectedClient.preferences,
            adherence: selectedClient.adherence
          }
        };

        const coachId = user.id;

        await saveAIWorkout(
          selectedClient.id,
          coachId,
          result,
          metadata
        );
        void logFunnelEvent('workout_save_succeeded', {
          coachId: user.id,
          clientId: selectedClient.id,
          coldStartMode: !!result?.coldStartMode,
          precisionSegment: precisionProfile?.segment
        });
      }
    } catch (error) {
      console.error('Error saving workout:', error);
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
  };

  const handleExportPDF = () => {
    if (!result) return;
    const escapeHtml = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (printWindow) {
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
            ${result.splits.map((s: any) => `
              <div class="split">
                <h3>${escapeHtml(s.name)}</h3>
                ${s.exercises.map((e: any) => `
                  <div class="exercise">
                    <div>
                      <div class="name">${escapeHtml(e.name)}</div>
                      <div class="meta">${escapeHtml(e.targetMuscle)}</div>
                    </div>
                    <div class="details">
                      ${escapeHtml(e.sets)} séries x ${escapeHtml(e.reps)} <br/>
                      Descanso: ${escapeHtml(e.rest)}
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
  };

  const handleSendWhatsApp = () => {
    if (!result) return;
    const currentSplit = result.splits?.[activeTabIndex];

    let message = `🏋️ *${result.title}*\n\n`;
    message += `📋 *${currentSplit?.name}*\n\n`;

    currentSplit?.exercises?.forEach((ex: any, i: number) => {
      message += `${i + 1}. *${ex.name}*\n`;
      message += `   ${ex.sets} séries x ${ex.reps} • Descanso: ${ex.rest}\n\n`;
    });

    message += `\n💪 Bom treino, ${selectedClient?.name}!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
        <div className="w-full max-w-md h-full flex flex-col items-center justify-center p-8 overflow-hidden relative" style={{ background: 'var(--bg-void)' }}>
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-1/4 left-1/4 size-64 rounded-full blur-[100px] animate-pulse" style={{ background: '#1E3A8A' }}></div>
            <div className="absolute bottom-1/4 right-1/4 size-64 rounded-full blur-[100px] animate-pulse delay-1000" style={{ background: '#3B82F6' }}></div>
          </div>

          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="size-24 rounded-[32px] flex items-center justify-center mb-10 animate-bounce" style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)', boxShadow: '0 0 60px rgba(30, 58, 138,0.5)' }}>
              <span className="material-symbols-outlined text-white text-[48px]">psychology</span>
            </div>

            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">PersonalPro IA</h2>
            <div className="h-6 overflow-hidden">
              <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: '#3B82F6' }}>
                {messages[loadingMessageIndex]}
              </p>
            </div>

            <div className="mt-12 w-64 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(59, 130, 246,0.1)' }}>
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{ width: `${(loadingMessageIndex + 1) * 20}%`, background: 'linear-gradient(90deg,#1E3A8A,#3B82F6)' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen text-white selection:bg-blue-500/30" style={{ background: 'var(--bg-void)' }}>
      <PageHeader
        title="AI Builder"
        subtitle="Protocolos de Elite"
        onBack={onBack}
        accentColor="blue"
      />

      {errorToast && (
        <AIBuilderErrorToast message={errorToast} onClose={() => setErrorToast(null)} />
      )}

      <div className="px-6 space-y-8 pb-32">
        <AIBuilderWizardHeader
          wizardStep={wizardStep}
          canAdvanceFromProfileStep={canAdvanceFromProfileStep}
          canAdvanceFromRiskStep={canAdvanceFromRiskStep}
          goToWizardStep={goToWizardStep}
        />

        {wizardStep === 1 && (
          <AIBuilderWizardStepProfile
            fetchingClients={fetchingClients}
            clients={clients}
            selectedClient={selectedClient}
            selectedGoal={selectedGoal}
            selectedDays={selectedDays}
            setSelectedClient={setSelectedClient}
            setSelectedGoal={setSelectedGoal}
            setSelectedDays={setSelectedDays}
            handleContinueFromProfile={handleContinueFromProfile}
            canAdvanceFromProfileStep={canAdvanceFromProfileStep}
          />
        )}

        {wizardStep === 2 && (
          <AIBuilderWizardStepRisk
            selectedClient={selectedClient}
            observations={observations}
            setObservations={setObservations}
            quickTags={quickTags}
            loadingAdaptiveSignal={loadingAdaptiveSignal}
            adaptiveSignal={adaptiveSignal}
            injuryRisk={injuryRisk}
            precisionProfile={precisionProfile}
            canAdvanceFromRiskStep={canAdvanceFromRiskStep}
            handleContinueFromRisk={handleContinueFromRisk}
            onBack={() => setWizardStep(1)}
          />
        )}

        {wizardStep === 3 && (
          <AIBuilderWizardStepGenerate
            selectedClient={selectedClient}
            selectedGoal={selectedGoal}
            selectedDays={selectedDays}
            injuryRisk={injuryRisk}
            loading={loading}
            onBack={() => setWizardStep(2)}
            onGenerate={handleGenerate}
          />
        )}
      </div>


      {/* Result Modal */}
      {result && (
        <AIBuilderResultModal
          result={result}
          selectedClientName={selectedClient?.name}
          activeTabIndex={activeTabIndex}
          setActiveTabIndex={setActiveTabIndex}
          workoutOptions={workoutOptions}
          selectedOptionIndex={selectedOptionIndex}
          selectWorkoutOption={selectWorkoutOption}
          feedback={feedback}
          onFeedback={handleFeedback}
          editingExercise={editingExercise}
          setEditingExercise={setEditingExercise}
          handleRegenerateExercise={handleRegenerateExercise}
          regeneratingId={regeneratingId}
          updateExercise={updateExercise}
          removeExercise={removeExercise}
          openAddExerciseModal={openAddExerciseModal}
          refinementInput={refinementInput}
          setRefinementInput={setRefinementInput}
          handleRefine={handleRefine}
          isRefining={isRefining}
          showAddExercise={showAddExercise}
          setShowAddExercise={setShowAddExercise}
          exerciseSearch={exerciseSearch}
          setExerciseSearch={setExerciseSearch}
          filteredExercisesForAdd={filteredExercisesForAdd}
          loadingExerciseCatalog={loadingExerciseCatalog}
          addExercise={addExercise}
          onClose={() => setResult(null)}
          handleExportPDF={handleExportPDF}
          handleSendWhatsApp={handleSendWhatsApp}
          handleSaveWorkout={handleSaveWorkout}
        />
      )}
    </div>
  );
};

export default AIBuilderView;
