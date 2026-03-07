// Training Engine v3.0 - Arquitetura Neuro-Simbólica
// Templates biomecânicos + Seleção inteligente + Validação de segurança
// OPTIMIZED: Parallel processing with batch queries
// v3.0: Sistema completo com prompts dinâmicos, validação simbólica e base EXMO

import PQueue from 'p-queue';
import { selectTemplate, type IntensityLevel, type TrainingSlot } from './workoutTemplates';
import { resolveExercise, type Exercise, type Injury, fetchAllExercises, filterExercisesInMemory, parseClientInjuries } from '../exerciseService';
import type { MovementPattern } from './types';
import { detectConditions, getAggregatedModifiers } from './knowledge/specialConditions';
import { compileBiomechanicalProfile, isExerciseCompatible, type BiomechanicalProfile } from './biomechanicalProfile';
// v2.2: Sistema de detecção expandido com keywords robustas
import { detectConditionsEnhanced } from './knowledge/conditionDetection';
// v3.1: Volume Counter em Tempo Real
import { initializeVolumeCounter, addSetsToCounter, adjustSetsToFitMRV, validateFinalVolume, getDefaultMuscleForPattern, type VolumeCounter } from './volumeCounter';
// v3.1.2: Pattern Validator - Prevenir padrões consecutivos
import { validateConsecutivePatterns, extractPatternsFromWorkout, formatValidationResult } from './validation/patternValidator';
// v3.2: Workout Validator - Duplicatas e cobertura muscular
import { validateNoDuplicatesInDay, validateMuscleCoverage, removeDuplicatesFromDay, type MuscleCoverageResult } from './validation/workoutValidator';
// v3.2: Exercise Blacklist - Contexto de treino (academia vs. casa)
import { filterByContext, prioritizeByContext, type ContextFilterOptions } from './knowledge/exerciseBlacklist';
import { evaluateExerciseTier } from './knowledge/exerciseTiering';
import { classifyInjuryConstraints, pseudonymizeClientName, sanitizeCoachObservations } from './promptPrivacy';
import { setWorkoutAIContext, shouldPrioritizeAISlot, selectSlotExerciseWithAI } from './trainingEngineAI';
import {
    CANDIDATES_PER_SLOT,
    extractContextExceptions,
    getDefaultMuscle,
    getPersonalizedConfig,
    inferDayFocus,
    isAdvancedLevel,
    normalizeExerciseName,
    normalizeLevel,
    normalizeText,
    parseInjuries
} from './trainingEngineUtils';

