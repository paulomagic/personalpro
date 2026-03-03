import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Client } from '../types';
import { ThumbsUp, ThumbsDown, RefreshCw, Download } from 'lucide-react';
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
import PageHeader from '../components/PageHeader';

const DetectionFeedback = lazy(() => import('../components/DetectionFeedback'));

// Feature flag: use new AI Router (Groq + intention-based)
const USE_NEW_AI_ROUTER = true;

interface AIBuilderViewProps {
  user: any;
  onBack: () => void;
  onDone: () => void;
}

interface MockExercise {
  id?: string;
  name: string;
  targetMuscle?: string;
  category?: string;
  sets?: Array<{ reps?: string }>;
}

const loadDemoData = () => import('../mocks/demoData');
const loadGeminiService = () => import('../services/geminiService');
const loadTrainingEngine = () => import('../services/ai/trainingEngine');
const loadAIRouter = () => import('../services/ai/aiRouter');
const loadClientsDomain = () => import('../services/supabase/domains/clientsDomain');
const loadWorkoutsDomain = () => import('../services/supabase/domains/workoutsDomain');

const hasMeaningfulLastTraining = (value?: string): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return !normalized.includes('não registrado') && !normalized.includes('iniciando');
};

const isColdStartClient = (client: Client): boolean => {
  const hasAssessments = Array.isArray(client.assessments) && client.assessments.length > 0;
  const hasCompletedClasses = (client.completedClasses || 0) > 0;
  const hasTrainingHistory = hasMeaningfulLastTraining(client.lastTraining);
  return !hasAssessments && !hasCompletedClasses && !hasTrainingHistory;
};

const parseRestToSeconds = (rest: string | number | undefined): number => {
  if (typeof rest === 'number') return rest;
  if (!rest) return 90;
  const asText = String(rest).trim().toLowerCase();

  const mmss = asText.match(/^(\d+):(\d{1,2})$/);
  if (mmss) {
    return Number(mmss[1]) * 60 + Number(mmss[2]);
  }

  if (asText.includes('min')) {
    const match = asText.match(/(\d+)/);
    if (match) return Number(match[1]) * 60;
  }

  const match = String(rest).match(/(\d+)/);
  return match ? Number(match[1]) : 90;
};

const formatRestSeconds = (seconds: number): string => `${Math.max(45, Math.round(seconds))}s`;

const applyColdStartProtocol = (workout: any) => {
  if (!workout?.splits) return workout;

  const tunedSplits = workout.splits.map((split: any) => ({
    ...split,
    exercises: (split.exercises || []).map((exercise: any) => {
      const tuneRest = (value: string | number | undefined) => formatRestSeconds(parseRestToSeconds(value) + 15);

      let tunedSets: any = Math.max(2, Number(exercise.sets || 3) - 1);
      if (Array.isArray(exercise.sets)) {
        const targetCount = Math.max(2, exercise.sets.length - 1);
        tunedSets = exercise.sets.slice(0, targetCount).map((setItem: any) => ({
          ...setItem,
          rest: tuneRest(setItem?.rest ?? exercise.rest)
        }));
      }

      const tunedRest = tuneRest(exercise.rest);
      return {
        ...exercise,
        sets: tunedSets,
        rest: tunedRest
      };
    })
  }));

  const existingNotes: string[] = Array.isArray(workout.personalNotes) ? workout.personalNotes : [];
  const coldStartNotes = [
    '🧭 Cold Start ativo: volume inicial reduzido para calibrar resposta individual.',
    '📈 Sessão 1: validar técnica, dor e tolerância de carga.',
    '📈 Sessão 2: manter carga e ajustar reps com base no RPE/RIR.',
    '📈 Sessão 3: iniciar progressão de carga se execução estiver estável.',
    '📝 Obrigatório coletar feedback pós-treino (RPE, dor, dificuldade, conclusão).'
  ];

  return {
    ...workout,
    splits: tunedSplits,
    coldStartMode: true,
    calibrationPlan: {
      sessions: 3,
      objectives: [
        'Baseline técnico',
        'Calibração de esforço percebido',
        'Início de progressão segura'
      ]
    },
    personalNotes: [...existingNotes, ...coldStartNotes]
  };
};

