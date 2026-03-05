// Groq Provider - multi-model via Edge Function
// Default provider for transactional AI tasks

import type { AIProvider, ProviderRequest, ProviderResponse } from '../types';
import { supabase } from '../../supabaseCore';
import { buildEdgeAuthHeaders } from './edgeHeaders';

// Supabase URL for Edge Function
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
const GROQ_PROXY_URL = `${SUPABASE_URL}/functions/v1/groq-proxy`;
const GROQ_OPERATIONAL_MODEL = ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_MODEL_OPERATIONAL) || 'openai/gpt-oss-20b').trim();

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

function normalizeModelName(model: string | undefined | null, fallback: string): string {
    const normalized = (model || '').trim();
    return normalized || fallback;
}

function safeJsonParse(text: string): any | null {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

async function getAuthHeaders(): Promise<Record<string, string> | null> {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return buildEdgeAuthHeaders(session?.access_token, SUPABASE_ANON_KEY);
}

export const groqProvider: AIProvider = {
    name: 'groq',

    isAvailable(): boolean {
        return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
    },

    async execute(request: ProviderRequest): Promise<ProviderResponse> {
        const startTime = Date.now();
        const tokensInput = estimateTokens(request.prompt);
        const requestedModel = normalizeModelName(request.modelOverride, GROQ_OPERATIONAL_MODEL);

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return {
                success: false,
                text: null,
                provider: 'groq',
                model: requestedModel,
                latencyMs: 0,
                error: 'Supabase URL or anon key not configured'
            };
        }

        try {
            if (isDev) console.log('🚀 Calling Groq via Edge Function...');
            const authHeaders = await getAuthHeaders();
            if (!authHeaders) {
                return {
                    success: false,
                    text: null,
                    provider: 'groq',
                    model: requestedModel,
                    latencyMs: Date.now() - startTime,
                    tokensInput,
                    error: 'User session not found'
                };
            }

            const response = await fetch(GROQ_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    prompt: request.prompt,
                    action: request.action,
                    model: requestedModel
                }),
            });

            const latencyMs = Date.now() - startTime;

            if (!response.ok) {
                const errorText = await response.text();
                const parsed = safeJsonParse(errorText);
                const proxyCode = parsed?.code || parsed?.errorCode || parsed?.error || 'proxy_error';
                const proxyMessage = parsed?.details || parsed?.message || parsed?.error || errorText;
                console.warn('❌ Groq proxy failed:', response.status, proxyCode, proxyMessage);

                return {
                    success: false,
                    text: null,
                    provider: 'groq',
                    model: requestedModel,
                    latencyMs,
                    tokensInput,
                    error: `HTTP ${response.status} [${proxyCode}]: ${proxyMessage}`
                };
            }

            const data = await response.json();

            if (data.success && data.text) {
                const tokensOutput = estimateTokens(data.text);
                if (isDev) console.log(`✅ Groq succeeded (${latencyMs}ms)`);

                return {
                    success: true,
                    text: data.text,
                    provider: 'groq',
                    model: data.model || 'llama-3.1-8b-instant',
                    latencyMs,
                    tokensInput,
                    tokensOutput
                };
            } else {
                return {
                    success: false,
                    text: null,
                    provider: 'groq',
                    model: requestedModel,
                    latencyMs,
                    tokensInput,
                    error: data.error || 'Unknown error'
                };
            }

        } catch (error: any) {
            const latencyMs = Date.now() - startTime;
            console.error('❌ Error calling Groq proxy:', error?.message);

            return {
                success: false,
                text: null,
                provider: 'groq',
                model: requestedModel,
                latencyMs,
                tokensInput,
                error: error?.message || 'Network error'
            };
        }
    }
};

export default groqProvider;
