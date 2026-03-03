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
export class AIRouter {
    private routing: RoutingRule[];
    private providers: Record<string, AIProvider>;

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

        // Try primary provider
        const primaryProvider = this.providers[rule.primaryProvider];

        if (primaryProvider?.isAvailable()) {
            const result = await primaryProvider.execute(request);

            if (result.success) {
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
                    fallback_used: false,
                    metadata: request.metadata
                });

                return { ...result, fallbackUsed: false };
            }

            // Primary failed, try fallbacks
            console.warn(`Primary provider ${rule.primaryProvider} failed:`, result.error);
        }

        // Try fallback chain
        for (const fallbackName of rule.fallbackProviders) {
            const fallbackProvider = this.providers[fallbackName];

            if (fallbackProvider?.isAvailable()) {
                const result = await fallbackProvider.execute(request);

                if (result.success) {
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
                        fallback_used: true,
                        fallback_provider: fallbackName,
                        metadata: request.metadata
                    });

                    return { ...result, fallbackUsed: true };
                }
            }
        }

        // All providers failed
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
            metadata: request.metadata
        });

        return {
            success: false,
            text: null,
            provider: 'none',
            model: 'none',
            latencyMs: 0,
            error: 'All providers failed',
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

    const parsedInjuries = parseInjuries(injuries);

    const prompt = `Você é um personal trainer de elite. Crie um programa de treino PERSONALIZADO.

===== PERFIL =====
NOME: ${clientData.name}
OBJETIVO: ${clientData.goal}
NÍVEL: ${clientData.level}
FREQUÊNCIA: ${clientData.days} dias/semana
ADERÊNCIA: ${adherence}%
DURAÇÃO: ${sessionDuration} min

===== RESTRIÇÕES =====
LESÕES: ${injuries}
PREFERÊNCIAS: ${preferences}
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
            clientName: clientData.name,
            goal: clientData.goal,
            days: clientData.days
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

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
    return groqProvider.isAvailable() || geminiProvider.isAvailable() || localProvider.isAvailable();
}

// Re-export types
export * from './types';
