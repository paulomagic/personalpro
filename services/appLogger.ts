const isDev = typeof window !== 'undefined'
    && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

function redactSensitiveText(value?: string | null): string | null {
    if (!value) return null;

    return value
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
        .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, '[REDACTED_PHONE]')
        .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[REDACTED_CPF]')
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[REDACTED_UUID]')
        .replace(/\b(?:nome|name|cliente|aluno)\s*[:=]\s*([^\n,;]+)/gi, '[REDACTED_PERSON]')
        .replace(/\bclient(?:_id)?\s*[:=]\s*([^\n,;]+)/gi, 'client:[REDACTED_ID]')
        .slice(0, 2000);
}

function sanitizeLogValue(value: unknown, depth = 0): unknown {
    if (value == null) return value;
    if (depth > 3) return '[TRUNCATED_DEPTH]';
    if (typeof value === 'string') return redactSensitiveText(value);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (value instanceof Error) {
        return {
            name: value.name,
            message: redactSensitiveText(value.message),
            stack: redactSensitiveText(value.stack)
        };
    }
    if (Array.isArray(value)) {
        return value.slice(0, 20).map((item) => sanitizeLogValue(item, depth + 1));
    }
    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).slice(0, 30).map(([key, entryValue]) => [
                key,
                sanitizeLogValue(entryValue, depth + 1)
            ])
        );
    }
    return String(value);
}

type AppLogLevel = 'debug' | 'info' | 'warn' | 'error';

function sanitizeMetadata(metadata?: Record<string, unknown> | null): Record<string, unknown> | undefined {
    if (!metadata) return undefined;
    return sanitizeLogValue(metadata) as Record<string, unknown>;
}

function emitConsole(level: AppLogLevel, scope: string, message: string, metadata?: Record<string, unknown>) {
    if (level === 'debug' && !isDev) return;
    const prefix = `[${scope}] ${message}`;
    const payload = sanitizeMetadata(metadata);

    if (level === 'debug') {
        console.debug(prefix, payload ?? '');
        return;
    }
    if (level === 'info') {
        if (isDev) console.info(prefix, payload ?? '');
        return;
    }
    if (level === 'warn') {
        console.warn(prefix, payload ?? '');
        return;
    }
    console.error(prefix, payload ?? '');
}

async function persistLog(level: 'warn' | 'error', scope: string, message: string, error?: Error | null, metadata?: Record<string, unknown>) {
    if (typeof window === 'undefined') return;

    try {
        const { logActivity, logFrontendError } = await import('./loggingService');
        const safeMetadata = sanitizeMetadata(metadata);

        if (level === 'warn') {
            await logActivity({
                action: `app_warn:${scope}`,
                resource_type: 'app_log',
                metadata: {
                    message,
                    level: 'warn',
                    ...safeMetadata
                }
            });
            return;
        }

        await logFrontendError({
            type: 'runtime_error',
            message: error ? `[${scope}] ${message}: ${error.message}` : `[${scope}] ${message}`,
            stack: error?.stack,
            metadata: safeMetadata
        });
    } catch {
        // Fail closed: logging must never break the user flow.
    }
}

export function createScopedLogger(scope: string, baseMetadata?: Record<string, unknown>) {
    const withBase = (metadata?: Record<string, unknown>) => ({
        ...(baseMetadata || {}),
        ...(metadata || {})
    });

    return {
        debug(message: string, metadata?: Record<string, unknown>) {
            emitConsole('debug', scope, message, withBase(metadata));
        },
        info(message: string, metadata?: Record<string, unknown>) {
            emitConsole('info', scope, message, withBase(metadata));
        },
        warn(message: string, metadata?: Record<string, unknown>) {
            const merged = withBase(metadata);
            emitConsole('warn', scope, message, merged);
            void persistLog('warn', scope, message, null, merged);
        },
        error(message: string, error?: unknown, metadata?: Record<string, unknown>) {
            const normalizedError = error == null
                ? null
                : error instanceof Error
                    ? error
                    : new Error(typeof error === 'string' ? error : 'unknown_error');
            const merged = withBase({
                ...metadata,
                error_name: normalizedError?.name,
                error_message: normalizedError?.message
            });

            emitConsole('error', scope, message, merged);
            void persistLog('error', scope, message, normalizedError, merged);
        }
    };
}
