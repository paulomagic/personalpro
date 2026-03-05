// AI Router - Central orchestrator for multi-provider AI
// Handles routing, fallback chains, and logging

import type {
    AIProvider,
    ProviderRequest,
    ProviderResponse,
    ActionType,
    RoutingRule,
    AILogEntry,
    TrainingIntentRequest,
    AIIntentResponse
} from './types';
import { DEFAULT_ROUTING, validateIntentResponse, parseInjuries } from './types';
import { groqProvider } from './providers/groqProvider';
import { geminiProvider } from './providers/geminiProvider';
import { localProvider } from './providers/localProvider';
import { supabase } from '../supabaseClient';
import { resolveExercise, type Exercise, type Equipment } from '../exerciseService';
import { classifyInjuryConstraints, pseudonymizeClientName, summarizePreferenceTags } from './promptPrivacy';
import {
    ExerciseReplacementSchema,
    extractLikelyJson,
    formatSchemaError,
    RefinedWorkoutSchema
} from './responseSchemas';

// ============ PROVIDER REGISTRY ============
const providers: Record<string, AIProvider> = {
    groq: groqProvider,
    gemini: geminiProvider,
    local: localProvider
};

// ============ LOGGING ============
function redactSensitiveText(value?: string | null): string | null {
    if (!value) return null;

    return value
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
        .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, '[REDACTED_PHONE]')
        .slice(0, 2000);
}

async function logAIAction(entry: AILogEntry): Promise<void> {
    if (!supabase) return;

    try {
        // Get current user id for RLS filtering
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id ?? null;

        await supabase.from('ai_logs').insert({
            user_id: userId,
            action_type: entry.action_type,
            provider_used: entry.provider_used,
            model_used: entry.model_name,
            prompt: redactSensitiveText(entry.prompt),
            response: redactSensitiveText(entry.response),
            tokens_input: entry.tokens_input,
            tokens_output: entry.tokens_output,
            latency_ms: entry.latency_ms,
            success: entry.success,
            error_message: redactSensitiveText(entry.error_message),
            metadata: {
                schema_valid: entry.schema_valid,
                rejection_reason: entry.rejection_reason,
                fallback_used: entry.fallback_used,
                fallback_provider: entry.fallback_provider,
                ...entry.metadata
            }
        });
    } catch (error) {
        console.warn('Failed to log AI action:', error);
    }
}

// ============ ROUTER ============
interface ModelCandidate {
    providerName: string;
    model: string;
    reason: string;
}

const DECOMMISSIONED_MODEL_FALLBACKS: Record<string, string> = {
    'deepseek-r1-distill-llama-70b': 'llama-3.3-70b-versatile'
};

function resolveGroqModel(envValue: string | undefined, fallback: string): string {
    const normalized = (envValue || '').trim();
    const resolved = normalized || fallback;
    return DECOMMISSIONED_MODEL_FALLBACKS[resolved] || resolved;
}

const GROQ_MODELS = {
    operational: resolveGroqModel(
        typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GROQ_MODEL_OPERATIONAL : undefined,
        'openai/gpt-oss-20b'
    ),
    reasoning: resolveGroqModel(
        typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GROQ_MODEL_REASONING : undefined,
        'llama-3.3-70b-versatile'
    ),
    fallback: resolveGroqModel(
        typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GROQ_MODEL_FALLBACK : undefined,
        'qwen/qwen3-32b'
    ),
    narrative: resolveGroqModel(
        typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GROQ_MODEL_NARRATIVE : undefined,
        'llama-3.3-70b-versatile'
    )
} as const;

const TRAINING_ACTIONS = new Set<ActionType>(['training_intent', 'refine', 'regenerate_exercise']);

export class AIRouter {
    private routing: RoutingRule[];
    private providers: Record<string, AIProvider>;
    private healthByModel = new Map<string, {
        score: number;
        consecutiveFailures: number;
        circuitOpenUntil: number;
        lastError?: string;
        lastUsedAt?: number;
    }>();

