export type AuthGuardAction = 'login' | 'register';

export interface AuthGuardResult {
    allowed: boolean;
    retryAfterSeconds: number;
    error?: string;
}

interface AuthGuardResponse {
    success?: boolean;
    allowed?: boolean;
    retry_after_seconds?: number;
    error?: string;
}

function normalizeRetryAfter(value: unknown): number {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) return 0;
    return Math.floor(num);
}

export function normalizeAuthGuardResult(status: number, payload: AuthGuardResponse | null): AuthGuardResult {
    const retryAfterSeconds = normalizeRetryAfter(payload?.retry_after_seconds);

    if (status === 429) {
        return {
            allowed: false,
            retryAfterSeconds,
            error: payload?.error || 'Muitas tentativas. Tente novamente em instantes.'
        };
    }

    if (status >= 200 && status < 300 && payload?.allowed) {
        return { allowed: true, retryAfterSeconds };
    }

    // Fail-open for availability issues to avoid locking out legitimate users.
    // Abuse scenarios are still blocked by explicit 429 above.
    if (status >= 500) {
        return {
            allowed: true,
            retryAfterSeconds: 0
        };
    }

    return {
        allowed: true,
        retryAfterSeconds: 0
    };
}

export async function checkAuthGuard(
    action: AuthGuardAction,
    email: string,
    supabaseUrl: string
): Promise<AuthGuardResult> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !supabaseUrl) {
        return { allowed: true, retryAfterSeconds: 0 };
    }

    const endpoint = `${supabaseUrl}/functions/v1/auth-guard`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, email: normalizedEmail }),
            signal: controller.signal
        });

        let payload: AuthGuardResponse | null = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        return normalizeAuthGuardResult(response.status, payload);
    } catch {
        return {
            allowed: true,
            retryAfterSeconds: 0
        };
    } finally {
        clearTimeout(timeout);
    }
}
