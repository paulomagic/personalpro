// Training Engine - Orquestrador determinístico de treino
// A IA NÃO cria treinos. Ela ESCOLHE entre opções pré-validadas.

import { selectTemplate, type WorkoutTemplate, type TrainingSlot, type IntensityLevel } from './workoutTemplates';
import { resolveExercise, type Exercise, type Injury } from '../exerciseService';
import { aiRouter } from './aiRouter';
import type { MovementPattern } from './types';

// ============ TIPOS ============

export interface SlotCandidate {
    exercise: Exercise;
    score: number;  // Ranking determinístico
}

export interface ResolvedSlot {
    slot_id: string;
    movement_pattern: MovementPattern;
    intensity: IntensityLevel;
    candidates: SlotCandidate[];  // Top N candidatos
    selected?: Exercise;          // Escolhido pela IA ou regra
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
    };
}

// ============ CONFIGURAÇÃO ============

// Multipliers por nível (baseado em knowledge/volume.ts)
const LEVEL_MULTIPLIERS: Record<string, { volume: number; intensity: number }> = {
    'iniciante': { volume: 0.6, intensity: 0.8 },      // -40% volume, -20% intensidade
    'intermediario': { volume: 1.0, intensity: 1.0 },  // Baseline
    'intermediário': { volume: 1.0, intensity: 1.0 },  // Alias
    'avancado': { volume: 1.2, intensity: 1.1 },       // +20% volume, +10% intensidade
    'avançado': { volume: 1.2, intensity: 1.1 },       // Alias
    'atleta': { volume: 1.4, intensity: 1.2 }          // +40% volume, +20% intensidade
};

// Rep ranges por objetivo (baseado em knowledge/progression.ts)
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

// Baseline por intensidade (ajustado por level e goal depois)
const BASE_INTENSITY_CONFIG: Record<IntensityLevel, { sets: number; reps: string; rest: string }> = {
    'very_high': { sets: 4, reps: '4-6', rest: '180s' },
    'high': { sets: 4, reps: '6-8', rest: '120s' },
    'moderate': { sets: 3, reps: '8-12', rest: '90s' },
    'low': { sets: 3, reps: '12-15', rest: '60s' },
    'very_low': { sets: 2, reps: '15-20', rest: '45s' }
};

const CANDIDATES_PER_SLOT = 5;

// ============ HELPERS DE PERSONALIZAÇÃO ============

function getPersonalizedConfig(
    intensity: IntensityLevel,
    level: string,
    goal: string
): { sets: number; reps: string; rest: string } {
    const baseConfig = BASE_INTENSITY_CONFIG[intensity];
    const levelMultiplier = LEVEL_MULTIPLIERS[level.toLowerCase()] || LEVEL_MULTIPLIERS['intermediario'];
    const goalRange = GOAL_REP_RANGES[goal.toLowerCase()] || GOAL_REP_RANGES['hipertrofia'];

    // Ajusta sets pelo nível
    const adjustedSets = Math.max(2, Math.round(baseConfig.sets * levelMultiplier.volume));

    // Usa rep range do objetivo
    const reps = `${goalRange.min}-${goalRange.max}`;

    // Usa descanso do objetivo
    const rest = goalRange.rest;

    return { sets: adjustedSets, reps, rest };
}

// ============ ENGINE ============

/**
 * Gera treino usando arquitetura determinística
 * Template → Slots → Candidatos → IA escolhe
 */
export async function generateWorkout(params: {
    name: string;
    goal: string;
    level: string;
    daysPerWeek: number;
    injuries?: string;
    useAI?: boolean;  // Se false, usa ranking determinístico
}): Promise<GeneratedWorkout | null> {
    const { name, goal, level, daysPerWeek, injuries, useAI = true } = params;

    // 1. SELECIONA TEMPLATE (regra, não IA)
    const template = selectTemplate(goal, daysPerWeek, level);
    if (!template) {
        console.error('[TrainingEngine] No template found for params:', params);
        return null;
    }

    // 2. PARSE INJURIES
    const parsedInjuries = parseInjuries(injuries);

    // 3. RESOLVE CADA DIA
    const resolvedDays: ResolvedDay[] = [];

    for (const day of template.days) {
        const resolvedSlots: ResolvedSlot[] = [];

        for (const slot of day.slots) {
            // 3.1 Busca candidatos válidos para o slot
            const candidates = await getCandidatesForSlot(slot, parsedInjuries, level);

            // 3.2 Configura sets/reps/rest baseado na intensidade, nível e objetivo
            const config = getPersonalizedConfig(slot.intensity, level, goal);

            const resolvedSlot: ResolvedSlot = {
                slot_id: slot.id,
                movement_pattern: slot.movement_pattern,
                intensity: slot.intensity,
                candidates,
                sets: config.sets,
                reps: config.reps,
                rest: config.rest
            };

            // 3.3 Seleciona exercício
            if (candidates.length > 0) {
                if (useAI && candidates.length > 1) {
                    // IA escolhe entre candidatos
                    resolvedSlot.selected = await selectWithAI(slot, candidates);
                } else {
                    // Usa o melhor do ranking determinístico
                    resolvedSlot.selected = candidates[0].exercise;
                }
            }

            resolvedSlots.push(resolvedSlot);
        }

        resolvedDays.push({
            day_id: day.day_id,
            label: day.label,
            slots: resolvedSlots
        });
    }

    return {
        template_id: template.template_id,
        template_name: template.name,
        client_name: name,
        days: resolvedDays,
        metadata: {
            goal,
            level,
            injuries: parsedInjuries,
            generated_at: new Date().toISOString()
        }
    };
}

