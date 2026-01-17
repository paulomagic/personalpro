// Supabase Edge Function: groq-proxy
// Proxies calls to Groq API for LLaMA 3.1 8B
// Default provider for transactional AI tasks
//
// Deploy with: supabase functions deploy groq-proxy
// Set secrets:
//   supabase secrets set GROQ_API_KEY=your-key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Models
const MODEL_DEFAULT = "llama-3.3-70b-versatile";
const MODEL_FALLBACK = "llama-3.1-8b-instant";

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
        message: string;
        type: string;
    };
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
    };
}

// Helper to call Groq API
async function callGroq(
    apiKey: string,
    model: string,
    prompt: string
): Promise<{ text: string | null; error: string | null; usage?: { in: number; out: number } }> {
    try {
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
                temperature: 0.7,
                max_tokens: 4096,
            }),
        });

        const data: GroqAPIResponse = await response.json();

        if (data.error) {
            return { text: null, error: data.error.message };
        }

        const text = data.choices?.[0]?.message?.content || null;
        const usage = data.usage ? {
            in: data.usage.prompt_tokens,
            out: data.usage.completion_tokens
        } : undefined;

        return { text, error: null, usage };
    } catch (error) {
        return { text: null, error: String(error) };
    }
}

serve(async (req: Request) => {
    // CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    };

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

    try {
        const startTime = Date.now();
        const { prompt, action, model } = (await req.json()) as GroqRequest;

        if (!prompt || typeof prompt !== "string") {
            return new Response(
                JSON.stringify({ success: false, error: "Missing or invalid prompt" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Limit prompt size
        if (prompt.length > 30000) {
            return new Response(
                JSON.stringify({ success: false, error: "Prompt too long (max 30000 chars)" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get API key from environment
        const apiKey = Deno.env.get("GROQ_API_KEY");

        if (!apiKey) {
            console.error("[groq-proxy] No Groq API key configured");
            return new Response(
                JSON.stringify({ success: false, error: "AI service not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        let result: { text: string | null; error: string | null; usage?: { in: number; out: number } };
        let modelUsed = model || MODEL_DEFAULT;

        // Try primary model
        console.log(`[groq-proxy] Trying ${modelUsed}...`);
        result = await callGroq(apiKey, modelUsed, prompt);

        // Try fallback if primary failed
        if (!result.text && modelUsed !== MODEL_FALLBACK) {
            console.warn(`[groq-proxy] Primary failed: ${result.error}, trying fallback...`);
            modelUsed = MODEL_FALLBACK;
            result = await callGroq(apiKey, modelUsed, prompt);
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
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        } else {
            console.error(`[groq-proxy] All models failed: ${result.error}`);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "AI generation failed",
                    details: result.error,
                }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
    } catch (error) {
        console.error("[groq-proxy] Unexpected error:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
