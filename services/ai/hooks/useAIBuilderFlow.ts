import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Client } from '../../../types';
import { flushAIGenerationFeedbackQueue } from '../feedback/aiGenerationFeedbackService';
import { getAdaptiveTrainingSignal, type AdaptiveTrainingSignal } from '../adaptiveSignalsService';
import { assessInjuryRisk, type InjuryRiskAssessment } from '../injuryRiskService';
import { resolvePrecisionProfile } from '../progressionPrecisionService';
import { isDemoSessionUser } from '../../auth/authFlow';

const loadDemoData = () => import('../../../mocks/demoData');
const loadClientsDomain = () => import('../../supabase/domains/clientsDomain');

const LOADING_MESSAGES = [
    'Analisando perfil biotipológico...',
    'Otimizando volume de treinamento...',
    'Selecionando exercícios de alta sinergia...',
    'Ajustando densidade e descanso...',
    'Finalizando protocolo de elite...'
];

interface UseAIBuilderFlowParams {
    user: any;
}

export function useAIBuilderFlow({ user }: UseAIBuilderFlowParams) {
    const isDemo = isDemoSessionUser(user);
    const [loading, setLoading] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedGoal, setSelectedGoal] = useState('Hipertrofia');
    const [selectedDays, setSelectedDays] = useState(4);
    const [observations, setObservations] = useState('');
    const [adaptiveSignal, setAdaptiveSignal] = useState<AdaptiveTrainingSignal | null>(null);
    const [loadingAdaptiveSignal, setLoadingAdaptiveSignal] = useState(false);
    const [injuryRisk, setInjuryRisk] = useState<InjuryRiskAssessment | null>(null);
    const [errorToast, setErrorToast] = useState<string | null>(null);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

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

    const loadFallbackClients = async (): Promise<Client[]> => {
        const { mockClients } = await loadDemoData();
        return mockClients as Client[];
    };

    const { data: clients = [], isLoading: fetchingClients } = useQuery<Client[]>({
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

    useEffect(() => {
        if (!errorToast) return;
        const timer = setTimeout(() => setErrorToast(null), 5000);
        return () => clearTimeout(timer);
    }, [errorToast]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (loading) {
            interval = setInterval(() => {
                setLoadingMessageIndex((prev) => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
            }, 800);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loading]);

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

    return {
        isDemo,
        clients,
        fetchingClients,
        loading,
        setLoading,
        loadingMessageIndex,
        setLoadingMessageIndex,
        loadingMessages: LOADING_MESSAGES,
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
    };
}
