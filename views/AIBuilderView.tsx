import React, { useEffect, useMemo, useState } from 'react';
import { Client } from '../types';
import { useQuery } from '@tanstack/react-query';
import { flushAIGenerationFeedbackQueue } from '../services/ai/feedback/aiGenerationFeedbackService';
import { getAdaptiveTrainingSignal, type AdaptiveTrainingSignal } from '../services/ai/adaptiveSignalsService';
import { assessInjuryRisk, type InjuryRiskAssessment } from '../services/ai/injuryRiskService';
import { isDemoSessionUser } from '../services/auth/authFlow';
import {
  resolvePrecisionProfile
} from '../services/ai/progressionPrecisionService';
import { useAIBuilderWorkoutEditing } from '../services/ai/hooks/useAIBuilderWorkoutEditing';
import { type AIBuilderExercise } from '../services/ai/aiBuilderWorkoutUtils';
import {
  exportAIBuilderWorkoutToPdf,
  generateAIBuilderWorkout,
  mapToLocalExercises,
  saveAIBuilderWorkoutSelection,
  shareAIBuilderWorkoutOnWhatsApp,
  submitAIBuilderFeedback
} from '../services/ai/aiBuilderWorkflow';
import PageHeader from '../components/PageHeader';
import AIBuilderWizardHeader from '../components/aiBuilder/AIBuilderWizardHeader';
import AIBuilderWizardStepProfile from '../components/aiBuilder/AIBuilderWizardStepProfile';
import AIBuilderWizardStepRisk from '../components/aiBuilder/AIBuilderWizardStepRisk';
import AIBuilderWizardStepGenerate from '../components/aiBuilder/AIBuilderWizardStepGenerate';
import AIBuilderErrorToast from '../components/aiBuilder/AIBuilderErrorToast';
import AIBuilderResultModal from '../components/aiBuilder/AIBuilderResultModal';

interface AIBuilderViewProps {
  user: any;
  onBack: () => void;
  onDone: () => void;
}

type MockExercise = AIBuilderExercise;

const loadDemoData = () => import('../mocks/demoData');
const loadClientsDomain = () => import('../services/supabase/domains/clientsDomain');
const loadWorkoutsDomain = () => import('../services/supabase/domains/workoutsDomain');


const AIBuilderView: React.FC<AIBuilderViewProps> = ({ user, onBack, onDone }) => {
  const isDemo = isDemoSessionUser(user);
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
        if (!isDemo && user?.id) {
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
    await submitAIBuilderFeedback({
      isDemo,
      type,
      selectedClient,
      result,
      workoutOptions,
      selectedOptionIndex
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
    if (isDemo) return;
    void flushAIGenerationFeedbackQueue();
    const onOnline = () => {
      void flushAIGenerationFeedbackQueue();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [isDemo]);

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
    await generateAIBuilderWorkout({
      client: selectedClient,
      goal: selectedGoal || selectedClient.goal,
      selectedDays,
      observations,
      adaptiveSignal,
      precisionProfile,
      ensureExerciseCatalog,
      mapExercises: mapToLocalExercises,
      setLoading,
      setLoadingMessageIndex,
      setWorkoutOptions,
      setSelectedOptionIndex,
      setResult,
      setActiveTabIndex,
      setErrorToast
    });
  };

  // Select workout option
  const selectWorkoutOption = (index: number) => {
    setSelectedOptionIndex(index);
    setResult(workoutOptions[index]);
    setActiveTabIndex(0);
  };

  const handleSaveWorkout = async () => {
    await saveAIBuilderWorkoutSelection({
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
    });
  };

  const handleExportPDF = () => {
    exportAIBuilderWorkoutToPdf(result, selectedClient);
  };

  const handleSendWhatsApp = () => {
    shareAIBuilderWorkoutOnWhatsApp(result, selectedClient, activeTabIndex);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-void)]">
        <div className="w-full max-w-md h-full flex flex-col items-center justify-center p-8 overflow-hidden relative bg-[var(--bg-void)]">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-1/4 left-1/4 size-64 rounded-full blur-[100px] animate-pulse bg-[#1E3A8A]"></div>
            <div className="absolute bottom-1/4 right-1/4 size-64 rounded-full blur-[100px] animate-pulse delay-1000 bg-[#3B82F6]"></div>
          </div>

          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="size-24 rounded-[32px] flex items-center justify-center mb-10 animate-bounce bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] shadow-[0_0_60px_rgba(30,58,138,0.5)]">
              <span className="material-symbols-outlined text-white text-[48px]">psychology</span>
            </div>

            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">PersonalPro IA</h2>
            <div className="h-6 overflow-hidden">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3B82F6]">
                {messages[loadingMessageIndex]}
              </p>
            </div>

            <div className="mt-12 w-64 h-1.5 rounded-full overflow-hidden bg-[rgba(59,130,246,0.1)]">
              <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-full w-full rounded-full">
                <defs>
                  <linearGradient id="ai-builder-loading-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1E3A8A" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width={(loadingMessageIndex + 1) * 20} height="6" rx="3" fill="url(#ai-builder-loading-gradient)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen text-white selection:bg-blue-500/30 bg-[var(--bg-void)]">
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
