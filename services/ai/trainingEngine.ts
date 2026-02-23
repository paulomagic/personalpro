// Training Engine v3.0 - Arquitetura Neuro-Simbólica
// Templates biomecânicos + Seleção inteligente + Validação de segurança
// OPTIMIZED: Parallel processing with batch queries
// v3.0: Sistema completo com prompts dinâmicos, validação simbólica e base EXMO

import PQueue from 'p-queue';
import { selectTemplate, type IntensityLevel, type TrainingSlot } from './workoutTemplates';
import { resolveExercise, type Exercise, type Injury, fetchAllExercises, filterExercisesInMemory, parseClientInjuries } from '../exerciseService';
import { aiRouter } from './aiRouter';
import type { MovementPattern } from './types';
import { detectConditions, getAggregatedModifiers, type SpecialCondition } from './knowledge/specialConditions';
import { compileBiomechanicalProfile, isExerciseCompatible, type BiomechanicalProfile } from './biomechanicalProfile';
// v2.2: Sistema de detecção expandido com keywords robustas
import { detectConditionsEnhanced, type DetectionResult, type BiomechanicalRestrictions } from './knowledge/conditionDetection';
// v3.0: Sistema Neuro-Simbólico
import { buildDynamicSystemPrompt, buildUserPrompt, type ClientContext } from './prompts/systemPromptBuilder';
import { validateAIResponse, findSafeAlternative, type ValidationResult } from './validation/exerciseValidator';
import { getRelevantRules, formatRulesForPrompt } from './knowledge/exerciseOntology';
// v3.1: Volume Counter em Tempo Real
import { initializeVolumeCounter, addSetsToCounter, adjustSetsToFitMRV, validateFinalVolume, getDefaultMuscleForPattern, type VolumeCounter } from './volumeCounter';
// v3.1.2: Pattern Validator - Prevenir padrões consecutivos
import { validateConsecutivePatterns, extractPatternsFromWorkout, formatValidationResult } from './validation/patternValidator';
// v3.2: Workout Validator - Duplicatas e cobertura muscular
import { validateNoDuplicatesInDay, validateMuscleCoverage, removeDuplicatesFromDay, type MuscleCoverageResult } from './validation/workoutValidator';
// v3.2: Exercise Blacklist - Contexto de treino (academia vs. casa)
import { filterByContext, prioritizeByContext, type ContextFilterOptions } from './knowledge/exerciseBlacklist';
import { evaluateExerciseTier } from './knowledge/exerciseTiering';

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

// ============ CONFIGURAÇÃO ============

// Multipliers por nível (baseado em knowledge/volume.ts)
const LEVEL_MULTIPLIERS: Record<string, { volume: number; intensity: number }> = {
    'iniciante': { volume: 0.6, intensity: 0.8 },      // -40% volume, -20% intensidade
    'idoso': { volume: 0.5, intensity: 0.7 },          // -50% volume, -30% intensidade (SEGURANÇA)
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

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractContextExceptions(goal: string, observations?: string): string[] {
    const text = normalizeText(`${goal || ''} ${observations || ''}`);
    const exceptions: string[] = [];

    // Exceções explícitas por intenção do personal/aluno
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

    setWorkoutContext({
        clientName: name,
        level,
        goal,
        injuries: injuries || '',
        observations: observations || '',
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

    // Config p-queue: 5 concurrent para não estourar Groq rate limit (30 req/min)
    const queue = new PQueue({
        concurrency: 3,        // Reduced from 5 to avoid Groq rate limits
        interval: 90000,       // Increased from 60s to 90s  
        intervalCap: 20        // Reduced from 25 to be more conservative
    });

    let processedCount = 0;

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
                        score: calculateScore(ex, task.slot, parsedInjuries, level, goal)
                    }));

                    // Ordenar por score
                    scoredCandidates.sort((a, b) => b.score - a.score);
                    const topCandidates = scoredCandidates.slice(0, 5);

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

    const variationResult = applyIntelligentVariation(resolvedDays, Math.min(3, resolvedDays.length));
    const variedResolvedDays = variationResult.days;
    if (variationResult.replacements > 0) {
        debugLog(`[TrainingEngine] Intelligent variation replacements: ${variationResult.replacements}`);
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
            variation_replacements: variationResult.replacements
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
        score: calculateScore(ex, slot, injuries, level, goal)
    }));

    // Ordena por score e pega top N
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, CANDIDATES_PER_SLOT);
}

