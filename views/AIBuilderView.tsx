import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useAIBuilderWorkoutEditing } from '../services/ai/hooks/useAIBuilderWorkoutEditing';
import { useAIBuilderFlow } from '../services/ai/hooks/useAIBuilderFlow';
import { useAIBuilderResultEditor } from '../services/ai/hooks/useAIBuilderResultEditor';
import { mapCatalogExerciseToAIBuilder, mapToLocalExercises, type AIBuilderExercise } from '../services/ai/aiBuilderWorkoutUtils';
import PageHeader from '../components/PageHeader';
import AIBuilderWizardHeader from '../components/aiBuilder/AIBuilderWizardHeader';
import AIBuilderWizardStepProfile from '../components/aiBuilder/AIBuilderWizardStepProfile';
import AIBuilderWizardStepRisk from '../components/aiBuilder/AIBuilderWizardStepRisk';
import AIBuilderWizardStepGenerate from '../components/aiBuilder/AIBuilderWizardStepGenerate';
import AIBuilderErrorToast from '../components/aiBuilder/AIBuilderErrorToast';
import AIBuilderLoadingScreen from '../components/aiBuilder/AIBuilderLoadingScreen';
import { fetchAllExercises } from '../services/exerciseService';

interface AIBuilderViewProps {
  user: any;
  onBack: () => void;
  onDone: () => void;
}

type MockExercise = AIBuilderExercise;

const loadDemoData = () => import('../mocks/demoData');
const loadWorkoutsDomain = () => import('../services/supabase/domains/workoutsDomain');
const loadAIBuilderWorkflow = () => import('../services/ai/aiBuilderWorkflow');
const AIBuilderResultModal = lazy(() => import('../components/aiBuilder/AIBuilderResultModal'));


const AIBuilderView: React.FC<AIBuilderViewProps> = ({ user, onBack, onDone }) => {
  const [result, setResult] = useState<any>(null);
  const [workoutOptions, setWorkoutOptions] = useState<any[]>([]); // Multiple AI options
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [exerciseCatalogStatus, setExerciseCatalogStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');

  const ensureExerciseCatalog = async (): Promise<MockExercise[]> => {
    if (isDemo) {
      const { mockExercises } = await loadDemoData();
      return mockExercises as MockExercise[];
    }

    const catalog = await fetchAllExercises();
    if (catalog.length > 0) {
      return catalog.map(mapCatalogExerciseToAIBuilder);
    }

    return [];
  };

  const {
    isDemo,
    clients,
    fetchingClients,
    loading,
    setLoading,
    loadingMessageIndex,
    setLoadingMessageIndex,
    loadingMessages,
    selectedClient,
    setSelectedClient,
    selectedGoal,
    setSelectedGoal,
    selectedDays,
    setSelectedDays,
    observations,
    setObservations,
    adaptiveSignal,
    loadingAdaptiveSignal,
    injuryRisk,
    precisionProfile,
    errorToast,
    setErrorToast,
    wizardStep,
    setWizardStep,
    canAdvanceFromProfileStep,
    canAdvanceFromRiskStep,
    goToWizardStep,
    handleContinueFromProfile,
    handleContinueFromRisk
  } = useAIBuilderFlow({ user });

  useEffect(() => {
    let cancelled = false;

    const preloadExerciseCatalog = async () => {
      setExerciseCatalogStatus('loading');
      try {
        const catalog = await ensureExerciseCatalog();
        if (cancelled) return;
        setExerciseCatalogStatus(catalog.length > 0 ? 'ready' : 'empty');
      } catch {
        if (!cancelled) {
          setExerciseCatalogStatus('error');
        }
      }
    };

    void preloadExerciseCatalog();
    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  const generateDisabledReason = useMemo(() => {
    if (!selectedClient) {
      return fetchingClients
        ? 'Aguarde o carregamento dos alunos para gerar.'
        : 'Cadastre ou selecione um aluno para gerar um treino.';
    }

    if (exerciseCatalogStatus === 'loading' || exerciseCatalogStatus === 'idle') {
      return 'O catálogo de exercícios ainda está carregando.';
    }

    if (exerciseCatalogStatus === 'empty') {
      return isDemo
        ? 'O catálogo demo não encontrou exercícios suficientes para montar o treino.'
        : 'O catálogo real de exercícios está vazio. Cadastre exercícios antes de gerar.';
    }

    if (exerciseCatalogStatus === 'error') {
      return 'Não foi possível carregar o catálogo de exercícios agora.';
    }

    if (injuryRisk?.blockGeneration) {
      return `Geração bloqueada por risco crítico (${injuryRisk.score}/100).`;
    }

    return null;
  }, [exerciseCatalogStatus, fetchingClients, injuryRisk, isDemo, selectedClient]);

  const handleFeedback = async (type: 'positive' | 'negative') => {
    setFeedback(type);
    const { submitAIBuilderFeedback } = await loadAIBuilderWorkflow();
    await submitAIBuilderFeedback({
      isDemo,
      type,
      selectedClient,
      result,
      workoutOptions,
      selectedOptionIndex
    });
  };
  const quickTags = [
    '+ Lesão no ombro',
    '+ Sem equipamentos',
    '+ Treino curto (30min)',
    '+ Foco em core'
  ];

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
    const { generateAIBuilderWorkout } = await loadAIBuilderWorkflow();
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
    const { saveAIBuilderWorkoutSelection } = await loadAIBuilderWorkflow();
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
    void loadAIBuilderWorkflow().then(({ exportAIBuilderWorkoutToPdf }) => {
      exportAIBuilderWorkoutToPdf(result, selectedClient);
    });
  };

  const handleSendWhatsApp = () => {
    void loadAIBuilderWorkflow().then(({ shareAIBuilderWorkoutOnWhatsApp }) => {
      shareAIBuilderWorkoutOnWhatsApp(result, selectedClient, activeTabIndex);
    });
  };

  if (loading) {
    return <AIBuilderLoadingScreen messages={loadingMessages} loadingMessageIndex={loadingMessageIndex} />;
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
            emptyClientsMessage={isDemo ? 'Nenhum aluno demo disponível.' : 'Nenhum aluno encontrado. Cadastre um aluno antes de usar o AI Builder.'}
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
            exerciseCatalogStatus={exerciseCatalogStatus}
            generateDisabledReason={generateDisabledReason}
            onBack={() => setWizardStep(2)}
            onGenerate={handleGenerate}
          />
        )}
      </div>


      {/* Result Modal */}
      {result && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-[var(--bg-void)]" />}>
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
        </Suspense>
      )}
    </div>
  );
};

export default AIBuilderView;
