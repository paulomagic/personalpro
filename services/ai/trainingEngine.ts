// Training Engine v2.0 - Híbrido: Determinístico + IA
// Templates biomecânicos + Seleção inteligente de exercícios
// OPTIMIZED: Parallel processing with batch queries

import PQueue from 'p-queue';
import { selectTemplate, type IntensityLevel, type TrainingSlot } from './workoutTemplates';
import { resolveExercise, type Exercise, type Injury, fetchAllExercises, filterExercisesInMemory } from '../exerciseService';
import { aiRouter } from './aiRouter';
import type { MovementPattern } from './types';
import { detectConditions, getAggregatedModifiers, type SpecialCondition } from './knowledge/specialConditions';

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
    goal: string,
    conditionVolumeModifier: number = 1.0  // NOVO: modificador de condições especiais
): { sets: number; reps: string; rest: string } {
    const baseConfig = BASE_INTENSITY_CONFIG[intensity];
    const levelMultiplier = LEVEL_MULTIPLIERS[level.toLowerCase()] || LEVEL_MULTIPLIERS['intermediario'];
    const goalRange = GOAL_REP_RANGES[goal.toLowerCase()] || GOAL_REP_RANGES['hipertrofia'];

    // Ajusta sets pelo nível E condições especiais
    const combinedVolumeMultiplier = levelMultiplier.volume * conditionVolumeModifier;
    const adjustedSets = Math.max(2, Math.round(baseConfig.sets * combinedVolumeMultiplier));

    // Usa rep range do objetivo
    const reps = `${goalRange.min}-${goalRange.max}`;

    // Usa descanso do objetivo
    const rest = goalRange.rest;

    return { sets: adjustedSets, reps, rest };
}

// ============ ENGINE ============


/**
 * Gera treino usando arquitetura OTIMIZADA
 * Template → Batch DB → Parallel Slots → IA com concorrência controlada
 * 
 * PERFORMANCE: 14s → ~3s (80% faster)
 */
