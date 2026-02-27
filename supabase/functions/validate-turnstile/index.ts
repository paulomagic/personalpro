// Supabase Edge Function: validate-turnstile
// Validates Cloudflare Turnstile CAPTCHA tokens server-side
// 
// Deploy with: supabase functions deploy validate-turnstile
// Set secret: supabase secrets set TURNSTILE_SECRET_KEY=your-secret-key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const requestsByIp = new Map<string, { count: number; resetAt: number }>();

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
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Vary": "Origin",
    };
}

function getClientIp(req: Request): string {
    return req.headers.get("cf-connecting-ip")
        || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || "unknown";
}

function isRateLimited(req: Request): boolean {
    const max = Number(Deno.env.get("RATE_LIMIT_MAX") || "20");
    const windowMs = Number(Deno.env.get("RATE_LIMIT_WINDOW_MS") || "60000");
    const ip = getClientIp(req);
    const now = Date.now();
    const slot = requestsByIp.get(ip);

    if (!slot || now >= slot.resetAt) {
        requestsByIp.set(ip, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (slot.count >= max) return true;
    slot.count += 1;
    requestsByIp.set(ip, slot);
    return false;
}

interface TurnstileResponse {
    success: boolean;
    "error-codes"?: string[];
    challenge_ts?: string;
    hostname?: string;
}

function getAllowedHostnames(): string[] {
    const raw = Deno.env.get("TURNSTILE_ALLOWED_HOSTNAMES") || "";
    return raw.split(",").map((h) => h.trim()).filter(Boolean);
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
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    // Only allow POST
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (isRateLimited(req)) {
        return new Response(
            JSON.stringify({ success: false, error: "Rate limit exceeded" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const { token } = await req.json();

        if (!token || typeof token !== "string") {
            return new Response(
                JSON.stringify({ success: false, error: "Missing CAPTCHA token" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (token.length > 4096) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid CAPTCHA token" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get secret key from environment
        const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");

        if (!secretKey) {
            console.error("TURNSTILE_SECRET_KEY not configured");
            return new Response(
                JSON.stringify({ success: false, error: "Validation service not configured" }),
                { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate with Cloudflare
        const formData = new FormData();
        formData.append("secret", secretKey);
        formData.append("response", token);

        // Optionally add IP for additional security
        const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] ||
            req.headers.get("cf-connecting-ip") || "";
        if (clientIP) {
            formData.append("remoteip", clientIP);
        }

        const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
            method: "POST",
            body: formData,
        });

        const result: TurnstileResponse = await verifyResponse.json();

        if (result.success) {
            const allowedHostnames = getAllowedHostnames();
            if (allowedHostnames.length > 0 && (!result.hostname || !allowedHostnames.includes(result.hostname))) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Invalid CAPTCHA hostname",
                    }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                );
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    hostname: result.hostname,
                    timestamp: result.challenge_ts
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        } else {
            console.warn("Turnstile validation failed:", result["error-codes"]);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "CAPTCHA validation failed",
                    codes: result["error-codes"]
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }
    } catch (error) {
        console.error("Turnstile validation error:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Validation service error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
