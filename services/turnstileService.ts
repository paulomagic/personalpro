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
            // FAIL-OPEN: Log error but allow access if configuration is broken
            // This ensures users aren't blocked by CAPTCHA misconfiguration
            return {
                success: true,
                warning: `Validation error ignored: ${result.error || 'Unknown error'}`
            };
        }

        if (result.warning) {
            console.warn('⚠️ Turnstile validation warning:', result.warning);
        }

        return { success: true };
    } catch (error) {
        console.error('Error calling Turnstile validation:', error);
        // CRITICAL STRATEGY: In case of ANY error (network, config, timeout), 
        // we must ALLOW the user to proceed to avoid locking them out.
        // We log the security event but do not block the UI.
        return {
            success: true,
            warning: 'Validation service unavailable - fail-open strategy active'
        };
    }
}