export async function generateWorkout(params: {
    name: string;
    goal: string;
    level: string;
    daysPerWeek: number;
    injuries?: string;
    observations?: string;
    birthDate?: string;
    useAI?: boolean;
    onProgress?: (progress: { stage: string; current: number; total: number; message: string }) => void;
}): Promise<GeneratedWorkout | null> {
    const { name, goal, level, daysPerWeek, injuries, observations, birthDate, useAI = true, onProgress } = params;

    console.time('[TrainingEngine] TOTAL Generation Time');

    // 1. DETECTAR CONDIÇÕES ESPECIAIS
    const specialConditions = detectConditions(observations, injuries, birthDate);
    const conditionModifiers = getAggregatedModifiers(specialConditions);

    console.log('[TrainingEngine] Special conditions detected:', specialConditions);
    console.log('[TrainingEngine] Modifiers:', conditionModifiers);

    // NOVO: Setar contexto para o prompt da IA
    setWorkoutContext({
        clientName: name,
        level,
        goal,
        injuries: injuries || '',
        observations: observations || '',
        specialConditions
    });

    // 2. SELECIONAR TEMPLATE
    const template = selectTemplate(goal, daysPerWeek, level);
    if (!template) {
        console.error('[TrainingEngine] No template found for params:', params);
        return null;
    }

    onProgress?.({ stage: 'template', current: 1, total: 4, message: 'Template selecionado' });

    // 3. PARSE INJURIES
    const parsedInjuries = parseInjuries(injuries);

    // 4. OTIMIZAÇÃO #1: Batch DB Query (96% faster)
    console.time('[TrainingEngine] DB Fetch');
    onProgress?.({ stage: 'database', current: 2, total: 4, message: 'Carregando exercícios...' });

    const allExercisesDB = await fetchAllExercises();
    console.timeEnd('[TrainingEngine] DB Fetch');
    console.log(`[TrainingEngine] Loaded ${allExercisesDB.length} exercises from cache/DB`);

    // 5. PREPARAR LISTA PLANA DE SLOTS PARA PROCESSAMENTO PARALELO
    interface SlotTask {
        dayIndex: number;
        slotIndex: number;
        day: any;
        slot: TrainingSlot;
    }

    const allSlotTasks: SlotTask[] = [];
    template.days.forEach((day, dayIndex) => {
        day.slots.forEach((slot, slotIndex) => {
            allSlotTasks.push({ dayIndex, slotIndex, day, slot });
        });
    });

    const totalSlots = allSlotTasks.length;
    console.log(`[TrainingEngine] Processing ${totalSlots} slots in parallel...`);

    // 6. OTIMIZAÇÃO #2: Processamento Paralelo com Concorrência Controlada
    console.time('[TrainingEngine] AI Processing');
    onProgress?.({ stage: 'ai_processing', current: 3, total: 4, message: `Gerando treino... (0/${totalSlots})` });

    // Config p-queue: 5 concurrent para não estourar Groq rate limit (30 req/min)
    const queue = new PQueue({
        concurrency: 5,
        interval: 60000,      // 1 minuto
        intervalCap: 25        // Max 25 requests/min (margem de segurança)
    });

    let processedCount = 0;

    const processedSlots = await Promise.all(
        allSlotTasks.map(task =>
            queue.add(async () => {
                try {
                    // A. Filtrar exercícios EM MEMÓRIA (instantâneo)
                    const candidates = filterExercisesInMemory(allExercisesDB, {
                        movement_pattern: task.slot.movement_pattern,
                        primary_muscle: task.slot.target_muscles?.[0] || getDefaultMuscle(task.slot.movement_pattern),
                        avoid_injuries: parsedInjuries,
                        prefer_compound: task.slot.intensity === 'high' || task.slot.intensity === 'very_high'
                    });

                    // Filtrar exercícios bloqueados por condições especiais
                    const filteredCandidates = candidates.filter(ex => {
                        const exerciseLower = ex.name.toLowerCase();
                        return !conditionModifiers.blockedExercises.some(blocked =>
                            exerciseLower.includes(blocked.toLowerCase())
                        );
                    });

                    // B. Calcular score determinístico
                    const scoredCandidates: SlotCandidate[] = filteredCandidates.map(ex => ({
                        exercise: ex,
                        score: calculateScore(ex, task.slot, parsedInjuries, level)
                    }));

                    // Ordenar por score
                    scoredCandidates.sort((a, b) => b.score - a.score);
                    const topCandidates = scoredCandidates.slice(0, 5);

                    // C. Configuração personalizada
                    const config = getPersonalizedConfig(
                        task.slot.intensity,
                        level,
                        goal,
                        conditionModifiers.volume
                    );

                    // D. Seleção (IA ou determinístico)
                    let selectedExercise: Exercise | undefined;

                    if (useAI && topCandidates.length > 1) {
                        // IA escolhe entre top 5
                        selectedExercise = await selectWithAI(task.slot, topCandidates);
                    } else {
                        // Fallback determinístico
                        selectedExercise = topCandidates[0]?.exercise;
                    }

                    // Update progress
                    processedCount++;
                    onProgress?.({
                        stage: 'ai_processing',
                        current: 3,
                        total: 4,
                        message: `Gerando treino... (${processedCount}/${totalSlots})`
                    });

                    return {
                        ...task,
                        resolvedSlot: {
                            slot_id: task.slot.id,
                            movement_pattern: task.slot.movement_pattern,
                            intensity: task.slot.intensity,
                            candidates: topCandidates,
                            selected: selectedExercise,
                            sets: config.sets,
                            reps: config.reps,
                            rest: config.rest
                        }
                    };

                } catch (error) {
                    console.error(`[TrainingEngine] Error processing slot ${task.slot.id}:`, error);

                    // Fallback em caso de erro
                    const config = getPersonalizedConfig(task.slot.intensity, level, goal, 1.0);

                    return {
                        ...task,
                        resolvedSlot: {
                            slot_id: task.slot.id,
                            movement_pattern: task.slot.movement_pattern,
                            intensity: task.slot.intensity,
                            candidates: [],
                            selected: undefined,
                            sets: config.sets,
                            reps: config.reps,
                            rest: config.rest
                        }
                    };
                }
            })
        )
    );

    console.timeEnd('[TrainingEngine] AI Processing');

    // 7. REIDRATAÇÃO: Reconstruir estrutura de dias
    console.time('[TrainingEngine] Rehydration');

    const resolvedDays: ResolvedDay[] = template.days.map((day, dIndex) => {
        const daySlots = processedSlots
            .filter(r => r.dayIndex === dIndex)
            .sort((a, b) => a.slotIndex - b.slotIndex)
            .map(r => r.resolvedSlot);

        return {
            day_id: day.day_id,
            label: day.label,
            slots: daySlots
        };
    });

    console.timeEnd('[TrainingEngine] Rehydration');

    onProgress?.({ stage: 'complete', current: 4, total: 4, message: 'Treino gerado!' });

    console.timeEnd('[TrainingEngine] TOTAL Generation Time');

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
    level: string,
    blockedExercises: string[] = []  // NOVO: exercícios bloqueados por condições
): Promise<SlotCandidate[]> {
    // Busca exercícios pelo pattern
    const exercises = await resolveExercise({
        movement_pattern: slot.movement_pattern,
        primary_muscle: slot.target_muscles?.[0] || getDefaultMuscle(slot.movement_pattern),
        avoid_injuries: injuries,
        prefer_compound: slot.intensity === 'very_high' || slot.intensity === 'high'
    });

    // NOVO: Filtra exercícios bloqueados por condições especiais
    const filteredExercises = exercises.filter(ex => {
        const exerciseLower = ex.name.toLowerCase();
        return !blockedExercises.some(blocked =>
            exerciseLower.includes(blocked.toLowerCase())
        );
    });

    // Score determinístico considerando nível
    const scored = filteredExercises.map(ex => ({
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

    const isBeginnerOrElderly = level.toLowerCase() === 'iniciante' || level.toLowerCase() === 'idoso';
    const isAdvanced = level.toLowerCase().includes('avançado') || level.toLowerCase() === 'atleta';

    // Compostos preferidos para alta intensidade E avançados
    if (ex.is_compound && (slot.intensity === 'very_high' || slot.intensity === 'high')) {
        score += isAdvanced ? 25 : 15;
    }

    // Máquinas MUITO preferidas para iniciantes e lesões
    if (ex.is_machine) {
        if (isBeginnerOrElderly) score += 30;
        if (injuries.length > 0) score += 20;
        if (slot.intensity === 'low' || slot.intensity === 'very_low') score += 10;
    }

    // Pesos livres EVITADOS para iniciantes
    if (!ex.is_machine && isBeginnerOrElderly) {
        score -= 20;
    }

    // LESÕES - penalidade severa se contraindicado
    if (injuries && injuries.length > 0) {
        for (const injury of injuries) {
            if (ex.avoid_for_injuries?.includes(injury)) {
                score -= 1000; // Eliminatório
            }
            if (ex.caution_for_injuries?.includes(injury)) {
                score -= 30;
            }
        }
    }

    // CARGA AXIAL - penaliza se alto para iniciante/idoso
    if (ex.spinal_load === 'alto' && isBeginnerOrElderly) {
        score -= 25;
    }

    // DEMANDA DE ESTABILIDADE
    if (ex.stability_demand === 'alto' && isBeginnerOrElderly) {
        score -= 20;
    }
    if (ex.stability_demand === 'baixo' && isBeginnerOrElderly) {
        score += 15;
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

// Contexto global para o prompt (setado em generateWorkout)
let currentWorkoutContext: {
    clientName: string;
    level: string;
    goal: string;
    injuries: string;
    observations: string;
    specialConditions: string[];
} | null = null;

export function setWorkoutContext(context: typeof currentWorkoutContext) {
    currentWorkoutContext = context;
}

async function selectWithAI(
    slot: TrainingSlot,
    candidates: SlotCandidate[]
): Promise<Exercise> {
    // Fallback se menos de 2 candidatos
    if (candidates.length < 2) {
        return candidates[0]?.exercise;
    }

    // Contexto do cliente (se disponível)
    const ctx = currentWorkoutContext || {
        clientName: 'Aluno',
        level: 'Intermediário',
        goal: 'Hipertrofia',
        injuries: 'Nenhuma',
        observations: '',
        specialConditions: []
    };

    // Lista de candidatos formatada
    const candidatesList = candidates.map((c, i) => ({
        num: i + 1,
        name: c.exercise.name,
        equipment: c.exercise.equipment?.join(', ') || 'variado',
        is_machine: c.exercise.is_machine,
        is_compound: c.exercise.is_compound,
        spinal_load: c.exercise.spinal_load
    }));

    // PROMPT REFINADO - PhD em Biomecânica
    const systemPrompt = `Você é um Treinador de Elite (PhD em Biomecânica) e uma API JSON.
Sua função é selecionar o MELHOR exercício baseado no perfil do aluno.

REGRAS DE SEGURANÇA (CRÍTICO):
1. HÉRNIA/LOMBAR: PROIBIDO carga axial alta (Agachamento Livre, Terra, Militar em pé). Use máquinas.
2. OMBRO: Prefira pegada neutra. Evite rotação interna excessiva.
3. JOELHO: Evite impacto ou ângulos agudos de flexão sob carga alta.
4. GESTANTE: APENAS máquinas e cabos. ZERO carga axial.
5. IDOSO: Priorize máquinas com apoio. Evite alta complexidade.

REGRAS DE OBJETIVO:
- FORÇA: Priorize compostos com barra, alta estabilidade.
- HIPERTROFIA: Priorize exercícios com boa amplitude e tensão constante.
- EMAGRECIMENTO: Priorize exercícios que permitem alta densidade (menos descanso).
- SAÚDE/QUALIDADE DE VIDA: Priorize máquinas seguras e mobilidade.

REGRAS DE NÍVEL:
- INICIANTE: SEMPRE máquinas guiadas primeiro.
- AVANÇADO/ATLETA: Pode usar peso livre e compostos complexos.

Responda APENAS com JSON válido, sem introduções.`;

    const userPrompt = `ALUNO: ${ctx.clientName}
NÍVEL: ${ctx.level}
OBJETIVO: ${ctx.goal}
LESÕES: ${ctx.injuries === '' ? 'Nenhuma' : ctx.injuries}
CONDIÇÕES ESPECIAIS: ${ctx.specialConditions.length > 0 ? ctx.specialConditions.join(', ') : 'Nenhuma'}
OBSERVAÇÕES: ${ctx.observations || 'Nenhuma'}

SLOT ATUAL:
- Padrão de Movimento: ${slot.movement_pattern}
- Músculo Alvo: ${slot.target_muscles?.[0] || 'geral'}
- Intensidade: ${slot.intensity} (high = composto principal, low = isolador)

CANDIDATOS (escolha UM):
${JSON.stringify(candidatesList, null, 2)}

Responda com JSON: { "selected": <número 1-${candidates.length}>, "reasoning": "<1 frase explicando por que>" }`;

    try {
        const result = await aiRouter.execute({
            action: 'training_intent',
            prompt: `${systemPrompt}\n\n${userPrompt}`,
            metadata: {
                slot_id: slot.id,
                type: 'exercise_selection',
                client_level: ctx.level,
                client_goal: ctx.goal,
                has_injuries: ctx.injuries !== 'Nenhuma' && ctx.injuries !== ''
            }
        });

        if (result.success && result.text) {
            // Parse JSON response
            try {
                const parsed = JSON.parse(result.text);
                const selectedNum = parsed.selected || parsed.num || parsed.choice;
                if (selectedNum && selectedNum >= 1 && selectedNum <= candidates.length) {
                    console.log(`[AI] Selected ${candidates[selectedNum - 1].exercise.name}: ${parsed.reasoning || 'No reason'}`);
                    return candidates[selectedNum - 1].exercise;
                }
            } catch {
                // Fallback: tenta encontrar número na resposta
                const match = result.text.match(/(\d+)/);
                if (match) {
                    const idx = parseInt(match[1], 10) - 1;
                    if (idx >= 0 && idx < candidates.length) {
                        return candidates[idx].exercise;
                    }
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
