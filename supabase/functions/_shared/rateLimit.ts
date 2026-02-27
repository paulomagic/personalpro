interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

const memoryRequestsByKey = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(rateKey: string, max: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const slot = memoryRequestsByKey.get(rateKey);

    if (!slot || now >= slot.resetAt) {
        memoryRequestsByKey.set(rateKey, { count: 1, resetAt: now + windowMs });
        return {
            allowed: true,
            remaining: Math.max(0, max - 1),
            retryAfterSeconds: 0,
        };
    }

    if (slot.count >= max) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.max(1, Math.ceil((slot.resetAt - now) / 1000)),
        };
    }

    slot.count += 1;
    memoryRequestsByKey.set(rateKey, slot);
    return {
        allowed: true,
        remaining: Math.max(0, max - slot.count),
        retryAfterSeconds: 0,
    };
}

export async function checkRateLimit(rateKey: string): Promise<RateLimitResult> {
    const max = Number(Deno.env.get("RATE_LIMIT_MAX") || "20");
    const windowMs = Number(Deno.env.get("RATE_LIMIT_WINDOW_MS") || "60000");
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
        return checkRateLimitInMemory(rateKey, max, windowMs);
    }

    try {
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
                p_window_seconds: windowSeconds,
            }),
        });

        if (!response.ok) {
            console.warn("[rate-limit] RPC failed, using in-memory fallback:", response.status);
            return checkRateLimitInMemory(rateKey, max, windowMs);
        }

        const payload = await response.json() as {
            allowed: boolean;
            remaining: number;
            retry_after_seconds: number;
        };

        return {
            allowed: !!payload?.allowed,
            remaining: Math.max(0, Number(payload?.remaining ?? 0)),
            retryAfterSeconds: Math.max(0, Number(payload?.retry_after_seconds ?? 0)),
        };
    } catch (error) {
        console.warn("[rate-limit] Unexpected RPC error, using in-memory fallback:", error);
        return checkRateLimitInMemory(rateKey, max, windowMs);
    }
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        "X-RateLimit-Remaining": String(result.remaining),
        "Retry-After": String(result.retryAfterSeconds),
    };
}

