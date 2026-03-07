import { normalizeExerciseName } from './trainingEngineUtils';
import type { ResolvedDay, ResolvedSlot } from './trainingEngineTypes';

export function applyIntelligentVariation(
    days: ResolvedDay[],
    initialSessions: number = 3
): { days: ResolvedDay[]; replacements: number } {
    const usedByPattern = new Map<string, Set<string>>();
    const usedInInitialWindow = new Set<string>();
    let replacements = 0;

    const variedDays = days.map((day, dayIndex) => {
        const inInitialWindow = dayIndex < initialSessions;

        const variedSlots = day.slots.map(slot => {
            if (!slot.selected || !inInitialWindow) {
                if (slot.selected && inInitialWindow) {
                    const selectedName = normalizeExerciseName(slot.selected.name);
                    const patternSet = usedByPattern.get(slot.movement_pattern) || new Set<string>();
                    patternSet.add(selectedName);
                    usedByPattern.set(slot.movement_pattern, patternSet);
                    usedInInitialWindow.add(selectedName);
                }
                return slot;
            }

            const currentName = normalizeExerciseName(slot.selected.name);
            const patternSet = usedByPattern.get(slot.movement_pattern) || new Set<string>();
            const repeatedByPattern = patternSet.has(currentName);
            const repeatedInWindow = usedInInitialWindow.has(currentName);

            let selected = slot.selected;
            if (repeatedByPattern || repeatedInWindow) {
                const candidates = slot.candidates.map(c => c.exercise);
                const strictAlternative = candidates.find(candidate => {
                    const candidateName = normalizeExerciseName(candidate.name);
                    if (candidateName === currentName) return false;
                    if (patternSet.has(candidateName)) return false;
                    return !usedInInitialWindow.has(candidateName);
                });

                const fallbackAlternative = candidates.find(candidate =>
                    normalizeExerciseName(candidate.name) !== currentName
                );

                if (strictAlternative || fallbackAlternative) {
                    selected = strictAlternative || fallbackAlternative!;
                    replacements++;
                }
            }

            const finalName = normalizeExerciseName(selected.name);
            patternSet.add(finalName);
            usedByPattern.set(slot.movement_pattern, patternSet);
            usedInInitialWindow.add(finalName);

            return {
                ...slot,
                selected
            };
        });

        return {
            ...day,
            slots: variedSlots
        };
    });

    return { days: variedDays, replacements };
}

export function enforceCrossDayUniqueness(
    days: ResolvedDay[]
): { days: ResolvedDay[]; replacements: number } {
    const usedNames = new Set<string>();
    let replacements = 0;

    const updatedDays = days.map(day => {
        const updatedSlots = day.slots.map(slot => {
            if (!slot.selected) return slot;

            const currentName = normalizeExerciseName(slot.selected.name);
            const shouldEnforce = shouldEnforceUniqueName(slot);
            const alreadyUsed = usedNames.has(currentName);

            if (!shouldEnforce || !alreadyUsed) {
                if (shouldEnforce) usedNames.add(currentName);
                return slot;
            }

            const alternative = slot.candidates
                .map(c => c.exercise)
                .find(candidate => {
                    const candidateName = normalizeExerciseName(candidate.name);
                    return candidateName !== currentName && !usedNames.has(candidateName);
                });

            if (alternative) {
                const altName = normalizeExerciseName(alternative.name);
                usedNames.add(altName);
                replacements++;
                return {
                    ...slot,
                    selected: alternative
                };
            }

            usedNames.add(currentName);
            return slot;
        });

        return {
            ...day,
            slots: updatedSlots
        };
    });

    return { days: updatedDays, replacements };
}

function shouldEnforceUniqueName(slot: ResolvedSlot): boolean {
    return slot.movement_pattern !== 'core' && slot.movement_pattern !== 'isolar_panturrilha';
}
