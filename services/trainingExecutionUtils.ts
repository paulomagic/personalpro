import type { Exercise, Workout, WorkoutExercise, WorkoutSplit } from '../types';

type ExecutionExercise = WorkoutExercise | Exercise;

export function getWorkoutSplits(workout: Workout): WorkoutSplit[] {
    return Array.isArray(workout.splits) ? workout.splits : [];
}

export function resolveInitialSplitIndex(workoutSplits: WorkoutSplit[]): number | null {
    if (workoutSplits.length === 1) return 0;
    if (workoutSplits.length > 1) return null;
    return 0;
}

export function hasPendingSplitSelection(workoutSplits: WorkoutSplit[], selectedSplitIndex: number | null): boolean {
    return workoutSplits.length > 1 && selectedSplitIndex === null;
}

export function resolveActiveSplit(
    workoutSplits: WorkoutSplit[],
    selectedSplitIndex: number | null
): WorkoutSplit | null {
    if (selectedSplitIndex === null) return null;
    if (selectedSplitIndex < 0 || selectedSplitIndex >= workoutSplits.length) return null;
    return workoutSplits[selectedSplitIndex];
}

export function resolveExecutionExercises(
    workout: Workout,
    activeSplit: WorkoutSplit | null
): ExecutionExercise[] {
    if (Array.isArray(activeSplit?.exercises) && activeSplit.exercises.length > 0) {
        return activeSplit.exercises;
    }
    return Array.isArray(workout.exercises) ? workout.exercises : [];
}