function calculateScore(ex: Exercise, slot: TrainingSlot, injuries: Injury[], level: string, goal: string): number {
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

    // Tier list por padrão de movimento + objetivo
    const tierEval = evaluateExerciseTier(ex.name, slot.movement_pattern, goal);
    score += tierEval.score;

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

function normalizeExerciseName(name: string): string {
    return normalizeText(name);
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

// ============ SELEÇÃO COM IA (NEURO-SIMBÓLICA v3.0) ============

// Contexto completo para o sistema neuro-simbólico
let currentWorkoutContext: {
    clientName: string;
    level: string;
    goal: string;
    injuries: string;
    observations: string;
    specialConditions: SpecialCondition[];
    // v3.0: Dados expandidos
    age?: number;
    conditions: Array<{ type: string; location?: string; notes?: string }>;
    restrictions: BiomechanicalRestrictions;
    biomechProfile: BiomechanicalProfile;
} | null = null;

export function setWorkoutContext(context: typeof currentWorkoutContext) {
    currentWorkoutContext = context;
}

// v3.0: Contador de retries para logging
let aiRetryCount = 0;
const MAX_AI_RETRIES = 2;

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
        specialConditions: [] as SpecialCondition[],
        conditions: [],
        restrictions: {
            avoid_axial_load: false,
            avoid_spinal_shear: false,
            avoid_knee_shear: false,
            avoid_deep_knee_flexion: false,
            avoid_shoulder_overhead: false,
            avoid_spinal_flexion: false,
            avoid_spinal_rotation: false,
            avoid_hip_impact: false,
            max_impact_level: 'high' as const,
            requires_supervision: false,
            prefer_machines: false,
            volume_modifier: 1.0,
            intensity_modifier: 1.0
        },
        biomechProfile: {} as BiomechanicalProfile
    };

    // v3.0: Preparar contexto completo para o prompt builder
    const clientContext: ClientContext = {
        name: ctx.clientName,
        age: ctx.age,
        level: ctx.level,
        goal: ctx.goal,
        injuries: ctx.injuries,
        observations: ctx.observations,
        conditions: ctx.conditions || [],
        specialConditions: ctx.specialConditions || [],
        restrictions: ctx.restrictions,
        biomechProfile: ctx.biomechProfile
    };

    // v3.0: Buscar regras EXMO relevantes (RAG)
    const relevantRules = getRelevantRules({
        conditions: ctx.conditions || [],
        specialConditions: ctx.specialConditions || [],
        age: ctx.age,
        level: ctx.level,
        goal: ctx.goal
    });
    const rulesContext = formatRulesForPrompt(relevantRules);

    // v3.0: Construir prompts dinâmicos
    const systemPrompt = buildDynamicSystemPrompt(clientContext) + rulesContext;

    const candidatesList = candidates.map((c, i) => ({
        num: i + 1,
        name: c.exercise.name,
        equipment: c.exercise.equipment?.join(', ') || 'variado',
        is_machine: c.exercise.is_machine,
        is_compound: c.exercise.is_compound,
        spinal_load: c.exercise.spinal_load
    }));

    const userPrompt = buildUserPrompt(
        clientContext,
        {
            movement_pattern: slot.movement_pattern,
            target_muscle: slot.target_muscles?.[0],
            intensity: slot.intensity,
            candidateCount: candidates.length
        },
        candidatesList
    );

    // v3.0: Loop de retry com validação
    for (let attempt = 0; attempt <= MAX_AI_RETRIES; attempt++) {
        try {
            const result = await aiRouter.execute({
                action: 'training_intent',
                prompt: `${systemPrompt}\n\n${userPrompt}`,
                metadata: {
                    slot_id: slot.id,
                    type: 'exercise_selection_v3',
                    client_level: ctx.level,
                    client_goal: ctx.goal,
                    has_injuries: ctx.injuries !== 'Nenhuma' && ctx.injuries !== '',
                    conditions_count: (ctx.conditions || []).length,
                    attempt: attempt + 1,
                    rules_injected: relevantRules.length
                }
            });

            if (result.success && result.text) {
                // v3.0: VALIDAÇÃO SIMBÓLICA
                const validation = validateAIResponse(
                    result.text,
                    candidates.map(c => c.exercise),
                    {
                        conditions: ctx.conditions || [],
                        restrictions: ctx.restrictions,
                        biomechProfile: ctx.biomechProfile,
                        level: ctx.level,
                        goal: ctx.goal
                    }
                );

                if (validation.valid && validation.selectedExercise) {
                    // ✅ Resposta válida!
                    debugLog(`[AI v3.0] ✅ Selected ${validation.selectedExercise.name}: ${validation.response?.reasoning || 'No reason'}`);
                    if (validation.warnings.length > 0) {
                        debugLog(`[AI v3.0] ⚠️ Warnings: ${validation.warnings.join(', ')}`);
                    }
                    aiRetryCount = 0;
                    return validation.selectedExercise;
                } else {
                    // ❌ Validação falhou
                    console.warn(`[AI v3.0] ❌ Validation failed (attempt ${attempt + 1}/${MAX_AI_RETRIES + 1}):`);
                    validation.violations.forEach(v => console.warn(`  - ${v}`));

                    // Se é última tentativa, buscar alternativa segura
                    if (attempt === MAX_AI_RETRIES) {
                        debugLog('[AI v3.0] 🔄 Finding safe alternative...');
                        const safeAlternative = findSafeAlternative(
                            candidates.map(c => c.exercise),
                            {
                                conditions: ctx.conditions || [],
                                restrictions: ctx.restrictions,
                                biomechProfile: ctx.biomechProfile,
                                level: ctx.level,
                                goal: ctx.goal
                            }
                        );
                        if (safeAlternative) {
                            debugLog(`[AI v3.0] ✅ Safe alternative found: ${safeAlternative.name}`);
                            return safeAlternative;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`[AI v3.0] Error in attempt ${attempt + 1}:`, error);
        }
    }

    // Fallback final: melhor do ranking determinístico
    debugLog('[AI v3.0] 🔙 Using deterministic fallback (top candidate)');
    return candidates[0].exercise;
}

// ============ HELPERS ============

function normalizeLevel(level: string): 'iniciante' | 'intermediario' | 'avancado' | 'atleta' {
    const l = level.toLowerCase();
    if (l.includes('inic')) return 'iniciante';
    if (l.includes('inter')) return 'intermediario';
    if (l.includes('avanc')) return 'avancado';
    if (l.includes('atlet')) return 'atleta';
    return 'intermediario';
}

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
