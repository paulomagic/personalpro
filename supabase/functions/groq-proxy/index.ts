// Supabase Edge Function: groq-proxy
// Proxies calls to Groq API with model override + fallback
// Default provider for transactional AI tasks
//
// Deploy with: supabase functions deploy groq-proxy
// Set secrets:
//   supabase secrets set GROQ_API_KEY=your-key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildRateLimitHeaders, checkRateLimit } from "../_shared/rateLimit.ts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Models
const MODEL_DEFAULT = Deno.env.get("GROQ_MODEL_DEFAULT") || "openai/gpt-oss-20b";
const MODEL_FALLBACK = Deno.env.get("GROQ_MODEL_FALLBACK") || "qwen/qwen3-32b";

function getAllowedOrigins(): string[] {
    const raw = Deno.env.get("ALLOWED_ORIGINS") || "";
    return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

function buildCorsHeaders(req: Request): Record<string, string> | null {
    const origin = req.headers.get("origin");
    const allowedOrigins = getAllowedOrigins();
    const effectiveOrigins = allowedOrigins.length > 0
        ? allowedOrigins
        : [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174"
        ];
    const allowOrigin = !!origin && effectiveOrigins.includes(origin);

    if (!allowOrigin) return null;

    return {
        "Access-Control-Allow-Origin": origin || "null",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
        "Vary": "Origin",
    };
}

function getClientIp(req: Request): string {
    return req.headers.get("cf-connecting-ip")
        || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || "unknown";
}

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const jwt = authHeader.slice(7);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) return null;

    try {
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${jwt}`,
                "apikey": supabaseAnonKey,
            },
        });

        if (!userResponse.ok) return null;
        const user = await userResponse.json();
        return user?.id || null;
    } catch {
        return null;
    }
}

interface GroqRequest {
    prompt: string;
    action?: string;
    model?: string;
}

interface GroqAPIResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
    error?: {
        message?: string;
        type?: string;
        code?: string;
    };
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
    };
}

interface GroqCallResult {
    text: string | null;
    error: string | null;
    usage?: { in: number; out: number };
    isRateLimit?: boolean;
    isModelNotFound?: boolean;
    statusCode?: number;
    errorCode?: string;
}

// Helper to call Groq API
async function callGroq(
    apiKey: string,
    model: string,
    prompt: string,
    action?: string
): Promise<GroqCallResult> {
    try {
        const isStructuredAction = action === 'training_intent' || action === 'refine';

        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "system",
                        content: "Você é um personal trainer de elite especializado em prescrição de treinos. Responda APENAS em JSON válido quando solicitado."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                // Ações estruturadas exigem mais consistência e menos aleatoriedade.
                temperature: isStructuredAction ? 0.2 : 0.7,
                max_tokens: isStructuredAction ? 1400 : 4096,
            }),
        });

        let data: GroqAPIResponse | null = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        // 429 = Groq rate limit — fail fast, do NOT retry with another model
        // This avoids doubling API pressure (35 slots * 1 attempt vs 35 * 2 = 70 calls)
        if (response.status === 429) {
            return {
                text: null,
                error: data?.error?.message || 'rate_limit_exceeded',
                isRateLimit: true,
                statusCode: 429,
                errorCode: data?.error?.code || data?.error?.type || 'rate_limit_exceeded'
            };
        }

        if (!response.ok) {
            const errorMessage = data?.error?.message || `Groq upstream error (${response.status})`;
            const errorCode = data?.error?.code || data?.error?.type || `http_${response.status}`;
            const normalized = `${errorCode} ${errorMessage}`.toLowerCase();
            const isModelNotFound = response.status === 404
                || normalized.includes('model_not_found')
                || normalized.includes('model not found');

            return {
                text: null,
                error: errorMessage,
                statusCode: response.status,
                errorCode,
                isModelNotFound
            };
        }

        if (data.error) {
            const errorCode = data.error.code || data.error.type || 'groq_error';
            const errorMessage = data.error.message || 'Groq upstream error';
            const normalized = `${errorCode} ${errorMessage}`.toLowerCase();
            return {
                text: null,
                error: errorMessage,
                statusCode: 502,
                errorCode,
                isModelNotFound: normalized.includes('model_not_found') || normalized.includes('model not found')
            };
        }

        const text = data.choices?.[0]?.message?.content || null;
        const usage = data.usage ? {
            in: data.usage.prompt_tokens,
            out: data.usage.completion_tokens
        } : undefined;

        return { text, error: text ? null : 'empty_response', usage, statusCode: 200, errorCode: text ? undefined : 'empty_response' };
    } catch (error) {
        return { text: null, error: String(error), statusCode: 502, errorCode: 'network_error' };
    }
}

serve(async (req: Request) => {
    const corsHeaders = buildCorsHeaders(req);
    if (!corsHeaders) {
        return new Response(
            JSON.stringify({ success: false, error: "Origin not allowed" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
        );
    }

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only allow POST
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
        return new Response(
            JSON.stringify({ success: false, error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const rateKey = `groq-proxy:${userId}:${getClientIp(req)}`;
    const rateResult = await checkRateLimit(rateKey);
    const rateLimitHeaders = buildRateLimitHeaders(rateResult);
    if (!rateResult.allowed) {
        return new Response(
            JSON.stringify({ success: false, error: "Rate limit exceeded" }),
            {
                status: 429,
                headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" }
            }
        );
    }

    const jsonHeaders = { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" };

    try {
        const startTime = Date.now();
        const { prompt, action, model } = (await req.json()) as GroqRequest;

        if (!prompt || typeof prompt !== "string") {
            return new Response(
                JSON.stringify({ success: false, error: "Missing or invalid prompt" }),
                { status: 400, headers: jsonHeaders }
            );
        }

        // Limit prompt size
        if (prompt.length > 30000) {
            return new Response(
                JSON.stringify({ success: false, error: "Prompt too long (max 30000 chars)" }),
                { status: 400, headers: jsonHeaders }
            );
        }

        // Get API key from environment
        const apiKey = Deno.env.get("GROQ_API_KEY");

        if (!apiKey) {
            console.error("[groq-proxy] No Groq API key configured");
            return new Response(
                JSON.stringify({ success: false, error: "AI service not configured" }),
                { status: 500, headers: jsonHeaders }
            );
        }

        let result: GroqCallResult;
        let modelUsed = model || MODEL_DEFAULT;

        // Try primary model
        console.log(`[groq-proxy] Trying ${modelUsed}...`);
        result = await callGroq(apiKey, modelUsed, prompt, action);

        // If rate limited, return 429 immediately — do NOT try fallback model.
        // This avoids doubling the Groq API pressure per workout generation.
        // The client (aiRouter) will fall back to the local deterministic provider.
        if (result.isRateLimit) {
            console.warn(`[groq-proxy] Rate limited by Groq — returning 429 to client (fast fail)`);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'rate_limit_exceeded',
                    code: result.errorCode || 'rate_limit_exceeded',
                    details: result.error,
                    model_attempted: modelUsed
                }),
                { status: 429, headers: jsonHeaders }
            );
        }

        // Try fallback model only when primary failed for non-rate-limit reasons
        if (!result.text && modelUsed !== MODEL_FALLBACK) {
            console.warn(`[groq-proxy] Primary failed: ${result.error}, trying fallback model...`);
            modelUsed = MODEL_FALLBACK;
            result = await callGroq(apiKey, modelUsed, prompt, action);
        }

        const latencyMs = Date.now() - startTime;

        if (result.text) {
            console.log(`[groq-proxy] Success with ${modelUsed} in ${latencyMs}ms (action: ${action || 'unknown'})`);
            return new Response(
                JSON.stringify({
                    success: true,
                    text: result.text,
                    model: modelUsed,
                    latencyMs,
                    tokensInput: result.usage?.in,
                    tokensOutput: result.usage?.out,
                }),
                { status: 200, headers: jsonHeaders }
            );
        } else {
            console.error(`[groq-proxy] All models failed: ${result.error} (code=${result.errorCode || 'unknown'}, status=${result.statusCode || 'n/a'})`);
            const status = result.isModelNotFound
                ? 404
                : result.statusCode && result.statusCode >= 400 && result.statusCode < 500
                    ? result.statusCode
                    : 502;
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "AI generation failed",
                    code: result.errorCode || (result.isModelNotFound ? 'model_not_found' : 'upstream_error'),
                    details: result.error,
                    model_attempted: modelUsed,
                    upstream_status: result.statusCode || null
                }),
                { status, headers: jsonHeaders }
            );
        }
    } catch (error) {
        console.error("[groq-proxy] Unexpected error:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Internal server error" }),
            { status: 500, headers: jsonHeaders }
        );
    }
});
