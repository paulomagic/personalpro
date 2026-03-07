import type { Exercise } from '../exerciseService';
import type { MovementPattern } from './types';
import type { IntensityLevel } from './workoutTemplates';

export interface SlotCandidate {
    exercise: Exercise;
    score: number;
}

export interface ResolvedSlot {
    slot_id: string;
    movement_pattern: MovementPattern;
    intensity: IntensityLevel;
    candidates: SlotCandidate[];
    selected?: Exercise;
    sets: number;
    reps: string;
    rest: string;
}

export interface ResolvedDay {
    day_id: string;
    label: string;
    slots: ResolvedSlot[];
}

export interface GeneratedWorkout {
    template_id: string;
    template_name: string;
    client_name: string;
    days: ResolvedDay[];
    metadata: {
        goal: string;
        level: string;
        injuries: string[];
        generated_at: string;
        pattern_warnings?: string[];
        pattern_valid?: boolean;
        muscle_coverage?: {
            valid: boolean;
            missing: string[];
        };
        duplicates_removed?: number;
        [key: string]: any;
    };
}
