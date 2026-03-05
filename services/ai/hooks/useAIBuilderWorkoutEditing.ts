import { useState } from 'react';
import type { Client } from '../../../types';

const loadAIRouter = () => import('../aiRouter');

interface UseAIBuilderWorkoutEditingParams {
    selectedClient: Client | null;
    result: any;
    setResult: (workout: any) => void;
    ensureExerciseCatalog: () => Promise<any[]>;
    mapToLocalExercises: (workout: any, localExercises: any[]) => any;
    setErrorToast: (message: string | null) => void;
}

interface UseAIBuilderWorkoutEditingResult {
    regeneratingId: string | null;
    refinementInput: string;
    isRefining: boolean;
    setRefinementInput: (value: string) => void;
    handleRegenerateExercise: (splitIdx: number, exIdx: number, currentExercise: any) => Promise<void>;
    handleRefine: () => Promise<void>;
}

export function useAIBuilderWorkoutEditing({
    selectedClient,
    result,
    setResult,
    ensureExerciseCatalog,
    mapToLocalExercises,
    setErrorToast
}: UseAIBuilderWorkoutEditingParams): UseAIBuilderWorkoutEditingResult {
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [refinementInput, setRefinementInput] = useState('');
    const [isRefining, setIsRefining] = useState(false);

    const handleRegenerateExercise = async (splitIdx: number, exIdx: number, currentExercise: any) => {
        if (!selectedClient || !result) return;
        const id = `${splitIdx}-${exIdx}`;
        setRegeneratingId(id);

        try {
            const { regenerateExerciseWithRouter } = await loadAIRouter();
            const newExercise = await regenerateExerciseWithRouter({
                currentExercise: currentExercise.name,
                targetMuscle: currentExercise.targetMuscle,
                goal: selectedClient.goal,
                injuries: selectedClient.injuries,
                equipment: 'Academia completa'
            });

            if (newExercise) {
                const newResult = { ...result };
                newResult.splits[splitIdx].exercises[exIdx] = {
                    ...newExercise,
                    regenerated: true
                };
                setResult(newResult);
            }
        } catch (error) {
            console.error('Error regenerating exercise:', error);
        } finally {
            setRegeneratingId(null);
        }
    };

    const handleRefine = async () => {
        if (!refinementInput || !result) return;
        setIsRefining(true);
        setErrorToast(null);

        try {
            const { refineWorkoutWithRouter } = await loadAIRouter();
            const refinedResult = await refineWorkoutWithRouter(result, refinementInput);

            if (refinedResult) {
                const localExercises = await ensureExerciseCatalog();
                const mappedResult = mapToLocalExercises(refinedResult, localExercises);

                const currentNotes = result.personalNotes || [];
                mappedResult.personalNotes = [...currentNotes, `✨ Ajuste: "${refinementInput}"`];

                setResult(mappedResult);
                setRefinementInput('');
            } else {
                setErrorToast('🤖 Não foi possível refinar. Tente novamente.');
            }
        } catch (error: any) {
            setErrorToast('🤖 Erro ao refinar treino. Tente novamente.');
            console.error('Error refining workout:', error?.message || error);
        } finally {
            setIsRefining(false);
        }
    };

    return {
        regeneratingId,
        refinementInput,
        isRefining,
        setRefinementInput,
        handleRegenerateExercise,
        handleRefine
    };
}