// ============ PERSONALIZED AI WORKOUT GENERATOR ============
const generateSmartWorkout = (client: Client, observations: string, exerciseCatalog: MockExercise[]) => {
  const { name, goal, level, adherence, injuries, preferences } = client;

  // 1. FILTER EXERCISES BY INJURIES
  const injuryKeywords = extractKeywords(injuries || '');
  const filteredExercises = exerciseCatalog.filter(ex => {
    const exName = ex.name.toLowerCase();
    const exMuscle = (ex.targetMuscle || '').toLowerCase();

    // Check if exercise conflicts with any injury
    for (const keyword of injuryKeywords) {
      if (keyword.includes('joelho') && (exName.includes('agachamento') || exName.includes('leg press'))) return false;
      if (keyword.includes('ombro') && (exName.includes('desenvolvimento') || exName.includes('elevação') || exName.includes('supino inclinado'))) return false;
      if (keyword.includes('coluna') || keyword.includes('hérnia') || keyword.includes('disco')) {
        if (exName.includes('stiff') || exName.includes('terra') || exName.includes('agachamento livre') || exName.includes('good morning')) return false;
      }
      if (keyword.includes('pulso') && (exName.includes('rosca') || exName.includes('flexão'))) return false;
    }
    return true;
  });

  // 2. PRIORITIZE PREFERRED EXERCISES
  const preferenceKeywords = extractKeywords(preferences || '');
  const prioritizedExercises = [...filteredExercises].sort((a, b) => {
    const aScore = preferenceKeywords.some(k => a.name.toLowerCase().includes(k)) ? -1 : 0;
    const bScore = preferenceKeywords.some(k => b.name.toLowerCase().includes(k)) ? -1 : 0;
    return aScore - bScore;
  });

  // 3. ADJUST VOLUME BY ADHERENCE
  let exercisesPerSplit = 5;
  let setsPerExercise = 4;
  if (adherence >= 85) {
    exercisesPerSplit = 6;
    setsPerExercise = 4;
  } else if (adherence >= 70) {
    exercisesPerSplit = 5;
    setsPerExercise = 4;
  } else if (adherence >= 50) {
    exercisesPerSplit = 4;
    setsPerExercise = 3;
  } else {
    exercisesPerSplit = 3;
    setsPerExercise = 3;
  }

  // 4. ADJUST COMPLEXITY BY LEVEL
  const methodsByLevel: { [key: string]: string[] } = {
    'Iniciante': ['simples'],
    'Intermediário': ['simples', 'piramide', 'biset'],
    'Avançado': ['simples', 'piramide', 'biset', 'dropset', 'restPause'],
    'Atleta': ['simples', 'piramide', 'biset', 'dropset', 'restPause', 'cluster', 'myo']
  };
  const allowedMethods = methodsByLevel[level] || methodsByLevel['Intermediário'];

  // Helper to get exercises by muscle with personalization
  const getEx = (muscle: string, count: number) => {
    return prioritizedExercises
      .filter(e => (e.targetMuscle?.includes(muscle) ?? false) || (muscle === 'Cardio' && e.category === 'cardio'))
      .slice(0, count)
      .map(e => ({
        name: e.name,
        sets: setsPerExercise,
        reps: e.sets?.[0]?.reps || '12',
        rest: level === 'Iniciante' ? '90s' : level === 'Avançado' || level === 'Atleta' ? '60s' : '75s',
        targetMuscle: e.targetMuscle || 'Geral',
        method: allowedMethods[Math.floor(Math.random() * allowedMethods.length)]
      }));
  };

  // 5. BUILD SPLITS BASED ON GOAL
  let splits: any[] = [];
  let title = '';
  let objective = '';
  let personalNotes: string[] = [];

  // Generate personal notes
  if (injuries && injuries.toLowerCase() !== 'nenhuma') {
    personalNotes.push(`⚠️ Evitando exercícios que afetam: ${injuries.split('-')[0].trim()}`);
  }
  if (adherence < 60) {
    personalNotes.push(`📉 Treino reduzido: aderência em ${adherence}% - foco em consistência`);
  } else if (adherence >= 85) {
    personalNotes.push(`🔥 Volume aumentado: aderência excelente (${adherence}%)`);
  }
  if (preferences) {
    personalNotes.push(`❤️ Priorizando: ${preferences.split('.')[0]}`);
  }
  if (observations) {
    personalNotes.push(`📝 ${observations}`);
  }

  if (goal.toLowerCase().includes('hipertrofia') || goal.toLowerCase().includes('glúteo')) {
    title = `Protocolo Hipertrofia - ${name}`;
    objective = `Foco em tensão mecânica e volume progressivo. ${level === 'Iniciante' ? 'Ênfase em técnica.' : 'Métodos avançados aplicados.'}`;

    const isGlutesFocus = goal.toLowerCase().includes('glúteo');

    if (isGlutesFocus) {
      splits = [
        { name: 'A - Glúteo & Posterior', exercises: [...getEx('Glúteo', 3), ...getEx('Posterior de Coxa', 2)] },
        { name: 'B - Superior Completo', exercises: [...getEx('Costas', 2), ...getEx('Peito', 2), ...getEx('Ombro', 1)] },
        { name: 'C - Quadríceps & Panturrilha', exercises: [...getEx('Quadríceps', 3), ...getEx('Panturrilha', 1), ...getEx('Cardio', 1)] }
      ];
    } else {
      splits = [
        { name: 'A - Empurrar (Push)', exercises: [...getEx('Peito', 2), ...getEx('Ombro', 2), ...getEx('Tríceps', 1)] },
        { name: 'B - Puxar (Pull)', exercises: [...getEx('Costas', 3), ...getEx('Bíceps', 2)] },
        { name: 'C - Pernas Completo', exercises: [...getEx('Quadríceps', 2), ...getEx('Posterior de Coxa', 1), ...getEx('Glúteo', 1), ...getEx('Panturrilha', 1)] }
      ];
    }
  } else if (goal.toLowerCase().includes('perda') || goal.toLowerCase().includes('emagrecimento')) {
    title = `Protocolo Fat Burn - ${name}`;
    objective = `Alta densidade metabólica. Descansos curtos. ${adherence < 60 ? 'Adaptado ao seu ritmo.' : 'Intensidade máxima.'}`;

    splits = [
      { name: 'A - Full Body Metabólico', exercises: [...getEx('Quadríceps', 1), ...getEx('Peito', 1), ...getEx('Costas', 1), ...getEx('Cardio', 2)] },
      { name: 'B - Inferior + HIIT', exercises: [...getEx('Glúteo', 2), ...getEx('Posterior de Coxa', 1), ...getEx('Cardio', 2)] }
    ];
  } else if (goal.toLowerCase().includes('força')) {
    title = `Protocolo Força Máxima - ${name}`;
    objective = `Foco em cargas altas e descansos longos para máxima força. Métodos: ${allowedMethods.slice(0, 2).join(', ')}.`;

    splits = [
      { name: 'A - Supino & Acessórios', exercises: [...getEx('Peito', 2), ...getEx('Tríceps', 2), ...getEx('Ombro', 1)] },
      { name: 'B - Agachamento & Posterior', exercises: [...getEx('Quadríceps', 2), ...getEx('Posterior de Coxa', 2), ...getEx('Panturrilha', 1)] },
      { name: 'C - Terra & Costas', exercises: [...getEx('Costas', 3), ...getEx('Bíceps', 2)] }
    ];
  } else if (goal.toLowerCase().includes('condicionamento')) {
    title = `Protocolo Condicionamento - ${name}`;
    objective = `Treino funcional e metabólico para condicionamento geral.`;

    splits = [
      { name: 'A - Funcional Full Body', exercises: [...getEx('Full Body', 3), ...getEx('Cardio', 2)] },
      { name: 'B - Força & Resistência', exercises: [...getEx('Quadríceps', 1), ...getEx('Costas', 1), ...getEx('Peito', 1), ...getEx('Cardio', 2)] }
    ];
  } else {
    // Default / Bem-estar / Other
    title = `Protocolo Personalizado - ${name}`;
    objective = `Treino equilibrado para saúde e bem-estar geral.`;

    splits = [
      { name: 'Treino Adaptativo', exercises: [...getEx('Quadríceps', 1), ...getEx('Peito', 1), ...getEx('Costas', 1), ...getEx('Cardio', 1)] }
    ];
  }

  return {
    title,
    objective,
    splits,
    personalNotes,
    clientLevel: level,
    adherenceScore: adherence
  };
};

