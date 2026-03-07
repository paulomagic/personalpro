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
import { useAIBuilderResultEditor } from '../services/ai/hooks/useAIBuilderResultEditor';
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
import AIBuilderLoadingScreen from '../components/aiBuilder/AIBuilderLoadingScreen';

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

  const ensureExerciseCatalog = async (): Promise<MockExercise[]> => {
    const { mockExercises } = await loadDemoData();
    return mockExercises as MockExercise[];
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

  const {
    editingExercise,
    setEditingExercise,
    showAddExercise,
    setShowAddExercise,
    exerciseSearch,
    setExerciseSearch,
    loadingExerciseCatalog,
    filteredExercisesForAdd,
    updateExercise,
    removeExercise,
    addExercise,
    openAddExerciseModal
  } = useAIBuilderResultEditor({
    result,
    setResult,
    ensureExerciseCatalog,
    activeTabIndex
  });

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
    return <AIBuilderLoadingScreen messages={messages} loadingMessageIndex={loadingMessageIndex} />;
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
