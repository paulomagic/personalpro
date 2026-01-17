// Gemini Provider - For deep analysis tasks
// Used for progress analysis, complex insights

import type { AIProvider, ProviderRequest, ProviderResponse } from '../types';

// Supabase URL for Edge Function
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
const GEMINI_PROXY_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

export const geminiProvider: AIProvider = {
    name: 'gemini',

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
                provider: 'gemini',
                model: 'gemini-2.0-flash',
                latencyMs: 0,
                error: 'Supabase URL or anon key not configured'
            };
        }

        try {
            if (isDev) console.log('🚀 Calling Gemini via Edge Function...');

            const response = await fetch(GEMINI_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    prompt: request.prompt,
                    action: request.action
                }),
            });

            const latencyMs = Date.now() - startTime;

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('❌ Gemini proxy failed:', response.status, errorText);

                return {
                    success: false,
                    text: null,
                    provider: 'gemini',
                    model: 'gemini-2.0-flash',
                    latencyMs,
                    tokensInput,
                    error: `HTTP ${response.status}: ${errorText}`
                };
            }

            const data = await response.json();

            if (data.success && data.text) {
                const tokensOutput = estimateTokens(data.text);
                if (isDev) console.log(`✅ Gemini succeeded via ${data.model} (${latencyMs}ms)`);

                return {
                    success: true,
                    text: data.text,
                    provider: 'gemini',
                    model: data.model || 'gemini-2.0-flash',
                    latencyMs,
                    tokensInput,
                    tokensOutput
                };
            } else {
                return {
                    success: false,
                    text: null,
                    provider: 'gemini',
                    model: 'gemini-2.0-flash',
                    latencyMs,
                    tokensInput,
                    error: data.error || 'Unknown error'
                };
            }

        } catch (error: any) {
            const latencyMs = Date.now() - startTime;
            console.error('❌ Error calling Gemini proxy:', error?.message);

            return {
                success: false,
                text: null,
                provider: 'gemini',
                model: 'gemini-2.0-flash',
                latencyMs,
                tokensInput,
                error: error?.message || 'Network error'
            };
        }
    }
};

export default geminiProvider;
