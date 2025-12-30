// Turnstile CAPTCHA validation service
// Calls Supabase Edge Function to validate tokens server-side

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ValidationResult {
    success: boolean;
    error?: string;
    warning?: string;
}

/**
 * Validates a Turnstile CAPTCHA token server-side via Supabase Edge Function.
 * Returns { success: true } if valid, { success: false, error: string } if invalid.
 * 
 * Note: If Edge Function is not deployed or secret not configured,
 * it will return success with a warning for development purposes.
 */
export async function validateTurnstileToken(token: string): Promise<ValidationResult> {
    if (!token) {
        return { success: false, error: 'Token não fornecido' };
    }

    // Skip validation in development if no Supabase URL
    if (!SUPABASE_URL) {
        console.warn('⚠️ Supabase not configured - skipping Turnstile validation');
        return { success: true, warning: 'Validation skipped - development mode' };
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-turnstile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Turnstile validation failed:', result);
            return {
                success: false,
                error: result.error || 'Falha na validação do CAPTCHA'
            };
        }

        if (result.warning) {
            console.warn('⚠️ Turnstile validation warning:', result.warning);
        }

        return { success: true };
    } catch (error) {
        console.error('Error calling Turnstile validation:', error);
        // On network error, allow through but log warning
        // This prevents blocking users if the function is temporarily unavailable
        return {
            success: true,
            warning: 'Validation service unavailable - proceeding with caution'
        };
    }
}