    constructor(
        customRouting?: RoutingRule[],
        customProviders?: Record<string, AIProvider>
    ) {
        this.routing = customRouting || DEFAULT_ROUTING;
        this.providers = customProviders || providers;
    }

    // Get routing rule for action
    private getRoutingRule(action: ActionType): RoutingRule | undefined {
        return this.routing.find(r => r.action === action);
    }

    private getModelKey(providerName: string, model: string): string {
        return `${providerName}:${model}`;
    }

    private getHealthState(providerName: string, model: string) {
        const key = this.getModelKey(providerName, model);
        let state = this.healthByModel.get(key);
        if (!state) {
            state = { score: 0, consecutiveFailures: 0, circuitOpenUntil: 0 };
            this.healthByModel.set(key, state);
        }
        return state;
    }

    private isCircuitOpen(providerName: string, model: string): boolean {
        const state = this.getHealthState(providerName, model);
        return state.circuitOpenUntil > Date.now();
    }

    private markSuccess(providerName: string, model: string): void {
        const state = this.getHealthState(providerName, model);
        state.score = Math.min(20, state.score + 2);
        state.consecutiveFailures = 0;
        state.circuitOpenUntil = 0;
        state.lastError = undefined;
        state.lastUsedAt = Date.now();
    }

    private markFailure(providerName: string, model: string, errorMessage?: string): void {
        const state = this.getHealthState(providerName, model);
        const error = String(errorMessage || '').toLowerCase();
        const isRateLimit = error.includes('429') || error.includes('rate');
        const isModelDecommissioned = error.includes('model_decommissioned') || error.includes('decommissioned');
        const isModelNotFound = error.includes('model_not_found')
            || error.includes('model not found')
            || error.includes('does not exist');

        state.score = Math.max(-20, state.score - (isRateLimit ? 4 : (isModelNotFound || isModelDecommissioned) ? 8 : 2));
        state.consecutiveFailures += 1;
        state.lastError = errorMessage;
        state.lastUsedAt = Date.now();

        if (isModelNotFound || isModelDecommissioned || isRateLimit || state.consecutiveFailures >= 3) {
            const cooldownMs = (isModelNotFound || isModelDecommissioned) ? 10 * 60_000 : isRateLimit ? 30_000 : 10_000;
            state.circuitOpenUntil = Date.now() + cooldownMs;
        }
    }

    private isHeavyReasoningRequest(request: ProviderRequest): boolean {
        const metadata = request.metadata || {};
        if (request.action === 'analyze_progress') return true;
        if (metadata.requiresReasoning === true || metadata.useDeepReasoning === true) return true;
        return request.prompt.length >= 4200;
    }

    private isNarrativeRequest(request: ProviderRequest): boolean {
        const metadata = request.metadata || {};
        return request.action === 'message'
            || metadata.responseStyle === 'narrative'
            || metadata.copyMode === true;
    }