// Helper: Extract keywords from text
const extractKeywords = (text: string): string[] => {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[.,;:!?]/g, ' ')
    .split(' ')
    .filter(word => word.length > 3)
    .filter(word => !['para', 'como', 'mais', 'muito', 'pouco', 'evitar', 'cuidado', 'lesão', 'antiga', 'prefere', 'gosta'].includes(word));
};

const AIBuilderView: React.FC<AIBuilderViewProps> = ({ user, onBack, onDone }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
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

  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const handleRegenerateExercise = async (splitIdx: number, exIdx: number, currentExercise: any) => {
    if (!selectedClient) return;
    const id = `${splitIdx}-${exIdx}`;
    setRegeneratingId(id);

    try {
      const { regenerateExerciseWithAI } = await loadGeminiService();
      const newExercise = await regenerateExerciseWithAI(
        currentExercise.name,
        currentExercise.targetMuscle,
        selectedClient.goal,
        selectedClient.injuries,
        'Academia completa'
      );

      if (newExercise) {
        const newResult = { ...result };
        newResult.splits[splitIdx].exercises[exIdx] = {
          ...newExercise,
          regenerated: true // Flag to show animation or label
        };
        setResult(newResult);
      }
    } catch (error) {
      console.error('Error regenerating exercise:', error);
    } finally {
      setRegeneratingId(null);
    }
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
    const fetchClients = async () => {
      setFetchingClients(true);
      try {
        const { getClients, mapDBClientToClient } = await loadClientsDomain();

        // Buscar clientes reais do banco de dados
        if (user?.id) {
          const dbClients = await getClients(user.id, { limit: 100 });
          if (dbClients && dbClients.length > 0) {
            const mappedClients = dbClients.map(mapDBClientToClient) as Client[];
            setClients(mappedClients);
            setSelectedClient(mappedClients[0]);
          } else {
            // Fallback para mockClients se não houver clientes no banco
            const mockClients = await loadFallbackClients();
            setClients(mockClients);
            setSelectedClient(mockClients[0]);
          }
        } else {
          // Sem user logado - usar mockClients
          const mockClients = await loadFallbackClients();
          setClients(mockClients);
          setSelectedClient(mockClients[0]);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        // Fallback para mockClients em caso de erro
        const mockClients = await loadFallbackClients();
        setClients(mockClients);
        setSelectedClient(mockClients[0]);
      } finally {
        setFetchingClients(false);
      }
    };

    fetchClients();
  }, [user?.id]);

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

  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Auto-hide error toast after 5 seconds
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const handleRefine = async () => {
    if (!refinementInput || !result) return;
    setIsRefining(true);
    setErrorToast(null);

    try {
      const { refineWorkoutWithAI, handleAIError } = await loadGeminiService();
      const refinedResult = await refineWorkoutWithAI(result, refinementInput);

      if (refinedResult) {
        const localExercises = await ensureExerciseCatalog();
        // Re-apply local verification
        const mappedResult = mapToLocalExercises(refinedResult, localExercises);

        // Preserve or add notes
        const currentNotes = result.personalNotes || [];
        mappedResult.personalNotes = [...currentNotes, `✨ Ajuste: "${refinementInput}"`];

        setResult(mappedResult);
        setRefinementInput('');
      } else {
        setErrorToast('🤖 Não foi possível refinar. Tente novamente.');
      }
    } catch (error: any) {
      const { handleAIError } = await loadGeminiService();
      const aiError = handleAIError(error);
      setErrorToast(aiError.userMessage);
      console.error('Error refining workout:', aiError.message);
    } finally {
      setIsRefining(false);
    }
  };

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

    const clientExtendedData = {
      injuries: selectedClient.injuries,
      preferences: selectedClient.preferences,
      adherence: selectedClient.adherence,
      equipment: ['Academia completa', 'Halteres', 'Barras', 'Máquinas'],
      sessionDuration: coldStartMode ? 50 : 60,
      previousWorkouts: [],
      recentProgress: observations || '',
      adaptiveSignal: effectiveAdaptiveSignal,
      injuryRisk: preRisk,
      precisionProfile: precisionProfile
        ? {
          segment: precisionProfile.segment,
          targetScore: precisionProfile.target.targetPrecisionScore
        }
        : null
    };

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

      // FALLBACK: Old generation method (Gemini)
      const variationPrompts = [
        combinedObservations || observations, // Original
        `${combinedObservations}. Foco em métodos avançados como drop sets e supersets.`, // Variation 2
        `${combinedObservations}. Priorize exercícios funcionais e compostos.` // Variation 3
      ];
      const { generateWorkoutWithAI } = await loadGeminiService();

      const results = await Promise.all(
        variationPrompts.map(obs =>
          generateWorkoutWithAI(
            selectedClient.name,
            effectiveGoal,
            selectedClient.level,
            adaptiveDays,
            obs,
            clientExtendedData
          ).catch(() => null)
        )
      );

      // Filter successful results and add metadata
      const localExercises = await ensureExerciseCatalog();
      const successfulCount = results.filter(r => r).length;
      const successfulResults = results
        .filter(r => r !== null)
        .map((aiResult, idx) => {
          // Map to local DB for hybrid validation
          const mappedResult = mapToLocalExercises(aiResult, localExercises);

          const personalNotes = [
            '🤖 Treino gerado por Gemini 2.5 Flash',
            `📋 Opção ${idx + 1} de ${successfulCount}`
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
          const resultWithNotes = { ...mappedResult, personalNotes, optionLabel: idx === 0 ? 'Clássico' : idx === 1 ? 'Avançado' : 'Funcional' };
          const withColdStart = coldStartMode ? applyColdStartProtocol(resultWithNotes) : resultWithNotes;
          return applyMicrocycle(withColdStart);
        });

      if (successfulResults.length > 0) {
        setWorkoutOptions(successfulResults);
        setResult(successfulResults[0]);
        void logFunnelEvent('workout_generation_succeeded', {
          provider: 'gemini',
          clientId: selectedClient.id,
          optionsCount: successfulResults.length,
          coldStartMode,
          adaptiveReadiness: effectiveAdaptiveSignal?.readinessScore,
          injuryRiskScore: preRisk.score,
          precisionSegment: precisionProfile?.segment
        });
      } else {
        // Fallback to local generation
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

    const printWindow = window.open('', '_blank');
    if (printWindow) {
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
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
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

      <div className="px-6 space-y-8 pb-32">
        {/* Client Selection */}
        <section className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="material-symbols-outlined text-blue-400 text-xl">person_search</span>
              <h3 className="font-black text-white tracking-tight">Selecione o Aluno</h3>
            </div>
            {fetchingClients ? (
              <div className="h-24 glass-card rounded-[24px] animate-pulse bg-white/5" />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`min-w-[100px] flex flex-col items-center gap-3 p-4 rounded-[24px] transition-all duration-300 relative overflow-hidden group ${selectedClient?.id === client.id
                      ? 'glass-card border border-blue-500/50 bg-blue-500/10 shadow-glow scale-105'
                      : 'glass-card border border-white/5 opacity-60 hover:opacity-100 hover:border-blue-500/30'
                      }`}
                  >
                    {selectedClient?.id === client.id && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                    )}
                    <div
                      className={`size-[60px] rounded-[20px] bg-cover bg-center border-2 relative z-10 ${selectedClient?.id === client.id ? 'border-blue-400 shadow-lg shadow-blue-500/30' : 'border-white/10 group-hover:border-blue-400/50'
                        } transition-colors`}
                      style={{ backgroundImage: client.avatar ? `url(${client.avatar})` : 'none' }}
                    >
                      {!client.avatar && <span className="material-symbols-outlined text-slate-500 flex h-full items-center justify-center">person</span>}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 ${selectedClient?.id === client.id ? 'text-blue-400' : 'text-slate-500'
                      }`}>{client.name.split(' ')[0]}</span>
                  </button>
                ))}
                {clients.length === 0 && (
                  <p className="text-xs text-slate-500 font-bold px-2 italic">Nenhum aluno cadastrado.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="material-symbols-outlined text-indigo-400 text-xl">target</span>
              <h3 className="font-black text-white tracking-tight">Objetivo Principal</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Hipertrofia', 'Emagrecimento', 'Resistência', 'Saúde'].map(goal => (
                <button
                  key={goal}
                  onClick={() => setSelectedGoal(goal)}
                  className={`px-4 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group ${selectedGoal === goal
                    ? 'bg-blue-600 border border-blue-400 text-white shadow-glow translate-y-[-2px]'
                    : 'glass-card border border-white/5 text-slate-400 hover:border-blue-500/30 hover:text-white'
                    }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="material-symbols-outlined text-blue-400 text-xl">notes</span>
            <h3 className="font-black text-white tracking-tight">Observações</h3>
          </div>

          <div className="glass-card rounded-[28px] p-4 mb-4 border border-white/5 focus-within:border-blue-500/50 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-all group-focus-within:bg-blue-500/10" />
            <textarea
              placeholder="Ex: Aluno com lesão no ombro, focar em bíceps..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-transparent text-white placeholder:text-slate-500 text-sm outline-none min-h-[120px] resize-none font-medium relative z-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickTags.map(tag => (
              <button
                key={tag}
                onClick={() => setObservations(prev => prev ? `${prev}, ${tag}` : tag)}
                className="px-4 py-2 rounded-full glass-card border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* NOVO: Feedback de condições detectadas */}
          {selectedClient && (observations || selectedClient.injuries || selectedClient.observations) && (
            <div className="mt-4">
              <Suspense fallback={<div className="h-24 glass-card rounded-2xl animate-pulse bg-white/5" />}>
                <DetectionFeedback
                  observations={`${observations} ${selectedClient.observations || ''}`}
                  injuries={selectedClient.injuries}
                  age={selectedClient.age}
                  weight={selectedClient.weight}
                  height={selectedClient.height}
                  compact={false}
                />
              </Suspense>
            </div>
          )}

          {selectedClient && (
            <div className="mt-4 glass-card rounded-[24px] p-4 border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">IA Adaptativa</p>
                <p className="text-[10px] text-slate-400">
                  {loadingAdaptiveSignal ? 'analisando...' : adaptiveSignal ? `${adaptiveSignal.sourceSessions} sessões` : 'sem dados'}
                </p>
              </div>
              {adaptiveSignal ? (
                <div className="space-y-2">
                  <p className="text-sm text-white font-bold">
                    Readiness: <span className="text-blue-300">{adaptiveSignal.readinessScore}/100</span> · Fadiga: <span className="uppercase">{adaptiveSignal.fatigueLevel}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    Ajuste sugerido: {adaptiveSignal.recommendedVolumeDeltaPct >= 0 ? '+' : ''}{adaptiveSignal.recommendedVolumeDeltaPct}% volume, {adaptiveSignal.recommendedIntensityDeltaPct >= 0 ? '+' : ''}{adaptiveSignal.recommendedIntensityDeltaPct}% intensidade, {adaptiveSignal.recommendedDaysPerWeek} dias/semana.
                  </p>
                  <p className="text-[11px] text-slate-400">{adaptiveSignal.rationale}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Sem histórico suficiente. A IA usa baseline conservador.</p>
              )}
            </div>
          )}

          {selectedClient && injuryRisk && (
            <div className={`mt-4 glass-card rounded-[24px] p-4 border ${injuryRisk.level === 'critical'
              ? 'border-red-500/40 bg-red-500/10'
              : injuryRisk.level === 'high'
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-emerald-500/30 bg-emerald-500/10'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest">Risco de Lesão</p>
                <p className="text-xs font-black">{injuryRisk.score}/100 · {injuryRisk.level.toUpperCase()}</p>
              </div>
              {injuryRisk.factors.length > 0 && (
                <p className="text-xs text-slate-200 mb-2">{injuryRisk.factors[0]}</p>
              )}
              <p className="text-[11px] text-slate-300">
                {injuryRisk.blockGeneration
                  ? 'Geração bloqueada preventivamente. Revise lesões/dor e reduza risco antes de prosseguir.'
                  : injuryRisk.conservativeMode
                    ? 'Planner em modo conservador: IA reduzirá estímulo e progressão.'
                    : 'Risco controlado: progressão padrão com monitoramento.'}
              </p>
            </div>
          )}

          {selectedClient && precisionProfile && (
            <div className="mt-4 glass-card rounded-[24px] p-4 border border-indigo-500/30 bg-indigo-500/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Precisão da IA</p>
                <p className="text-[10px] text-indigo-100">{precisionProfile.segment}</p>
              </div>
              <p className="text-sm text-white font-bold mb-1">{precisionProfile.label}</p>
              <p className="text-xs text-slate-300 mb-2">{precisionProfile.rationale}</p>
              <p className="text-[11px] text-indigo-100">
                Meta: {precisionProfile.target.targetPrecisionScore}/100 · erro RPE ≤ {precisionProfile.target.maxMeanRpeError} · erro RIR ≤ {precisionProfile.target.maxMeanRirError}
              </p>
            </div>
          )}
        </section>

        <div className="pt-6">
          <button
            onClick={handleGenerate}
            disabled={!selectedClient || !selectedGoal || loading || Boolean(injuryRisk?.blockGeneration)}
            className="w-full h-[68px] glass-card rounded-[24px] relative overflow-hidden group disabled:opacity-30 disabled:grayscale transition-all active:scale-[0.98] border border-blue-500/30 hover:border-blue-400 shadow-xl shadow-blue-900/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 transition-all group-hover:opacity-100" />
            <div className="absolute inset-0 flex items-center justify-center gap-3 z-10">
              <span className="material-symbols-outlined text-white">bolt</span>
              <span className="text-white font-black uppercase tracking-[0.2em] text-[13px] text-shadow-sm">Forjar Protocolo de Elite</span>
            </div>
          </button>
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
          <div className="w-full max-w-md h-full flex flex-col animate-fade-in relative" style={{ background: 'var(--bg-void)' }}>
            <div className="absolute inset-0 z-0 opacity-15">
              <div className="absolute top-0 right-0 size-96 rounded-full blur-[120px]" style={{ background: '#1E3A8A' }}></div>
              <div className="absolute bottom-0 left-0 size-96 rounded-full blur-[120px]" style={{ background: '#3B82F6' }}></div>
            </div>

            {/* Error Toast */}
            {errorToast && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
                <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-red-400/30 flex items-center gap-3">
                  <span className="text-sm font-medium">{errorToast}</span>
                  <button onClick={() => setErrorToast(null)} className="text-white/80 hover:text-white">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
            )}

            <header className="relative z-10 px-6 pt-14 pb-6 glass-card bg-slate-950/50 border-0 border-b border-white/10 rounded-0">
              <div className="flex justify-between items-center">
                <button onClick={() => setResult(null)} className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>

                <div className="text-center">
                  <h3 className="text-lg font-black text-white tracking-tight">{result.title}</h3>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{selectedClient?.name}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleExportPDF} className="size-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/20 transition-all active:scale-95" title="Exportar PDF/Imprimir">
                    <Download size={18} />
                  </button>
                  <button onClick={handleSendWhatsApp} className="size-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-all active:scale-95" title="Enviar no WhatsApp">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
              </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto px-6 py-6 no-scrollbar pb-44">
              <div className="glass-card rounded-[32px] p-6 mb-4 border-l-4 border-blue-500">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estratégia de Treino</p>
                <p className="text-white font-medium leading-relaxed">{result.objective}</p>
              </div>

              {/* Mesocycle Periodization */}
              {result.mesocycle && result.mesocycle.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">📅 Periodização (Mesociclo 4 Semanas)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {result.mesocycle.map((week: any, idx: number) => (
                      <div key={idx} className="glass-card p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
                        <div className="flex justify-between mb-1">
                          <span className="text-[9px] font-bold text-blue-400 uppercase">Semana {week.week}</span>
                          <span className="text-[9px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">{week.phase}</span>
                        </div>
                        <p className="text-white text-xs font-bold mb-1">{week.focus}</p>
                        <p className="text-[10px] text-slate-400 leading-tight">{week.instruction || 'Aumentar carga progressivamente.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workout Options Selector */}
              {workoutOptions.length > 1 && (
                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">🎯 Escolha uma Variação</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {workoutOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectWorkoutOption(idx)}
                        className={`flex-shrink-0 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selectedOptionIndex === idx
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30'
                          : 'glass-card text-slate-400 hover:text-white'
                          }`}
                      >
                        <span className="block">{option.optionLabel || `Opção ${idx + 1}`}</span>
                        <span className="text-[8px] opacity-70 mt-1 block">{option.title?.split(' - ')[0] || ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Loop */}
              {result && (
                <div className="flex items-center justify-between mb-4 px-2">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Avalie este resultado</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback('positive')}
                      className={`p-2 rounded-full transition-colors ${feedback === 'positive' ? 'bg-green-500/20 text-green-400' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button
                      onClick={() => handleFeedback('negative')}
                      className={`p-2 rounded-full transition-colors ${feedback === 'negative' ? 'bg-red-500/20 text-red-400' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Personal Notes - IA Insights */}
              {result.personalNotes && result.personalNotes.length > 0 && (
                <div className="glass-card rounded-[32px] p-4 mb-8 border border-blue-500/20 bg-blue-500/5">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">🤖 Personalização Aplicada</p>
                  <div className="space-y-2">
                    {result.personalNotes.map((note: string, idx: number) => (
                      <p key={idx} className="text-sm text-slate-300">{note}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
                {result.splits?.map((split: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTabIndex(idx)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTabIndex === idx ? 'bg-blue-600 text-white shadow-glow' : 'glass-card text-slate-500'}`}
                  >
                    {split.name}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {(result.splits?.[activeTabIndex]?.exercises || []).length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <p>Nenhum exercício gerado para este treino.</p>
                  </div>
                ) : (
                  (result.splits?.[activeTabIndex]?.exercises || []).map((ex: any, idx: number) => {
                    const isEditing = editingExercise?.splitIdx === activeTabIndex && editingExercise?.exIdx === idx;

                    return (
                      <div key={idx} className={`glass-card rounded-3xl p-5 transition-all ${isEditing ? 'border border-blue-500/50 bg-blue-500/5' : 'hover:border-blue-500/30'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-black">{idx + 1}</div>
                          <div className="flex gap-2 items-center">
                            {ex.isVerified && (
                              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">database</span>
                                Validado
                              </span>
                            )}
                            <span className="text-[9px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded-full uppercase tracking-widest">{ex.targetMuscle}</span>
                            <button
                              onClick={() => handleRegenerateExercise(activeTabIndex, idx, ex)}
                              disabled={regeneratingId === `${activeTabIndex}-${idx}`}
                              className={`size-7 rounded-lg flex items-center justify-center transition-all bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10`}
                              title="Regenerar com IA"
                            >
                              <RefreshCw size={14} className={regeneratingId === `${activeTabIndex}-${idx}` ? "animate-spin text-blue-500" : ""} />
                            </button>
                            <button
                              onClick={() => setEditingExercise(isEditing ? null : { splitIdx: activeTabIndex, exIdx: idx })}
                              className={`size-7 rounded-lg flex items-center justify-center transition-all ${isEditing ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                            >
                              <span className="material-symbols-outlined text-sm">{isEditing ? 'check' : 'edit'}</span>
                            </button>
                          </div>
                        </div>

                        <h4 className="text-white font-black text-lg mb-3 tracking-tight">{ex.name}</h4>

                        {isEditing ? (
                          /* Edit Mode */
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Séries</label>
                                <input
                                  type="number"
                                  value={ex.sets}
                                  onChange={(e) => updateExercise(activeTabIndex, idx, 'sets', parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center outline-none focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Reps</label>
                                <input
                                  type="text"
                                  value={ex.reps}
                                  onChange={(e) => updateExercise(activeTabIndex, idx, 'reps', e.target.value)}
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center outline-none focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Descanso</label>
                                <input
                                  type="text"
                                  value={ex.rest}
                                  onChange={(e) => updateExercise(activeTabIndex, idx, 'rest', e.target.value)}
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-indigo-400 font-bold text-center outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeExercise(activeTabIndex, idx)}
                              className="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Remover Exercício
                            </button>
                          </div>
                        ) : (
                          /* View Mode */
                          <div className="flex gap-4">
                            <div className="bg-white/5 rounded-xl px-3 py-2">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Séries</p>
                              <p className="text-white font-black">{ex.sets}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl px-3 py-2">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reps</p>
                              <p className="text-white font-black">{ex.reps}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl px-3 py-2">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Descanso</p>
                              <p className="text-indigo-400 font-black">{ex.rest}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Add Exercise Button */}
                <button
                  onClick={openAddExerciseModal}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-blue-500/50 hover:text-blue-400 transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  Adicionar Exercício
                </button>

                {/* AI Refinement Input */}
                <div className="mt-8 mb-6 glass-card p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-blue-400 text-lg">auto_fix_high</span>
                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Refinar com Gemini AI</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={refinementInput}
                      onChange={(e) => setRefinementInput(e.target.value)}
                      placeholder="Ex: Troque agachamento por leg press..."
                      className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                    />
                    <button
                      onClick={handleRefine}
                      disabled={isRefining || !refinementInput}
                      className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-blue-900/20"
                    >
                      {isRefining ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">send</span>}
                    </button>
                  </div>
                </div>
              </div>
            </main>

            {/* Add Exercise Modal */}
            {showAddExercise && (
              <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col animate-fade-in">
                <header className="px-6 pt-14 pb-4">
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={() => { setShowAddExercise(false); setExerciseSearch(''); }}
                      className="size-10 rounded-full glass-card flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    <h3 className="text-lg font-black text-white">Adicionar Exercício</h3>
                    <div className="size-10"></div>
                  </div>

                  <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500">search</span>
                    <input
                      type="text"
                      placeholder="Buscar exercício ou músculo..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none"
                      autoFocus
                    />
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  <div className="space-y-3">
                    {loadingExerciseCatalog && (
                      <div className="space-y-3">
                        <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                        <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                        <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                      </div>
                    )}
                    {filteredExercisesForAdd.map((ex, idx) => (
                      <button
                        key={idx}
                        onClick={() => addExercise(ex)}
                        className="w-full glass-card rounded-2xl p-4 text-left hover:border-blue-500/30 transition-all active:scale-98 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-bold">{ex.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{ex.targetMuscle}</p>
                        </div>
                        <span className="material-symbols-outlined text-blue-500">add</span>
                      </button>
                    ))}
                    {!loadingExerciseCatalog && filteredExercisesForAdd.length === 0 && (
                      <p className="text-center text-slate-500 py-8">Nenhum exercício encontrado</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <footer className="fixed bottom-20 left-0 right-0 p-4 px-6 max-w-md mx-auto z-20">
              <button
                onClick={handleSaveWorkout}
                className="w-full h-14 text-white font-black rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)', boxShadow: '0 8px 32px rgba(30, 58, 138,0.35)' }}
              >
                <span className="material-symbols-outlined">check_circle</span>
                Salvar Protocolo
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIBuilderView;
