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

function isLocalRuntime(): boolean {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
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

    if (status >= 200 && status < 300) {
        return {
            allowed: false,
            retryAfterSeconds,
            error: payload?.error || 'Validação de segurança não autorizou esta tentativa.'
        };
    }

    // Fail-closed: when protection infrastructure is unhealthy we block auth actions.
    if (status >= 500) {
        return {
            allowed: false,
            retryAfterSeconds,
            error: 'Serviço de proteção temporariamente indisponível. Tente novamente em instantes.'
        };
    }

    return {
        allowed: false,
        retryAfterSeconds,
        error: payload?.error || 'Tentativa bloqueada pela política de segurança.'
    };
}

export async function checkAuthGuard(
    action: AuthGuardAction,
    email: string,
    supabaseUrl: string
): Promise<AuthGuardResult> {
    // Em desenvolvimento local, não bloquear login/cadastro por dependência de CORS da Edge Function.
    if (isLocalRuntime()) {
        return { allowed: true, retryAfterSeconds: 0 };
    }

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
            allowed: false,
            retryAfterSeconds: 0,
            error: 'Não foi possível validar segurança da autenticação. Tente novamente.'
        };
    } finally {
        clearTimeout(timeout);
    }
}