    private buildCandidateChain(request: ProviderRequest, rule: RoutingRule): ModelCandidate[] {
        const heavyReasoning = this.isHeavyReasoningRequest(request);
        const narrative = this.isNarrativeRequest(request);

        const baseGroqChain: ModelCandidate[] = heavyReasoning
            ? [
                { providerName: 'groq', model: GROQ_MODELS.reasoning, reason: 'reasoning_primary' },
                { providerName: 'groq', model: GROQ_MODELS.operational, reason: 'reasoning_to_operational' },
                { providerName: 'groq', model: GROQ_MODELS.fallback, reason: 'reasoning_fallback' }
            ]
            : narrative
                ? [
                    { providerName: 'groq', model: GROQ_MODELS.narrative, reason: 'narrative_primary' },
                    { providerName: 'groq', model: GROQ_MODELS.fallback, reason: 'narrative_fallback' },
                    { providerName: 'groq', model: GROQ_MODELS.operational, reason: 'narrative_operational' }
                ]
                : [
                    { providerName: 'groq', model: GROQ_MODELS.operational, reason: 'operational_primary' },
                    { providerName: 'groq', model: GROQ_MODELS.reasoning, reason: 'operational_reasoning' },
                    { providerName: 'groq', model: GROQ_MODELS.fallback, reason: 'operational_fallback' }
                ];

        const candidateChain = [...baseGroqChain];

        if (rule.primaryProvider === 'gemini' || rule.fallbackProviders.includes('gemini')) {
            candidateChain.push({ providerName: 'gemini', model: 'gemini-2.0-flash', reason: 'provider_fallback' });
        }

        if (TRAINING_ACTIONS.has(request.action) || rule.primaryProvider === 'local' || rule.fallbackProviders.includes('local')) {
            candidateChain.push({ providerName: 'local', model: 'smart-generator-v1', reason: 'deterministic_last_resort' });
        }

        // Deduplicate provider:model preserving order.
        const unique = new Set<string>();
        return candidateChain.filter((candidate) => {
            const key = this.getModelKey(candidate.providerName, candidate.model);
            if (unique.has(key)) return false;
            unique.add(key);
            return true;
        });
    }

    // Execute with fallback chain
    async execute(request: ProviderRequest): Promise<ProviderResponse & { fallbackUsed: boolean }> {
        const rule = this.getRoutingRule(request.action);

        if (!rule) {
            console.warn(`No routing rule for action: ${request.action}`);
            return {
                success: false,
                text: null,
                provider: 'none',
                model: 'none',
                latencyMs: 0,
                error: `No routing rule for action: ${request.action}`,
                fallbackUsed: false
            };
        }

        const chain = this.buildCandidateChain(request, rule);
        const attemptFailures: Array<{ provider: string; model: string; reason: string; error?: string }> = [];
        let skipRemainingGroqForThisRequest = false;

        for (let i = 0; i < chain.length; i++) {
            const candidate = chain[i];
            const provider = this.providers[candidate.providerName];

            if (skipRemainingGroqForThisRequest && candidate.providerName === 'groq') {
                attemptFailures.push({
                    provider: candidate.providerName,
                    model: candidate.model,
                    reason: `${candidate.reason}:skip_after_rate_limit`
                });
                continue;
            }

            if (!provider?.isAvailable()) {
                attemptFailures.push({
                    provider: candidate.providerName,
                    model: candidate.model,
                    reason: `${candidate.reason}:provider_unavailable`
                });
                continue;
            }

            if (this.isCircuitOpen(candidate.providerName, candidate.model)) {
                attemptFailures.push({
                    provider: candidate.providerName,
                    model: candidate.model,
                    reason: `${candidate.reason}:circuit_open`
                });
                continue;
            }

            const result = await provider.execute({
                ...request,
                modelOverride: candidate.providerName === 'local' ? undefined : candidate.model
            });

            if (result.success) {
                this.markSuccess(candidate.providerName, candidate.model);
                const currentHealth = this.getHealthState(candidate.providerName, candidate.model);
                await logAIAction({
                    action_type: request.action,
                    provider_used: result.provider,
                    model_name: result.model,
                    prompt: request.prompt,
                    response: result.text,
                    tokens_input: result.tokensInput,
                    tokens_output: result.tokensOutput,
                    latency_ms: result.latencyMs,
                    success: true,
                    fallback_used: i > 0,
                    fallback_provider: i > 0 ? candidate.providerName : undefined,
                    metadata: {
                        ...request.metadata,
                        routingReason: candidate.reason,
                        modelHealthScore: currentHealth.score,
                        attempts: attemptFailures
                    }
                });

                return { ...result, fallbackUsed: i > 0 };
            }

            this.markFailure(candidate.providerName, candidate.model, result.error);
            attemptFailures.push({
                provider: candidate.providerName,
                model: candidate.model,
                reason: candidate.reason,
                error: result.error
            });

            const normalizedError = String(result.error || '').toLowerCase();
            if (candidate.providerName === 'groq' && (normalizedError.includes('429') || normalizedError.includes('rate_limit'))) {
                skipRemainingGroqForThisRequest = true;
            }
        }

        // All attempts failed
        await logAIAction({
            action_type: request.action,
            provider_used: 'none',
            model_name: 'none',
            prompt: request.prompt,
            response: null,
            latency_ms: 0,
            success: false,
            fallback_used: true,
            error_message: 'All providers failed',
            metadata: {
                ...request.metadata,
                attempts: attemptFailures
            }
        });

        return {
            success: false,
            text: null,
            provider: 'none',
            model: 'none',
            latencyMs: 0,
            error: `All providers failed: ${attemptFailures.map((item) => `${item.provider}:${item.model}:${item.reason}`).join(' | ')}`,
            fallbackUsed: true
        };
    }
}

