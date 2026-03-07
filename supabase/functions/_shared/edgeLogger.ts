type EdgeLogLevel = "debug" | "info" | "warn" | "error";

function redactString(value: string): string {
    return value
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
        .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, "[REDACTED_PHONE]")
        .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[REDACTED_CPF]")
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[REDACTED_UUID]")
        .replace(/bearer\s+[a-z0-9._-]+/gi, "Bearer [REDACTED_TOKEN]")
        .slice(0, 400);
}

function sanitizeValue(value: unknown, depth = 0): unknown {
    if (value == null) return value;
    if (depth > 3) return "[TRUNCATED_DEPTH]";
    if (typeof value === "string") return redactString(value);
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (value instanceof Error) {
        return {
            name: value.name,
            message: redactString(value.message),
            stack: redactString(value.stack || "")
        };
    }
    if (Array.isArray(value)) {
        return value.slice(0, 20).map((entry) => sanitizeValue(entry, depth + 1));
    }
    if (typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .slice(0, 30)
                .map(([key, entry]) => [key, sanitizeValue(entry, depth + 1)])
        );
    }
    return String(value);
}

function emitLog(level: EdgeLogLevel, scope: string, message: string, metadata?: Record<string, unknown>) {
    const payload = JSON.stringify({
        ts: new Date().toISOString(),
        level,
        scope,
        message,
        metadata: sanitizeValue(metadata)
    });

    if (level === "debug") {
        console.debug(payload);
        return;
    }
    if (level === "info") {
        console.info(payload);
        return;
    }
    if (level === "warn") {
        console.warn(payload);
        return;
    }
    console.error(payload);
}

export function createEdgeLogger(scope: string, baseMetadata: Record<string, unknown> = {}) {
    const mergeMetadata = (metadata?: Record<string, unknown>) => ({
        ...baseMetadata,
        ...(metadata || {})
    });

    return {
        debug(message: string, metadata?: Record<string, unknown>) {
            emitLog("debug", scope, message, mergeMetadata(metadata));
        },
        info(message: string, metadata?: Record<string, unknown>) {
            emitLog("info", scope, message, mergeMetadata(metadata));
        },
        warn(message: string, metadata?: Record<string, unknown>) {
            emitLog("warn", scope, message, mergeMetadata(metadata));
        },
        error(message: string, error?: unknown, metadata?: Record<string, unknown>) {
            const normalizedError = error instanceof Error
                ? error
                : error == null
                    ? undefined
                    : new Error(String(error));

            emitLog("error", scope, message, mergeMetadata({
                ...metadata,
                error_name: normalizedError?.name,
                error_message: normalizedError?.message,
                error_stack: normalizedError?.stack
            }));
        }
    };
}
