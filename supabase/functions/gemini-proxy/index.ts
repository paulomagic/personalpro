// Supabase Edge Function: gemini-proxy
// Proxies calls to Gemini API to protect the API key from frontend exposure
//
// Deploy with: supabase functions deploy gemini-proxy
// Set secrets:
//   supabase secrets set GEMINI_API_KEY_PRIMARY=your-primary-key
//   supabase secrets set GEMINI_API_KEY_FALLBACK=your-fallback-key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Models
const MODEL_PRIMARY = "gemini-2.5-flash";
const MODEL_FALLBACK = "gemini-2.5-flash-lite";

interface GeminiRequest {
    prompt: string;
    action?: string; // For logging purposes
}

interface GeminiAPIResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
    error?: {
        message: string;
        code: number;
    };
}

// Helper to call Gemini API
async function callGemini(
    apiKey: string,
    model: string,
    prompt: string
): Promise<{ text: string | null; error: string | null }> {
    try {
        const response = await fetch(
            `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                    },
                }),
            }
        );

        const data: GeminiAPIResponse = await response.json();

        if (data.error) {
            return { text: null, error: data.error.message };
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        return { text, error: null };
    } catch (error) {
        return { text: null, error: String(error) };
    }
}

serve(async (req: Request) => {
    // CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
        const { prompt, action } = (await req.json()) as GeminiRequest;

        if (!prompt || typeof prompt !== "string") {
            return new Response(
                JSON.stringify({ success: false, error: "Missing or invalid prompt" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Limit prompt size (prevent abuse)
        if (prompt.length > 50000) {
            return new Response(
                JSON.stringify({ success: false, error: "Prompt too long (max 50000 chars)" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get API keys from environment
        const primaryKey = Deno.env.get("GEMINI_API_KEY_PRIMARY");
        const fallbackKey = Deno.env.get("GEMINI_API_KEY_FALLBACK");

        if (!primaryKey && !fallbackKey) {
            console.error("No Gemini API keys configured");
            return new Response(
                JSON.stringify({ success: false, error: "AI service not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        let result: { text: string | null; error: string | null } = { text: null, error: null };
        let modelUsed: string | null = null;

        // Try primary first
        if (primaryKey) {
            console.log(`[gemini-proxy] Trying ${MODEL_PRIMARY}...`);
            result = await callGemini(primaryKey, MODEL_PRIMARY, prompt);
            if (result.text) {
                modelUsed = MODEL_PRIMARY;
            } else {
                console.warn(`[gemini-proxy] Primary failed: ${result.error}`);
            }
        }

        // Try fallback if primary failed
        if (!result.text && fallbackKey) {
            console.log(`[gemini-proxy] Trying ${MODEL_FALLBACK}...`);
            result = await callGemini(fallbackKey, MODEL_FALLBACK, prompt);
            if (result.text) {
                modelUsed = MODEL_FALLBACK;
            } else {
                console.warn(`[gemini-proxy] Fallback failed: ${result.error}`);
            }
        }

        const latencyMs = Date.now() - startTime;

        if (result.text) {
            console.log(`[gemini-proxy] Success with ${modelUsed} in ${latencyMs}ms (action: ${action || 'unknown'})`);
            return new Response(
                JSON.stringify({
                    success: true,
                    text: result.text,
                    model: modelUsed,
                    latencyMs,
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        } else {
            console.error(`[gemini-proxy] Both APIs failed: ${result.error}`);
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
        console.error("[gemini-proxy] Unexpected error:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