// ============ SINGLETON INSTANCE ============
export const aiRouter = new AIRouter();

// ============ HIGH-LEVEL FUNCTIONS ============

function mapEquipmentToResolver(equipment?: string[]): Equipment[] | undefined {
    if (!equipment || equipment.length === 0) return undefined;

    const normalized = equipment
        .map(item => item.toLowerCase().trim())
        .join(' ');

    // "Academia completa" means all progressive load options are available.
    if (normalized.includes('academia completa')) {
        return ['maquina', 'cabo', 'halter', 'barra'];
    }

    const mapped = new Set<Equipment>();
    equipment.forEach(item => {
        const lower = item.toLowerCase();
        if (lower.includes('maquin')) mapped.add('maquina');
        if (lower.includes('cabo')) mapped.add('cabo');
        if (lower.includes('halter')) mapped.add('halter');
        if (lower.includes('barra')) mapped.add('barra');
        if (lower.includes('peso') || lower.includes('corporal') || lower.includes('calisten')) mapped.add('peso_corporal');
    });

    return mapped.size > 0 ? Array.from(mapped) : undefined;
}

/**
 * Generate training intent
 * IA returns intentions → system resolves to exercises
 */
export async function generateTrainingIntent(
    clientData: TrainingIntentRequest
): Promise<{
    success: boolean;
    title: string;
    objective: string;
    splits: Array<{
        name: string;
        focus: string;
        exercises: Array<{
            exercise: Exercise;
            sets: number;
            reps: string;
            rest: string;
            method?: string;
            notes?: string;
        }>;
    }>;
    provider: string;
    fallbackUsed: boolean;
} | null> {
    const injuries = clientData.injuries || 'Nenhuma';
    const preferences = clientData.preferences || 'Não especificadas';
    const adherence = clientData.adherence || 80;
    const equipment = clientData.equipment?.join(', ') || 'Academia completa';
    const sessionDuration = clientData.sessionDuration || 60;
    const clientAlias = pseudonymizeClientName(clientData.name);
    const injuryProfile = classifyInjuryConstraints(injuries);
    const preferenceProfile = summarizePreferenceTags(preferences);

    const parsedInjuries = parseInjuries(injuries);

    const prompt = `Você é um personal trainer de elite. Crie um programa de treino PERSONALIZADO.

===== PERFIL =====
ID_ALUNO: ${clientAlias}
OBJETIVO: ${clientData.goal}
NÍVEL: ${clientData.level}
FREQUÊNCIA: ${clientData.days} dias/semana
ADERÊNCIA: ${adherence}%
DURAÇÃO: ${sessionDuration} min

===== RESTRIÇÕES =====
CATEGORIAS_DE_RESTRIÇÃO: ${injuryProfile}
PREFERÊNCIAS_CATEGORIZADAS: ${preferenceProfile}
EQUIPAMENTOS: ${equipment}

===== INSTRUÇÕES CRÍTICAS =====
Você NÃO deve retornar nomes de exercícios.
Retorne apenas INTENÇÕES BIOMECÂNICAS que o sistema vai resolver.
Se houver academia completa/equipamentos completos, EVITE intenções que normalmente resultem em
exercícios exclusivamente com peso corporal (ex: flexão), exceto para core, aquecimento ou reabilitação.

Padrões de movimento disponíveis:
- empurrar_horizontal (supino, flexão)
- empurrar_vertical (desenvolvimento)
- puxar_horizontal (remada)
- puxar_vertical (puxada)
- agachar (agachamento, leg press)
- hinge (stiff, terra, hip thrust)
- core (prancha, abdominal)

Músculos principais:
- peito, ombro, costas, quadriceps, posterior_coxa, gluteos, core

EVITE padrões que agravam: ${injuries}

Responda APENAS com JSON puro:
{
  "title": "Nome do Protocolo",
  "objective": "Estratégia geral",
  "splits": [
    {
      "name": "Treino A",
      "focus": "Superior - Push",
      "intentions": [
        {
          "movement_pattern": "empurrar_horizontal",
          "primary_muscle": "peito",
          "sets": 4,
          "reps": "8-12",
          "rest": "60s",
          "method": "simples",
          "notes": "Foco em contração"
        }
      ]
    }
  ]
}

Crie ${clientData.days} splits com 5-7 intenções cada.`;

    const result = await aiRouter.execute({
        action: 'training_intent',
        prompt,
        metadata: {
            clientName: clientAlias,
            goal: clientData.goal,
            days: clientData.days,
            injuryProfile,
            preferenceProfile
        }
    });

    if (!result.success || !result.text) {
        return null;
    }

    // Parse and validate JSON
    let cleanText = result.text.trim()
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/gi, '')
        .trim();

    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
    }
    cleanText = cleanText
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');

    try {
        const parsed = JSON.parse(cleanText);
        const resolverEquipment = mapEquipmentToResolver(clientData.equipment);

        // Validate schema
        const validation = validateIntentResponse(parsed);

        if (!validation.valid) {
            await logAIAction({
                action_type: 'training_intent',
                provider_used: result.provider,
                model_name: result.model,
                prompt: prompt.substring(0, 300) + '...',
                response: cleanText.substring(0, 500),
                latency_ms: result.latencyMs,
                success: false,
                schema_valid: false,
                rejection_reason: validation.error,
                fallback_used: result.fallbackUsed
            });
            return null;
        }

        const aiResponse = validation.data as AIIntentResponse;

        // Resolve intentions to exercises
        const resolvedSplits = await Promise.all(
            aiResponse.splits.map(async (split) => {
                const resolvedExercises = await Promise.all(
                    split.intentions.map(async (intention) => {
                        const exercises = await resolveExercise({
                            movement_pattern: intention.movement_pattern,
                            primary_muscle: intention.primary_muscle,
                            goal: clientData.goal,
                            equipment: resolverEquipment,
                            avoid_injuries: parsedInjuries,
                            prefer_compound: true
                        });

                        const exercise = exercises[0] || null;

                        return exercise ? {
                            exercise,
                            sets: intention.sets,
                            reps: intention.reps,
                            rest: intention.rest,
                            method: intention.method,
                            notes: intention.notes
                        } : null;
                    })
                );

                return {
                    name: split.name,
                    focus: split.focus,
                    exercises: resolvedExercises.filter(Boolean) as Array<{
                        exercise: Exercise;
                        sets: number;
                        reps: string;
                        rest: string;
                        method?: string;
                        notes?: string;
                    }>
                };
            })
        );

        // Validate we have exercises
        const hasExercises = resolvedSplits.some(s => s.exercises.length > 0);

        if (!hasExercises) {
            await logAIAction({
                action_type: 'training_intent',
                provider_used: result.provider,
                model_name: result.model,
                prompt: prompt.substring(0, 300) + '...',
                response: cleanText.substring(0, 500),
                latency_ms: result.latencyMs,
                success: false,
                schema_valid: true,
                rejection_reason: 'NO_EXERCISE_MATCH',
                fallback_used: result.fallbackUsed
            });
            return null;
        }

        return {
            success: true,
            title: aiResponse.title,
            objective: aiResponse.objective,
            splits: resolvedSplits,
            provider: result.provider,
            fallbackUsed: result.fallbackUsed
        };

    } catch (parseError: any) {
        await logAIAction({
            action_type: 'training_intent',
            provider_used: result.provider,
            model_name: result.model,
            prompt: prompt.substring(0, 300) + '...',
            response: cleanText?.substring(0, 300),
            latency_ms: result.latencyMs,
            success: false,
            schema_valid: false,
            rejection_reason: `JSON_PARSE_ERROR: ${parseError.message}`,
            fallback_used: result.fallbackUsed
        });
        return null;
    }
}

