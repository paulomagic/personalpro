import type { Exercise, Injury } from '../exerciseService';
import { evaluateExerciseTier } from './knowledge/exerciseTiering';
import {
    CANDIDATES_PER_SLOT,
    getDefaultMuscle,
    inferDayFocus
} from './trainingEngineUtils';
import type { SlotCandidate } from './trainingEngineTypes';
import type { TrainingSlot } from './workoutTemplates';

export function rankSlotCandidates(params: {
    exercises: Exercise[];
    slot: TrainingSlot;
    injuries: Injury[];
    level: string;
    goal: string;
    dayLabel?: string;
}): SlotCandidate[] {
    const { exercises, slot, injuries, level, goal, dayLabel } = params;

    return exercises
        .map(exercise => ({
            exercise,
            score: calculateSlotScore(exercise, slot, injuries, level, goal, dayLabel)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, CANDIDATES_PER_SLOT);
}

export function calculateSlotScore(
    ex: Exercise,
    slot: TrainingSlot,
    injuries: Injury[],
    level: string,
    goal: string,
    dayLabel?: string
): number {
    let score = 50;

    const isBeginnerOrElderly = level.toLowerCase() === 'iniciante' || level.toLowerCase() === 'idoso';
    const isAdvanced = level.toLowerCase().includes('avançado') || level.toLowerCase() === 'atleta';

    if (ex.is_compound && (slot.intensity === 'very_high' || slot.intensity === 'high')) {
        score += isAdvanced ? 25 : 15;
    }

    if (ex.is_machine) {
        if (isBeginnerOrElderly) score += 30;
        if (injuries.length > 0) score += 20;
        if (slot.intensity === 'low' || slot.intensity === 'very_low') score += 10;
    }

    const equipment = ex.equipment || [];
    const isBodyweightOnly = equipment.length === 1 && equipment[0] === 'peso_corporal';
    if (slot.movement_pattern !== 'core' && isBodyweightOnly) {
        score -= 35;
    } else if (equipment.some(eq => eq === 'maquina' || eq === 'cabo' || eq === 'halter' || eq === 'barra')) {
        score += 12;
    }

    if (!ex.is_machine && isBeginnerOrElderly) {
        score -= 20;
    }

    if (injuries.length > 0) {
        for (const injury of injuries) {
            if (ex.avoid_for_injuries?.includes(injury)) {
                score -= 1000;
            }
            if (ex.caution_for_injuries?.includes(injury)) {
                score -= 30;
            }
        }
    }

    if (ex.spinal_load === 'alto' && isBeginnerOrElderly) {
        score -= 25;
    }

    if (ex.stability_demand === 'alto' && isBeginnerOrElderly) {
        score -= 20;
    }
    if (ex.stability_demand === 'baixo' && isBeginnerOrElderly) {
        score += 15;
    }

    const dayFocus = inferDayFocus(dayLabel);
    if (dayFocus === 'forca') {
        if (ex.is_compound) score += 14;
        if (equipment.includes('barra')) score += 10;
        if (ex.is_machine && !ex.is_compound) score -= 6;
    } else if (dayFocus === 'volume') {
        if (ex.is_machine) score += 12;
        if (equipment.includes('cabo')) score += 10;
        if (!ex.is_compound && ex.stability_demand !== 'alto') score += 6;
        if (ex.is_compound && equipment.includes('barra')) score -= 6;
    }

    const tierEval = evaluateExerciseTier(ex.name, slot.movement_pattern, goal);
    score += tierEval.score;

    return score;
}

export function getSlotPrimaryMuscle(slot: TrainingSlot): string {
    return slot.target_muscles?.[0] || getDefaultMuscle(slot.movement_pattern);
}