const isDev = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
    if (isDev) console.log(...args);
};
const debugTime = (label: string) => {
    if (isDev) console.time(label);
};
const debugTimeEnd = (label: string) => {
    if (isDev) console.timeEnd(label);
};

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
        pattern_warnings?: string[];
        pattern_valid?: boolean;
        muscle_coverage?: {
            valid: boolean;
            missing: string[];
        };
        duplicates_removed?: number;
        [key: string]: any; // Allow additional properties
    };
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
    age?: number;  // idade direta do cliente
    weight?: number;  // peso em kg (para cálculo de IMC)
    height?: number;  // altura em cm (para cálculo de IMC)
    useAI?: boolean;
    onProgress?: (progress: { stage: string; current: number; total: number; message: string }) => void;
}): Promise<GeneratedWorkout | null> {

    const { name, goal, level, daysPerWeek, injuries, observations, birthDate, useAI = true, onProgress } = params;

    debugTime('[TrainingEngine] TOTAL Generation Time');

    // 1. OBTER IDADE (de birthDate OU campo age direto)
    let clientAge: number | undefined;
    if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        clientAge = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            clientAge--;
        }
        debugLog(`[TrainingEngine] Calculated age from birthDate: ${clientAge}`);
    } else if (params.age !== undefined) {
        clientAge = params.age;
        debugLog(`[TrainingEngine] Using provided age: ${clientAge}`);
    }

    // 2. NOVO v2.2: DETECÇÃO EXPANDIDA (usa keywords robustas)
    const enhancedDetection = detectConditionsEnhanced(
        observations || '',
        injuries || '',
        clientAge,
        undefined, // bmi
        params.weight,
        params.height
    );

    debugLog('[TrainingEngine] Enhanced detection result:', {
        conditions: enhancedDetection.conditions.map(c => `${c.type}${c.location ? `_${c.location}` : ''}`),
        blockedExercises: enhancedDetection.blockedExercises.length,
        parsedInjuries: enhancedDetection.parsedInjuries
    });

    // 3. DETECTAR CONDIÇÕES ESPECIAIS (sistema legado - compatibilidade)
    const combinedObservations = `${observations || ''} nivel:${level}`;
    const specialConditions = detectConditions(combinedObservations, injuries, birthDate);
    const conditionModifiers = getAggregatedModifiers(specialConditions);

    // 4. PARSE INJURIES - combina legado + novo
    const parsedInjuries = [
        ...parseInjuries(injuries),
        ...enhancedDetection.parsedInjuries
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    // 5. COMBINAR exercícios bloqueados (legado + novo sistema)
    const allBlockedExercises = [
        ...conditionModifiers.blockedExercises,
        ...enhancedDetection.blockedExercises
    ];

    // 6. COMPILAR PERFIL BIOMECÂNICO (agora com dados enriquecidos)
    const biomechProfile = compileBiomechanicalProfile(specialConditions, parsedInjuries, clientAge, observations);

    debugLog('[TrainingEngine] Special conditions detected:', specialConditions);
    debugLog('[TrainingEngine] Modifiers:', conditionModifiers);
    debugLog('[TrainingEngine] BiomechanicalProfile:', biomechProfile);
    debugLog('[TrainingEngine] Total blocked exercises:', allBlockedExercises.length);

    // v3.0: Setar contexto completo para o sistema neuro-simbólico

    setWorkoutAIContext({
        clientName: pseudonymizeClientName(name),
        level,
        goal,
        injuries: classifyInjuryConstraints(injuries),
        observations: sanitizeCoachObservations(observations),
        specialConditions,
        // v3.0: Campos expandidos para arquitetura neuro-simbólica
        age: clientAge,
        conditions: enhancedDetection.conditions,
        restrictions: enhancedDetection.restrictions,
        biomechProfile
    });

    // 5. SELECIONAR TEMPLATE (agora com idade)
    const template = selectTemplate(goal, daysPerWeek, level, clientAge);
    if (!template) {
        console.error('[TrainingEngine] No template found for params:', params);
        return null;
    }

    onProgress?.({ stage: 'template', current: 1, total: 4, message: 'Template selecionado' });

    // v3.1: INICIALIZAR CONTADOR DE VOLUME EM TEMPO REAL
    const levelNorm = normalizeLevel(level);
    const volumeCounter = initializeVolumeCounter(levelNorm);
    debugLog('[TrainingEngine] Volume counter initialized for level:', levelNorm);

    // 6. OTIMIZAÇÃO #1: Batch DB Query (96% faster)
    debugTime('[TrainingEngine] DB Fetch');
    onProgress?.({ stage: 'database', current: 2, total: 4, message: 'Carregando exercícios...' });

    const allExercisesDB = await fetchAllExercises();
    debugTimeEnd('[TrainingEngine] DB Fetch');
    debugLog(`[TrainingEngine] Loaded ${allExercisesDB.length} exercises from cache/DB`);

    const contextFilterOptions: ContextFilterOptions = {
        goal,
        explicitExceptions: extractContextExceptions(goal, observations),
        allowBodyweightForPatterns: ['core']
    };
    if (contextFilterOptions.explicitExceptions && contextFilterOptions.explicitExceptions.length > 0) {
        debugLog('[TrainingEngine] Context exceptions enabled:', contextFilterOptions.explicitExceptions);
    }

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
    debugLog(`[TrainingEngine] Processing ${totalSlots} slots in parallel...`);

    // 6. OTIMIZAÇÃO #2: Processamento Paralelo com Concorrência Controlada
    debugTime('[TrainingEngine] AI Processing');
    onProgress?.({ stage: 'ai_processing', current: 3, total: 4, message: `Gerando treino... (0/${totalSlots})` });

    // Config p-queue: conservative throughput to reduce 429 bursts.
    // Combined with MAX_AI_SELECTIONS_PER_WORKOUT, this keeps token usage predictable.
    const queue = new PQueue({
        concurrency: 2,        // 2 concurrent requests max
        interval: 4000,        // 4 second window
        intervalCap: 2
    });

    let processedCount = 0;
    let remainingAISlots = Math.min(MAX_AI_SELECTIONS_PER_WORKOUT, totalSlots);
    let aiBudgetExhaustedLogged = false;

    const processedSlots = await Promise.all(
        allSlotTasks.map(task =>
            queue.add(async () => {
                try {
                    // A. Filtrar exercícios EM MEMÓRIA (instantâneo)
                    let candidates = filterExercisesInMemory(allExercisesDB, {
                        movement_pattern: task.slot.movement_pattern,
                        primary_muscle: task.slot.target_muscles?.[0] || getDefaultMuscle(task.slot.movement_pattern),
                        avoid_injuries: parsedInjuries,
                        prefer_compound: task.slot.intensity === 'high' || task.slot.intensity === 'very_high'
                    });

                    // v3.2: FILTRO BLACKLIST - Contexto de academia (remove Flexão de Braços, etc)
                    candidates = filterByContext(candidates, 'academia', contextFilterOptions);

                    // v3.2: PRIORIZAÇÃO - Exercícios de academia preferidos
                    candidates = prioritizeByContext(candidates, 'academia');

                    // FILTRO 1: Exercícios bloqueados por condições especiais (strings - rede de segurança)
                    // ATUALIZADO v2.2: Usa lista combinada (legado + novo sistema)
                    let filteredCandidates = candidates.filter(ex => {
                        const exerciseLower = ex.name.toLowerCase();
                        return !allBlockedExercises.some(blocked =>
                            exerciseLower.includes(blocked.toLowerCase())
                        );
                    });

                    // FILTRO 2: Compatibilidade biomecânica (tags - mais preciso)
                    filteredCandidates = filteredCandidates.filter(ex => {
                        const compatibility = isExerciseCompatible(ex, biomechProfile);
                        if (!compatibility.compatible) {
                            debugLog(`[TrainingEngine] Blocked ${ex.name}: ${compatibility.reason}`);
                        }
                        return compatibility.compatible;
                    });

                    // B. Calcular score determinístico
                    const scoredCandidates: SlotCandidate[] = filteredCandidates.map(ex => ({
                        exercise: ex,
                        score: calculateScore(
                            ex,
                            task.slot,
                            parsedInjuries,
                            level,
                            goal,
                            task.day.label
                        )
                    }));

                    // Ordenar por score
                    scoredCandidates.sort((a, b) => b.score - a.score);
                    const topCandidates = scoredCandidates.slice(0, CANDIDATES_PER_SLOT);

                    // C. Configuração personalizada
                    let config = getPersonalizedConfig(
                        task.slot.intensity,
                        level,
                        goal,
                        conditionModifiers.volume
                    );

                    // v3.1: VALIDAÇÃO DE VOLUME EM TEMPO REAL
                    const targetMuscle = task.slot.target_muscles?.[0] ||
                        getDefaultMuscleForPattern(task.slot.movement_pattern);

                    const volumeCheck = addSetsToCounter(volumeCounter, targetMuscle, config.sets);

                    if (!volumeCheck.success) {
                        // Ajustar séries para caber no MRV
                        const adjustedSets = adjustSetsToFitMRV(volumeCounter, targetMuscle, config.sets);
                        console.warn(`[VolumeCounter] ${volumeCheck.reason}`);
                        debugLog(`[VolumeCounter] Ajustando ${task.slot.id} de ${config.sets} para ${adjustedSets} séries`);

                        config = { ...config, sets: adjustedSets };

                        // Adicionar séries ajustadas ao contador
                        if (adjustedSets > 0) {
                            addSetsToCounter(volumeCounter, targetMuscle, adjustedSets);
                        }
                    }


                    // D. Seleção (IA ou determinístico)
                    let selectedExercise: Exercise | undefined;
                    const shouldUseAIForThisSlot = useAI
                        && topCandidates.length > 1
                        && remainingAISlots > 0
                        && shouldPrioritizeAISlot(task.slot);

                    if (shouldUseAIForThisSlot) {
                        remainingAISlots -= 1;
                        selectedExercise = await selectSlotExerciseWithAI(
                            task.slot,
                            topCandidates.map(candidate => candidate.exercise)
                        );
                    } else {
                        if (useAI && topCandidates.length > 1 && remainingAISlots <= 0 && !aiBudgetExhaustedLogged) {
                            debugLog(`[TrainingEngine] AI slot budget exhausted (${MAX_AI_SELECTIONS_PER_WORKOUT}). Remaining slots use deterministic selection.`);
                            aiBudgetExhaustedLogged = true;
                        }
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

    debugTimeEnd('[TrainingEngine] AI Processing');

    // 7. REIDRATAÇÃO: Reconstruir estrutura de dias
    debugTime('[TrainingEngine] Rehydration');

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

    const variationWindow = isAdvancedLevel(level) ? resolvedDays.length : Math.min(3, resolvedDays.length);
    const variationResult = applyIntelligentVariation(resolvedDays, variationWindow);
    if (variationResult.replacements > 0) {
        debugLog(`[TrainingEngine] Intelligent variation replacements: ${variationResult.replacements}`);
    }

    const uniquenessResult = enforceCrossDayUniqueness(variationResult.days);
    const variedResolvedDays = uniquenessResult.days;
    if (uniquenessResult.replacements > 0) {
        debugLog(`[TrainingEngine] Cross-day uniqueness replacements: ${uniquenessResult.replacements}`);
    }

    debugTimeEnd('[TrainingEngine] Rehydration');

    // v3.1: VALIDAÇÃO FINAL DO VOLUME
    const volumeValidation = validateFinalVolume(volumeCounter);
    debugLog('\n' + volumeValidation.summary);

    if (volumeValidation.warnings.length > 0) {
        console.warn('[VolumeCounter] Warnings detected:');
        volumeValidation.warnings.forEach(w => console.warn(w));
    } else {
        debugLog('[VolumeCounter] ✅ All muscle groups within optimal volume ranges');
    }

    // v3.2: VALIDAÇÃO DE DUPLICATAS E COBERTURA MUSCULAR
    debugLog('\n🔍 [Validation] Validando treino gerado...\n');

    // Validar e corrigir duplicatas em cada dia
    let totalDuplicatesRemoved = 0;
    variedResolvedDays.forEach(day => {
        const duplicateCheck = validateNoDuplicatesInDay(day.slots, day.label);

        if (!duplicateCheck.valid) {
            console.error(`\n❌ DUPLICATAS DETECTADAS em ${day.label}:`);
            duplicateCheck.warnings.forEach(w => console.error(`   ${w}`));

            // AÇÃO CORRETIVA: Remover duplicatas automaticamente
            const { cleaned, removed } = removeDuplicatesFromDay(day.slots);
            day.slots = cleaned;
            totalDuplicatesRemoved += removed.length;

            debugLog(`   🔧 Correção automática: ${removed.length} duplicata(s) removida(s)`);
        } else {
            debugLog(`✅ ${day.label}: Sem duplicatas`);
        }
    });

    if (totalDuplicatesRemoved > 0) {
        console.warn(`\n⚠️  Total de duplicatas removidas: ${totalDuplicatesRemoved}`);
    }

    // Validar cobertura muscular
    const muscleCoverageResult = validateMuscleCoverage(template, variedResolvedDays);

    if (!muscleCoverageResult.valid) {
        console.warn('\n⚠️  GRUPOS MUSCULARES NÃO COBERTOS:');
        muscleCoverageResult.missing.forEach(m =>
            console.warn(`   - ${m}`)
        );
    } else {
        debugLog('\n✅ Todos os grupos musculares obrigatórios foram cobertos');
    }

    // Exibir cobertura detalhada
    debugLog('\n📊 Cobertura muscular:');
    muscleCoverageResult.covered
        .filter(c => c.covered)
        .forEach(c => {
            debugLog(`   ✅ ${c.muscleGroup}: ${c.count} exercício(s)`);
        });


    onProgress?.({ stage: 'complete', current: 4, total: 4, message: 'Treino gerado!' });

    debugTimeEnd('[TrainingEngine] TOTAL Generation Time');

    // v3.1.2: VALIDAÇÃO DE PADRÕES CONSECUTIVOS
    const workout: GeneratedWorkout = {
        template_id: template.template_id,
        template_name: template.name,
        client_name: name,
        days: variedResolvedDays,
        metadata: {
            goal,
            level,
            injuries: parsedInjuries,
            generated_at: new Date().toISOString(),
            variation_replacements: variationResult.replacements + uniquenessResult.replacements,
            variation_window_days: variationWindow
        }
    };

    const patternsData = extractPatternsFromWorkout(workout);
    const patternValidation = validateConsecutivePatterns(patternsData);

    debugLog('\n' + formatValidationResult(patternValidation));

    // Adicionar warnings e validações ao metadata
    workout.metadata = {
        ...workout.metadata,
        pattern_warnings: patternValidation.warnings.length > 0 ? patternValidation.warnings : undefined,
        pattern_valid: patternValidation.valid,
        muscle_coverage: {
            valid: muscleCoverageResult.valid,
            missing: muscleCoverageResult.missing
        },
        duplicates_removed: totalDuplicatesRemoved > 0 ? totalDuplicatesRemoved : undefined
    };

    return workout;
}


// ============ CANDIDATOS ============

async function getCandidatesForSlot(
    slot: TrainingSlot,
    injuries: Injury[],
    level: string,
    goal: string,
    dayLabel?: string,
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
        score: calculateScore(ex, slot, injuries, level, goal, dayLabel)
    }));

    // Ordena por score e pega top N
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, CANDIDATES_PER_SLOT);
}

function calculateScore(
    ex: Exercise,
    slot: TrainingSlot,
    injuries: Injury[],
    level: string,
    goal: string,
    dayLabel?: string
): number {
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

    // Contexto padrão do app: academia completa.
    // Evita seleção de exercícios exclusivamente com peso corporal quando há alternativas melhores.
    const equipment = ex.equipment || [];
    const isBodyweightOnly = equipment.length === 1 && equipment[0] === 'peso_corporal';
    if (slot.movement_pattern !== 'core' && isBodyweightOnly) {
        score -= 35;
    } else if (equipment.some(eq => eq === 'maquina' || eq === 'cabo' || eq === 'halter' || eq === 'barra')) {
        score += 12;
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

    // Tier list por padrão de movimento + objetivo
    const tierEval = evaluateExerciseTier(ex.name, slot.movement_pattern, goal);
    score += tierEval.score;

    return score;
}

function applyIntelligentVariation(
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

function shouldEnforceUniqueName(slot: ResolvedSlot): boolean {
    // Permite repetição para CORE e panturrilha, mas bloqueia repetição de compostos/isoladores principais.
    return slot.movement_pattern !== 'core' && slot.movement_pattern !== 'isolar_panturrilha';
}

function enforceCrossDayUniqueness(
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

            // Sem alternativa viável: mantém exercício atual para não quebrar o slot.
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

const MAX_AI_SELECTIONS_PER_WORKOUT = 6;

// ============ EXPORT ============

export { selectTemplate } from './workoutTemplates';
