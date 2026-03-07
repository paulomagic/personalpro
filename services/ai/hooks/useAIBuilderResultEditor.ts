import { useMemo, useState } from 'react';
import type { AIBuilderExercise } from '../aiBuilderWorkoutUtils';

interface UseAIBuilderResultEditorParams {
    result: any;
    setResult: (value: any) => void;
    ensureExerciseCatalog: () => Promise<AIBuilderExercise[]>;
    activeTabIndex: number;
}

export function useAIBuilderResultEditor({
    result,
    setResult,
    ensureExerciseCatalog,
    activeTabIndex
}: UseAIBuilderResultEditorParams) {
    const [editingExercise, setEditingExercise] = useState<{ splitIdx: number; exIdx: number } | null>(null);
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [exerciseCatalog, setExerciseCatalog] = useState<AIBuilderExercise[]>([]);
    const [loadingExerciseCatalog, setLoadingExerciseCatalog] = useState(false);

    const ensureCatalog = async (): Promise<AIBuilderExercise[]> => {
        if (exerciseCatalog.length > 0) return exerciseCatalog;

        setLoadingExerciseCatalog(true);
        try {
            const catalog = await ensureExerciseCatalog();
            setExerciseCatalog(catalog);
            return catalog;
        } finally {
            setLoadingExerciseCatalog(false);
        }
    };

    const updateExercise = (splitIdx: number, exIdx: number, field: string, value: string | number) => {
        if (!result) return;
        const nextResult = { ...result };
        nextResult.splits[splitIdx].exercises[exIdx][field] = value;
        setResult(nextResult);
    };

    const removeExercise = (splitIdx: number, exIdx: number) => {
        if (!result) return;
        const nextResult = { ...result };
        nextResult.splits[splitIdx].exercises.splice(exIdx, 1);
        setResult(nextResult);
        setEditingExercise(null);
    };

    const addExercise = (exercise: AIBuilderExercise) => {
        if (!result) return;
        const nextResult = { ...result };
        nextResult.splits[activeTabIndex].exercises.push({
            name: exercise.name,
            sets: 4,
            reps: exercise.sets?.[0]?.reps || '12',
            rest: '60s',
            targetMuscle: exercise.targetMuscle || 'Geral'
        });
        setResult(nextResult);
        setShowAddExercise(false);
        setExerciseSearch('');
    };

    const openAddExerciseModal = async () => {
        await ensureCatalog();
        setShowAddExercise(true);
    };

    const filteredExercisesForAdd = useMemo(() => {
        const normalizedSearch = exerciseSearch.toLowerCase();
        return exerciseCatalog.filter((exercise) =>
            exercise.name.toLowerCase().includes(normalizedSearch) ||
            (exercise.targetMuscle || '').toLowerCase().includes(normalizedSearch)
        ).slice(0, 20);
    }, [exerciseCatalog, exerciseSearch]);

    return {
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
    };
}