export async function refineWorkoutWithRouter(
    currentWorkout: any,
    instruction: string
): Promise<any | null> {
    const prompt = `Você é um editor técnico de treinos.

TREINO_ATUAL_JSON:
${JSON.stringify(currentWorkout)}

INSTRUCAO:
${instruction}

Ajuste o treino sem quebrar a estrutura.
Retorne APENAS JSON:
{
  "splits": [ ... ]
}`;

    const result = await aiRouter.execute({
        action: 'refine',
        prompt,
        metadata: {
            mode: 'refine_workout',
            instruction,
            currentWorkout,
            responseStyle: 'structured'
        }
    });

    if (!result.success || !result.text) return null;

    try {
        const cleanText = extractLikelyJson(result.text);
        const parsed = JSON.parse(cleanText);
        const schemaResult = RefinedWorkoutSchema.safeParse(parsed);
        if (!schemaResult.success) {
            console.warn('[AIRouter] refine schema failed:', formatSchemaError(schemaResult.error));
            return null;
        }
        return schemaResult.data;
    } catch {
        return null;
    }
}

export async function regenerateExerciseWithRouter(params: {
    currentExercise: string;
    targetMuscle: string;
    goal: string;
    injuries?: string;
    equipment?: string;
}): Promise<any | null> {
    const injuryProfile = classifyInjuryConstraints(params.injuries);
    const equipment = params.equipment || 'academia_completa';
    const prompt = `Você é um especialista em substituição de exercícios.

CONTEXTO:
- EXERCICIO_ATUAL: ${params.currentExercise}
- MUSCULO_ALVO: ${params.targetMuscle}
- OBJETIVO: ${params.goal}
- RESTRICOES_CATEGORIZADAS: ${injuryProfile}
- EQUIPAMENTO: ${equipment}

Retorne APENAS JSON:
{
  "name": "Nome do exercício",
  "sets": 4,
  "reps": "8-12",
  "rest": "60s",
  "targetMuscle": "${params.targetMuscle}",
  "technique": "Dica curta"
}`;

    const result = await aiRouter.execute({
        action: 'regenerate_exercise',
        prompt,
        metadata: {
            mode: 'regenerate_exercise',
            currentExercise: params.currentExercise,
            targetMuscle: params.targetMuscle,
            goal: params.goal,
            injuryProfile,
            responseStyle: 'structured'
        }
    });

    if (!result.success || !result.text) return null;

    try {
        const cleanText = extractLikelyJson(result.text);
        const parsed = JSON.parse(cleanText);
        const schemaResult = ExerciseReplacementSchema.safeParse(parsed);
        if (!schemaResult.success) {
            console.warn('[AIRouter] regenerate schema failed:', formatSchemaError(schemaResult.error));
            return null;
        }
        return schemaResult.data;
    } catch {
        return null;
    }
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
    return groqProvider.isAvailable() || geminiProvider.isAvailable() || localProvider.isAvailable();
}

// Re-export types
export * from './types';
