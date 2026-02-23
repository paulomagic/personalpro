// Volume Counter - Real-Time Volume Tracking
// Valida volume semanal DURANTE geração de slots, não depois
// Previne overtraining ajustando séries dinamicamente

import { getVolumeForMuscle, type TrainingLevel } from './knowledge/volume';

const isDev = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
    if (isDev) console.log(...args);
};

// ============ TIPOS ============

export interface MuscleVolumeState {
    current: number;  // Séries acumuladas na semana
    mev: number;      // Minimum Effective Volume
    mav: number;      // Maximum Adaptive Volume
    mrv: number;      // Maximum Recoverable Volume
}

export interface VolumeCounter {
    [muscleGroup: string]: MuscleVolumeState;
}

export interface VolumeCheckResult {
    success: boolean;
    reason?: string;
    adjustedSets?: number;
}

// ============ INICIALIZAÇÃO ============

/**
 * Inicializa contador de volume para todos os grupos musculares
 * Usa guidelines científicas ajustadas por nível
 */
export function initializeVolumeCounter(level: TrainingLevel): VolumeCounter {
    const counter: VolumeCounter = {};

    // Todos os grupos musculares rastreados
    const muscles = [
        'peito',
        'costas',
        'ombro',
        'quadriceps',
        'gluteos',
        'posterior_coxa',
        'biceps',
        'triceps',
        'panturrilha',
        'core',
        'trapezio',
        'antebraco'
    ];

    for (const muscle of muscles) {
        const guideline = getVolumeForMuscle(muscle, level);
        if (guideline) {
            counter[muscle] = {
                current: 0,
                mev: guideline.mev,
                mav: guideline.mav,
                mrv: guideline.mrv
            };
        }
    }

    debugLog(`[VolumeCounter] Initialized for level ${level}:`,
        Object.keys(counter).length, 'muscle groups tracked');

    return counter;
}

// ============ VALIDAÇÃO E AJUSTE ============

/**
 * Tenta adicionar séries ao contador
 * Retorna sucesso ou falha se ultrapassar MRV
 */
export function addSetsToCounter(
    counter: VolumeCounter,
    muscle: string,
    sets: number
): VolumeCheckResult {

    // Músculo não rastreado (ex: exercício genérico)
    if (!counter[muscle]) {
        debugLog(`[VolumeCounter] Muscle "${muscle}" not tracked, allowing ${sets} sets`);
        return { success: true };
    }

    const state = counter[muscle];
    const newTotal = state.current + sets;

    // Validação: Não ultrapassar MRV
    if (newTotal > state.mrv) {
        return {
            success: false,
            reason: `Volume semanal para ${muscle} ultrapassaria MRV (${state.mrv} sets). Atual: ${state.current}, Tentando adicionar: ${sets}`,
            adjustedSets: Math.max(0, state.mrv - state.current)
        };
    }

    // Sucesso: adicionar ao contador
    counter[muscle].current = newTotal;

    debugLog(`[VolumeCounter] ${muscle}: ${state.current}/${state.mrv} sets (added ${sets})`);

    return { success: true };
}

/**
 * Ajusta séries para caber no MRV disponível
 * Retorna número de séries que podem ser adicionadas sem ultrapassar
 */
export function adjustSetsToFitMRV(
    counter: VolumeCounter,
    muscle: string,
    requestedSets: number
): number {

    // Músculo não rastreado
    if (!counter[muscle]) {
        return requestedSets;
    }

    const state = counter[muscle];
    const available = state.mrv - state.current;
    const adjusted = Math.min(requestedSets, Math.max(0, available));

    if (adjusted < requestedSets) {
        console.warn(
            `[VolumeCounter] Ajustando ${muscle} de ${requestedSets} para ${adjusted} sets (MRV limit)`
        );
    }

    return adjusted;
}

/**
 * Verifica status do volume para um músculo
 * Retorna zona: 'below_mev' | 'optimal' | 'high' | 'at_mrv'
 */
export function getVolumeStatus(
    counter: VolumeCounter,
    muscle: string
): 'below_mev' | 'optimal' | 'high' | 'at_mrv' | 'unknown' {

    if (!counter[muscle]) return 'unknown';

    const state = counter[muscle];

    if (state.current < state.mev) return 'below_mev';
    if (state.current <= state.mav) return 'optimal';
    if (state.current < state.mrv) return 'high';
    return 'at_mrv';
}

/**
 * Retorna resumo do contador para logging/debug
 */
export function getCounterSummary(counter: VolumeCounter): string {
    const lines: string[] = ['=== VOLUME COUNTER SUMMARY ==='];

    for (const [muscle, state] of Object.entries(counter)) {
        const status = getVolumeStatus(counter, muscle);
        const percentage = ((state.current / state.mrv) * 100).toFixed(0);

        lines.push(
            `${muscle.padEnd(15)} ${state.current}/${state.mrv} sets (${percentage}%) [${status}]`
        );
    }

    return lines.join('\n');
}

/**
 * Valida se o volume total está dentro dos limites saudáveis
 * Retorna warnings se algum músculo estiver abaixo do MEV
 */
export function validateFinalVolume(counter: VolumeCounter): {
    valid: boolean;
    warnings: string[];
    summary: string;
} {
    const warnings: string[] = [];

    for (const [muscle, state] of Object.entries(counter)) {
        if (state.current < state.mev) {
            warnings.push(
                `⚠️ ${muscle}: Volume abaixo do MEV (${state.current}/${state.mev} sets)`
            );
        }

        if (state.current >= state.mrv) {
            warnings.push(
                `⚠️ ${muscle}: Volume no limite MRV (${state.current}/${state.mrv} sets) - risco de overtraining`
            );
        }
    }

    return {
        valid: warnings.length === 0,
        warnings,
        summary: getCounterSummary(counter)
    };
}

// ============ HELPERS ============

/**
 * Mapeia padrão de movimento para grupo muscular primário
 * Usado quando target_muscles não está especificado
 */
export function getDefaultMuscleForPattern(pattern: string): string {
    const mapping: Record<string, string> = {
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

    return mapping[pattern] || 'core';
}

// ============ EXPORTS ============

export {
    type TrainingLevel
} from './knowledge/volume';
