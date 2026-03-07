import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

interface AuthGuardRequest {
    action: 'login' | 'register';
    email: string;
}

interface RateLimitRpcResponse {
    allowed: boolean;
    remaining: number;
    retry_after_seconds: number;
    reset_at: string;
}

let requestCounter = 0;
const logger = createEdgeLogger("auth-guard");

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

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function sha256Hex(value: string): Promise<string> {
    const input = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", input);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function checkAuthRateLimit(rateKey: string): Promise<RateLimitRpcResponse | null> {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return null;

    const max = Number(Deno.env.get("AUTH_RATE_LIMIT_MAX") || "8");
    const windowSeconds = Math.max(1, Math.ceil(Number(Deno.env.get("AUTH_RATE_LIMIT_WINDOW_MS") || "60000") / 1000));

    try {
        requestCounter += 1;
        if (requestCounter % 300 === 0) {
            void fetch(`${supabaseUrl}/rest/v1/rpc/cleanup_edge_rate_limits`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": serviceRoleKey,
                    "Authorization": `Bearer ${serviceRoleKey}`,
                },
                body: JSON.stringify({
                    p_older_than_seconds: Number(Deno.env.get("RATE_LIMIT_RETENTION_SECONDS") || "86400"),
                })
            }).catch(() => {
                // Best-effort cleanup only.
            });
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_rate_limit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": serviceRoleKey,
                "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
                p_key: rateKey,
                p_max: max,
                p_window_seconds: windowSeconds
            })
        });

        if (!response.ok) return null;
        const data = await response.json() as RateLimitRpcResponse;
        return data;
    } catch {
        return null;
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

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ success: false, error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const body = await req.json() as AuthGuardRequest;
        const action = body?.action;
        const email = body?.email?.toLowerCase().trim();

        if ((action !== "login" && action !== "register") || !email || !isValidEmail(email)) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid request payload" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const ip = getClientIp(req);
        const hashedIdentity = await sha256Hex(`${action}:${email}:${ip}`);
        const rateKey = `auth-guard:${action}:${hashedIdentity}`;

        const rate = await checkAuthRateLimit(rateKey);
        if (!rate) {
            return new Response(
                JSON.stringify({
                    success: false,
                    allowed: false,
                    retry_after_seconds: 15,
                    error: "Security service unavailable"
                }),
                { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const commonHeaders = {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(Math.max(0, Number(rate.remaining || 0))),
            "Retry-After": String(Math.max(0, Number(rate.retry_after_seconds || 0)))
        };

        if (!rate.allowed) {
            return new Response(
                JSON.stringify({
                    success: true,
                    allowed: false,
                    retry_after_seconds: Math.max(0, Number(rate.retry_after_seconds || 0)),
                    error: "Too many authentication attempts"
                }),
                { status: 429, headers: commonHeaders }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                allowed: true,
                remaining: Math.max(0, Number(rate.remaining || 0)),
                retry_after_seconds: 0
            }),
            { status: 200, headers: commonHeaders }
        );
    } catch (error) {
        logger.error("Unexpected auth guard error", error);
        return new Response(
            JSON.stringify({ success: false, error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
