interface TurnstileValidationPayload {
    success?: boolean;
    error?: string;
}

export interface TurnstileValidationResult {
    valid: boolean;
    error?: string;
}

export async function validateTurnstileToken(
    token: string,
    supabaseUrl: string
): Promise<TurnstileValidationResult> {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
        return { valid: false, error: 'Confirme o CAPTCHA para continuar.' };
    }

    if (!supabaseUrl) {
        return { valid: false, error: 'Serviço de validação indisponível.' };
    }

    const endpoint = `${supabaseUrl}/functions/v1/validate-turnstile`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: normalizedToken }),
            signal: controller.signal
        });

        let payload: TurnstileValidationPayload | null = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (response.ok && payload?.success) {
            return { valid: true };
        }

        return {
            valid: false,
            error: payload?.error || 'Falha na validação do CAPTCHA.'
        };
    } catch {
        return {
            valid: false,
            error: 'Não foi possível validar o CAPTCHA. Tente novamente.'
        };
    } finally {
        clearTimeout(timeout);
    }
}