// ============ CANDIDATOS ============

async function getCandidatesForSlot(
    slot: TrainingSlot,
    injuries: Injury[],
    level: string
): Promise<SlotCandidate[]> {
    // Busca exercícios pelo pattern
    const exercises = await resolveExercise({
        movement_pattern: slot.movement_pattern,
        primary_muscle: slot.target_muscles?.[0] || getDefaultMuscle(slot.movement_pattern),
        avoid_injuries: injuries,
        prefer_compound: slot.intensity === 'very_high' || slot.intensity === 'high'
    });

    // Score determinístico considerando nível
    const scored = exercises.map(ex => ({
        exercise: ex,
        score: calculateScore(ex, slot, injuries, level)
    }));

    // Ordena por score e pega top N
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, CANDIDATES_PER_SLOT);
}

function calculateScore(ex: Exercise, slot: TrainingSlot, injuries: Injury[], level: string): number {
    let score = 50;  // Base

    const isBeginnerOrElderly = level.toLowerCase() === 'iniciante';
    const isAdvanced = level.toLowerCase().includes('avançado') || level.toLowerCase() === 'atleta';

    // Compostos preferidos para alta intensidade E avançados
    if (ex.is_compound && (slot.intensity === 'very_high' || slot.intensity === 'high')) {
        score += isAdvanced ? 25 : 15;  // Avançado ganha mais pontos
    }

    // Máquinas MUITO preferidas para iniciantes e lesões
    if (ex.is_machine) {
        if (isBeginnerOrElderly) score += 30;  // PRIORIDADE máxima para iniciantes
        if (injuries.length > 0) score += 20;
        if (slot.intensity === 'low' || slot.intensity === 'very_low') score += 10;
    }

    // Pesos livres EVITADOS para iniciantes
    if (!ex.is_machine && isBeginnerOrElderly) {
        score -= 20;  // Penalty para pesos livres em iniciantes
    }

    // Penaliza FORTEMENTE se tem lesão relacionada
    if (injuries.some(inj => ex.caution_for_injuries.includes(inj))) {
        score -= 30;  // Penalty aumentado
    }

    // BLOQUEIA se é contraindicação absoluta para lesão
    if (injuries.some(inj => ex.avoid_for_injuries?.includes(inj))) {
        score -= 1000;  // Efetivamente bloqueado
    }

    // Carga axial EVITADA para iniciantes e lesões de coluna
    const hasSpinalInjury = injuries.some(inj =>
        inj.toLowerCase().includes('hérnia') ||
        inj.toLowerCase().includes('hernia') ||
        inj.toLowerCase().includes('lombar')
    );

    if (ex.spinal_load === 'alto') {
        if (hasSpinalInjury) score -= 50;  // BLOQUEIO para lesões de coluna
        if (isBeginnerOrElderly) score -= 15;  // Evita para iniciantes
    }

    // Estabilidade baixa preferida para iniciantes
    if (ex.stability_demand === 'baixo' && isBeginnerOrElderly) {
        score += 15;  // Aumentado de 5 para 15
    }

    // Penaliza alta estabilidade para iniciantes
    if (ex.stability_demand === 'alto' && isBeginnerOrElderly) {
        score -= 20;
    }

    return score;
}

function getDefaultMuscle(pattern: MovementPattern): string {
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

// ============ SELEÇÃO COM IA (MINIMALISTA) ============

async function selectWithAI(
    slot: TrainingSlot,
    candidates: SlotCandidate[]
): Promise<Exercise> {
    // Fallback se menos de 2 candidatos
    if (candidates.length < 2) {
        return candidates[0]?.exercise || candidates[0].exercise;
    }

    // Prompt MINIMALISTA - IA só escolhe ID
    const optionsText = candidates
        .map((c, i) => `${i + 1}. ${c.exercise.name}`)
        .join('\n');

    const prompt = `Slot: ${slot.movement_pattern} | ${slot.intensity}
Opções válidas:
${optionsText}

Escolha a opção mais adequada para continuidade muscular.
Retorne APENAS o número (1-${candidates.length}).`;

    try {
        const result = await aiRouter.execute({
            action: 'training_intent',
            prompt,
            metadata: { slot_id: slot.id, type: 'exercise_selection' }
        });

        if (result.success && result.text) {
            // Parse resposta - espera apenas número
            const match = result.text.trim().match(/^(\d+)/);
            if (match) {
                const idx = parseInt(match[1], 10) - 1;
                if (idx >= 0 && idx < candidates.length) {
                    return candidates[idx].exercise;
                }
            }
        }
    } catch (error) {
        console.warn('[TrainingEngine] AI selection failed, using deterministic:', error);
    }

    // Fallback: melhor do ranking
    return candidates[0].exercise;
}

// ============ HELPERS ============

function parseInjuries(injuriesText?: string): Injury[] {
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

// ============ EXPORT ============

export { selectTemplate } from './workoutTemplates';
