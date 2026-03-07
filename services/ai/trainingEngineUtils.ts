import type { Injury } from '../exerciseService';
import type { IntensityLevel } from './workoutTemplates';
import type { MovementPattern } from './types';

const LEVEL_MULTIPLIERS: Record<string, { volume: number; intensity: number }> = {
    'iniciante': { volume: 0.6, intensity: 0.8 },
    'idoso': { volume: 0.5, intensity: 0.7 },
    'intermediario': { volume: 1.0, intensity: 1.0 },
    'intermediário': { volume: 1.0, intensity: 1.0 },
    'avancado': { volume: 1.2, intensity: 1.1 },
    'avançado': { volume: 1.2, intensity: 1.1 },
    'atleta': { volume: 1.4, intensity: 1.2 }
};

const GOAL_REP_RANGES: Record<string, { min: number; max: number; rest: string }> = {
    'forca': { min: 4, max: 6, rest: '180s' },
    'força': { min: 4, max: 6, rest: '180s' },
    'força máxima': { min: 4, max: 6, rest: '180s' },
    'hipertrofia': { min: 8, max: 12, rest: '90s' },
    'hipertrofia glúteo': { min: 8, max: 12, rest: '90s' },
    'hipertrofia gluteo': { min: 8, max: 12, rest: '90s' },
    'emagrecimento': { min: 12, max: 20, rest: '45s' },
    'perda de peso': { min: 12, max: 20, rest: '45s' },
    'saude': { min: 10, max: 15, rest: '90s' },
    'saúde': { min: 10, max: 15, rest: '90s' },
    'qualidade de vida': { min: 10, max: 15, rest: '90s' },
    'bem-estar': { min: 10, max: 15, rest: '90s' },
    'condicionamento': { min: 12, max: 15, rest: '60s' },
    'resistencia': { min: 15, max: 25, rest: '45s' },
    'resistência': { min: 15, max: 25, rest: '45s' },
};

const BASE_INTENSITY_CONFIG: Record<IntensityLevel, { sets: number; reps: string; rest: string }> = {
    'very_high': { sets: 4, reps: '4-6', rest: '180s' },
    'high': { sets: 4, reps: '6-8', rest: '120s' },
    'moderate': { sets: 3, reps: '8-12', rest: '90s' },
    'low': { sets: 3, reps: '12-15', rest: '60s' },
    'very_low': { sets: 2, reps: '15-20', rest: '45s' }
};

export const CANDIDATES_PER_SLOT = 8;

export function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function isAdvancedLevel(level: string): boolean {
    const normalized = normalizeText(level);
    return normalized.includes('avanc') || normalized.includes('atleta');
}

export function inferDayFocus(label?: string): 'forca' | 'volume' | 'neutral' {
    const text = normalizeText(label || '');
    if (text.includes('forca')) return 'forca';
    if (text.includes('volume') || text.includes('hipertrofia')) return 'volume';
    return 'neutral';
}

export function extractContextExceptions(goal: string, observations?: string): string[] {
    const text = normalizeText(`${goal || ''} ${observations || ''}`);
    const exceptions: string[] = [];

    if (
        text.includes('permitir peso corporal') ||
        text.includes('permitir calistenia') ||
        text.includes('calistenia') ||
        text.includes('funcional')
    ) {
        exceptions.push('flexao', 'push up', 'burpee', 'mountain climber', 'polichinelo');
    }

    return exceptions;
}

export function getPersonalizedConfig(
    intensity: IntensityLevel,
    level: string,
    goal: string,
    conditionVolumeModifier: number = 1.0
): { sets: number; reps: string; rest: string } {
    const baseConfig = BASE_INTENSITY_CONFIG[intensity];
    const levelMultiplier = LEVEL_MULTIPLIERS[level.toLowerCase()] || LEVEL_MULTIPLIERS['intermediario'];
    const goalRange = GOAL_REP_RANGES[goal.toLowerCase()] || GOAL_REP_RANGES['hipertrofia'];
    const combinedVolumeMultiplier = levelMultiplier.volume * conditionVolumeModifier;
    const adjustedSets = Math.max(2, Math.round(baseConfig.sets * combinedVolumeMultiplier));

    return {
        sets: adjustedSets,
        reps: `${goalRange.min}-${goalRange.max}`,
        rest: goalRange.rest
    };
}

export function getDefaultMuscle(pattern: MovementPattern): string {
    const defaults: Record<MovementPattern, string> = {
        'empurrar_horizontal': 'peito',
        'empurrar_vertical': 'ombro',
        'puxar_horizontal': 'costas',
        'puxar_vertical': 'costas',
        'agachar': 'quadriceps',
        'hinge': 'gluteos',
        'core': 'core',
        'isolar_biceps': 'biceps',
        'isolar_triceps': 'triceps',
        'isolar_ombro': 'ombro',
        'isolar_panturrilha': 'panturrilha',
        'isolar_antebraco': 'antebraco'
    };
    return defaults[pattern] || 'core';
}

export function normalizeExerciseName(name: string): string {
    return normalizeText(name);
}

export function normalizeLevel(level: string): 'iniciante' | 'intermediario' | 'avancado' | 'atleta' {
    const normalized = level.toLowerCase();
    if (normalized.includes('inic')) return 'iniciante';
    if (normalized.includes('inter')) return 'intermediario';
    if (normalized.includes('avanc')) return 'avancado';
    if (normalized.includes('atlet')) return 'atleta';
    return 'intermediario';
}

export function parseInjuries(injuriesText?: string): Injury[] {
    if (!injuriesText || injuriesText.toLowerCase() === 'nenhuma') return [];

    const injuries: Injury[] = [];
    const text = injuriesText.toLowerCase();

    if (text.includes('ombro')) injuries.push('ombro');
    if (text.includes('joelho')) injuries.push('joelho');
    if (text.includes('coluna') || text.includes('costas') || text.includes('lombar')) {
        injuries.push('coluna');
    }
    if (text.includes('cotovelo')) injuries.push('cotovelo');
    if (text.includes('punho') || text.includes('pulso')) injuries.push('punho');

    return injuries;
}
