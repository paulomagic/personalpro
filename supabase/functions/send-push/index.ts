import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";
import { buildRateLimitHeaders, checkRateLimit } from "../_shared/rateLimit.ts";

interface SendPushRequest {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
    data?: Record<string, unknown>;
}

interface SubscriptionRow {
    id: string;
    endpoint: string;
    p256dh: string | null;
    auth: string | null;
    disabled_at: string | null;
}

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

function getWebPushConfig() {
    const publicKey = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY") || "";
    const privateKey = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY") || "";
    const subject = Deno.env.get("WEB_PUSH_SUBJECT") || "mailto:suporte@apex-personalpro.app";

    if (!publicKey || !privateKey) {
        throw new Error("missing_vapid_configuration");
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
}

async function fetchSubscriptionsForUser(userId: string): Promise<SubscriptionRow[]> {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("missing_service_role");
    }

    const response = await fetch(
        `${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${userId}&disabled_at=is.null&select=id,endpoint,p256dh,auth,disabled_at`,
        {
            method: "GET",
            headers: {
                "apikey": serviceRoleKey,
                "Authorization": `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error(`subscriptions_fetch_failed:${response.status}`);
    }

    return await response.json() as SubscriptionRow[];
}

async function updateSubscriptionStatus(
    subscriptionId: string,
    payload: Record<string, unknown>
): Promise<void> {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;

    await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${subscriptionId}`, {
        method: "PATCH",
        headers: {
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        body: JSON.stringify({
            ...payload,
            updated_at: new Date().toISOString()
        })
    }).catch(() => {
        // best effort only
    });
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

    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
        return new Response(
            JSON.stringify({ success: false, error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const rateResult = await checkRateLimit(`send-push:${userId}:${getClientIp(req)}`, 6, 60);
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

    try {
        getWebPushConfig();
        const body = await req.json() as SendPushRequest;
        const title = String(body?.title || "Apex PersonalPro");
        const notificationPayload = JSON.stringify({
            title,
            body: String(body?.body || "Teste de notificação enviado com sucesso."),
            url: String(body?.url || "/settings"),
            tag: String(body?.tag || "apex-test-push"),
            data: body?.data || {}
        });

        const subscriptions = await fetchSubscriptionsForUser(userId);
        if (!subscriptions.length) {
            return new Response(
                JSON.stringify({ success: false, error: "No active push subscription found" }),
                { status: 404, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
            );
        }

        let delivered = 0;
        let disabled = 0;

        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh || "",
                        auth: subscription.auth || ""
                    }
                }, notificationPayload);

                delivered += 1;
                await updateSubscriptionStatus(subscription.id, {
                    last_test_at: new Date().toISOString(),
                    last_success_at: new Date().toISOString(),
                    last_error: null,
                    failure_count: 0
                });
            } catch (error) {
                const statusCode = Number((error as { statusCode?: number })?.statusCode || 0);
                const shouldDisable = statusCode === 404 || statusCode === 410;
                if (shouldDisable) disabled += 1;

                await updateSubscriptionStatus(subscription.id, {
                    last_test_at: new Date().toISOString(),
                    last_error: String((error as Error)?.message || error),
                    failure_count: 1,
                    disabled_at: shouldDisable ? new Date().toISOString() : null
                });
            }
        }

        return new Response(
            JSON.stringify({
                success: delivered > 0,
                delivered,
                disabled,
                total: subscriptions.length
            }),
            { status: delivered > 0 ? 200 : 502, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[send-push] Unexpected error:", error);
        const message = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ success: false, error: message }),
            { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
        );
    }
});
