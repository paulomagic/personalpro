// Supabase Edge Function: gemini-proxy
// Proxies calls to Gemini API to protect the API key from frontend exposure
//
// Deploy with: supabase functions deploy gemini-proxy
// Set secrets:
//   supabase secrets set GEMINI_API_KEY=your-key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Model
const MODEL = "gemini-2.5-flash";
const requestsByKey = new Map<string, { count: number; resetAt: number }>();

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

function isRateLimited(rateKey: string): boolean {
    const max = Number(Deno.env.get("RATE_LIMIT_MAX") || "20");
    const windowMs = Number(Deno.env.get("RATE_LIMIT_WINDOW_MS") || "60000");
    const now = Date.now();
    const slot = requestsByKey.get(rateKey);

    if (!slot || now >= slot.resetAt) {
        requestsByKey.set(rateKey, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (slot.count >= max) return true;
    slot.count += 1;
    requestsByKey.set(rateKey, slot);
    return false;
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

    const rateKey = `${userId}:${getClientIp(req)}`;
    if (isRateLimited(rateKey)) {
        return new Response(
            JSON.stringify({ success: false, error: "Rate limit exceeded" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

        // Get API key from environment (try both names for compatibility)
        const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GEMINI_API_KEY_PRIMARY");

        if (!apiKey) {
            console.error("No Gemini API key configured");
            return new Response(
                JSON.stringify({ success: false, error: "AI service not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`[gemini-proxy] Calling ${MODEL}...`);
        const result = await callGemini(apiKey, MODEL, prompt);

        const latencyMs = Date.now() - startTime;

        if (result.text) {
            console.log(`[gemini-proxy] Success with ${MODEL} in ${latencyMs}ms (action: ${action || 'unknown'})`);
            return new Response(
                JSON.stringify({
                    success: true,
                    text: result.text,
                    model: MODEL,
                    latencyMs,
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        } else {
            console.error(`[gemini-proxy] Failed: ${result.error}`);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "AI generation failed",
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
