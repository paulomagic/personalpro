// Native Cloudflare Turnstile component without third-party package
// This avoids potential conflicts with @marsidev/react-turnstile

import React, { useEffect, useRef, useCallback } from 'react';

interface TurnstileProps {
    siteKey: string;
    onSuccess: (token: string) => void;
    onError?: (error?: string) => void;
    onExpire?: () => void;
    theme?: 'light' | 'dark' | 'auto';
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

interface TurnstileRenderOptions {
    sitekey: string;
    callback: (token: string) => void;
    'error-callback'?: (error?: string) => void;
    'expired-callback'?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
    retry?: 'auto' | 'never';
    'refresh-expired'?: 'auto' | 'manual' | 'never';
}

// Singleton to track script loading
let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadTurnstileScript(): Promise<void> {
    return new Promise((resolve) => {
        if (scriptLoaded) {
            resolve();
            return;
        }

        if (scriptLoading) {
            loadCallbacks.push(resolve);
            return;
        }

        scriptLoading = true;

        // Set up the callback before loading the script
        window.onTurnstileLoad = () => {
            scriptLoaded = true;
            scriptLoading = false;
            resolve();
            loadCallbacks.forEach(cb => cb());
            loadCallbacks.length = 0;
        };

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="turnstile"]');
        if (existingScript) {
            // Script exists, wait for it to load
            if (window.turnstile) {
                scriptLoaded = true;
                resolve();
            }
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    });
}

export const NativeTurnstile: React.FC<TurnstileProps> = ({
    siteKey,
    onSuccess,
    onError,
    onExpire,
    theme = 'dark'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const mountedRef = useRef(true);

    const handleSuccess = useCallback((token: string) => {
        if (mountedRef.current) {
            onSuccess(token);
        }
    }, [onSuccess]);

    const handleError = useCallback((error?: string) => {
        if (mountedRef.current && onError) {
            onError(error);
        }
    }, [onError]);

    const handleExpire = useCallback(() => {
        if (mountedRef.current && onExpire) {
            onExpire();
        }
    }, [onExpire]);

    useEffect(() => {
        let cancelled = false;
        let widgetId: string | null = null;

        const initWidget = async () => {
            if (typeof siteKey !== 'string') {
                console.error('Turnstile siteKey must be a string, got:', typeof siteKey, siteKey);
                // Try to recover if it's an object (common env var issue)
                if (typeof siteKey === 'object' && siteKey !== null) {
                    console.error('Detected object passed as siteKey, checking structure:', JSON.stringify(siteKey));
                }
                return;
            }

            await loadTurnstileScript();

            if (cancelled || !containerRef.current || !window.turnstile) {
                return;
            }

            // Double check if widget is already rendered in this container
            if (containerRef.current.childElementCount > 0) {
                return;
            }

            try {
                // Clear just in case
                containerRef.current.innerHTML = '';

                // Force primitive string to avoid "got object" error
                const siteKeyStr = String(siteKey);
                console.log('[NativeTurnstile] Rendering with siteKey:', siteKeyStr, 'type:', typeof siteKeyStr);

                widgetId = window.turnstile.render(containerRef.current, {
                    sitekey: siteKeyStr,
                    callback: handleSuccess,
                    'error-callback': handleError,
                    'expired-callback': handleExpire,
                    theme: theme as 'light' | 'dark' | 'auto',
                    size: 'normal',
                    retry: 'auto',
                    'refresh-expired': 'auto'
                });
                widgetIdRef.current = widgetId;
            } catch (e) {
                console.error('Failed to render Turnstile:', e);
                // Only report error if it's not the "already rendered" error (which is harmless here)
                if (e instanceof Error && !e.message.includes('already been rendered')) {
                    handleError('Failed to load CAPTCHA');
                }
            }
        };

        // Small delay to allow cleanup of previous effect in Strict Mode
        const timeoutId = setTimeout(initWidget, 50);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
            if (widgetId && window.turnstile) {
                try {
                    window.turnstile.remove(widgetId);
                } catch (e) {
                    // Widget may already be removed
                }
            }
        };
    }, [siteKey, theme, handleSuccess, handleError, handleExpire]);

    return <div ref={containerRef} className="cf-turnstile" />;
};

export default NativeTurnstile;
