import { logActivity, logFrontendError } from './loggingService';

export async function persistScopedWarn(
    scope: string,
    message: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    await logActivity({
        action: `app_warn:${scope}`,
        resource_type: 'app_log',
        metadata: {
            message,
            level: 'warn',
            ...metadata
        }
    });
}

export async function persistScopedError(
    scope: string,
    message: string,
    error?: Error | null,
    metadata?: Record<string, unknown>
): Promise<void> {
    await logFrontendError({
        type: 'runtime_error',
        message: error ? `[${scope}] ${message}: ${error.message}` : `[${scope}] ${message}`,
        stack: error?.stack,
        metadata
    });
}
