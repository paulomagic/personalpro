// AI Types - Contratos para providers
// Schema validation com tipos estritos

import { z } from 'zod';

// ============ MOVEMENT PATTERNS ============
export const MovementPatternSchema = z.enum([
    'empurrar_horizontal',
    'empurrar_vertical',
    'puxar_horizontal',
    'puxar_vertical',
    'agachar',
    'hinge',
    'core'
]);

export type MovementPattern = z.infer<typeof MovementPatternSchema>;

// ============ TRAINING INTENT ============
// O que a IA retorna (intenção, não exercício)
export const TrainingIntentSchema = z.object({
    movement_pattern: MovementPatternSchema,
    primary_muscle: z.string(),
    sets: z.number().min(1).max(10),
    reps: z.string(),
    rest: z.string(),
    method: z.string().optional(),
    notes: z.string().optional()
});

export type TrainingIntent = z.infer<typeof TrainingIntentSchema>;

// ============ AI RESPONSE ============
export const AIIntentResponseSchema = z.object({
    title: z.string(),
    objective: z.string(),
    splits: z.array(z.object({
        name: z.string(),
        focus: z.string(),
        intentions: z.array(TrainingIntentSchema)
    }))
});

export type AIIntentResponse = z.infer<typeof AIIntentResponseSchema>;

// ============ PROVIDER INTERFACE ============
export type ActionType =
    | 'training_intent'    // Geração de intenção biomecânica
    | 'analyze_progress'   // Análise profunda de progresso
    | 'insight'            // Insights personalizados
    | 'message'            // Geração de mensagens
    | 'refine';            // Refinamento de treino

export interface ProviderRequest {
    action: ActionType;
    prompt: string;
    metadata?: Record<string, any>;
}

export interface ProviderResponse {
    success: boolean;
    text: string | null;
    provider: string;
    model: string;
    latencyMs: number;
    tokensInput?: number;
    tokensOutput?: number;
    error?: string;
}

export interface AIProvider {
    name: string;
    isAvailable(): boolean;
    execute(request: ProviderRequest): Promise<ProviderResponse>;
}

// ============ ROUTER CONFIG ============
export interface RoutingRule {
    action: ActionType;
    primaryProvider: string;
    fallbackProviders: string[];
}

export const DEFAULT_ROUTING: RoutingRule[] = [
    { action: 'training_intent', primaryProvider: 'groq', fallbackProviders: ['local'] },
    { action: 'analyze_progress', primaryProvider: 'gemini', fallbackProviders: [] },
    { action: 'insight', primaryProvider: 'gemini', fallbackProviders: ['groq'] },
    { action: 'message', primaryProvider: 'groq', fallbackProviders: ['local'] },
    { action: 'refine', primaryProvider: 'groq', fallbackProviders: ['gemini', 'local'] }
];

// ============ LOGGING ============
export interface AILogEntry {
    action_type: ActionType;
    provider_used: string;
    model_name: string;
    prompt: string;
    response: string | null;
    tokens_input?: number;
    tokens_output?: number;
    latency_ms: number;
    success: boolean;
    schema_valid?: boolean;
    rejection_reason?: string;
    fallback_used: boolean;
    fallback_provider?: string;
    error_message?: string;
    metadata?: Record<string, any>;
}

// ============ CLIENT DATA ============
export interface TrainingIntentRequest {
    name: string;
    goal: string;
    level: string;
    days: number;
    injuries?: string;
    preferences?: string;
    adherence?: number;
    equipment?: string[];
    sessionDuration?: number;
}

// ============ VALIDATION HELPERS ============
export function validateIntentResponse(data: unknown): {
    valid: boolean;
    data?: AIIntentResponse;
    error?: string;
} {
    const result = AIIntentResponseSchema.safeParse(data);
    if (result.success) {
        return { valid: true, data: result.data };
    }
    return {
        valid: false,
        error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    };
}

// ============ INJURY TYPES ============
export type Injury = 'ombro' | 'joelho' | 'coluna' | 'cotovelo' | 'punho';

export function parseInjuries(injuriesText?: string): Injury[] {
    if (!injuriesText || injuriesText.toLowerCase() === 'nenhuma') return [];

    const injuries: Injury[] = [];
    const text = injuriesText.toLowerCase();

    if (text.includes('ombro')) injuries.push('ombro');
    if (text.includes('joelho')) injuries.push('joelho');
    if (text.includes('coluna') || text.includes('costas') || text.includes('lombar') || text.includes('hérnia')) {
        injuries.push('coluna');
    }
    if (text.includes('cotovelo')) injuries.push('cotovelo');
    if (text.includes('punho') || text.includes('pulso')) injuries.push('punho');

    return injuries;
}
