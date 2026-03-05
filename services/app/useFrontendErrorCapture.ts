import { useEffect } from 'react';
import { logFrontendError } from '../loggingService';

export function useFrontendErrorCapture(): void {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const onError = (event: ErrorEvent) => {
            void logFrontendError({
                type: 'runtime_error',
                message: event.message || 'Unknown runtime error',
                stack: event.error?.stack,
                source: event.filename,
                line: event.lineno,
                column: event.colno
            });
        };

        const onUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const message = reason instanceof Error
                ? reason.message
                : typeof reason === 'string'
                    ? reason
                    : JSON.stringify(reason);

            void logFrontendError({
                type: 'promise_rejection',
                message,
                stack: reason instanceof Error ? reason.stack : undefined
            });
        };

        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onUnhandledRejection);

        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onUnhandledRejection);
        };
    }, []);
}
