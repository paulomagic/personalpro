// Groq Provider - LLaMA 3.1 8B via Edge Function
// Default provider for transactional AI tasks

import type { AIProvider, ProviderRequest, ProviderResponse } from '../types';

// Supabase URL for Edge Function
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
const GROQ_PROXY_URL = `${SUPABASE_URL}/functions/v1/groq-proxy`;

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

export const groqProvider: AIProvider = {
    name: 'groq',

    isAvailable(): boolean {
        return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
    },

    async execute(request: ProviderRequest): Promise<ProviderResponse> {
        const startTime = Date.now();
        const tokensInput = estimateTokens(request.prompt);

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return {
                success: false,
                text: null,
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                latencyMs: 0,
                error: 'Supabase URL or anon key not configured'
            };
        }

        try {
            if (isDev) console.log('🚀 Calling Groq via Edge Function...');

            const response = await fetch(GROQ_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    prompt: request.prompt,
                    action: request.action,
                    model: 'llama-3.1-8b-instant'
                }),
            });

            const latencyMs = Date.now() - startTime;

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('❌ Groq proxy failed:', response.status, errorText);

                return {
                    success: false,
                    text: null,
                    provider: 'groq',
                    model: 'llama-3.1-8b-instant',
                    latencyMs,
                    tokensInput,
                    error: `HTTP ${response.status}: ${errorText}`
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
                    model: 'llama-3.1-8b-instant',
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
                model: 'llama-3.1-8b-instant',
                latencyMs,
                tokensInput,
                error: error?.message || 'Network error'
            };
        }
    }
};

export default groqProvider;
