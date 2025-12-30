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
    'refresh-expired': 'auto' | 'manual' | 'never';
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
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
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

    // Callbacks must be stable for the widget
    const handleSuccess = useCallback((token: string) => {
        onSuccess(token);
    }, [onSuccess]);

    const handleError = useCallback((error?: string) => {
        if (onError) onError(error);
    }, [onError]);

    const handleExpire = useCallback(() => {
        if (onExpire) onExpire();
    }, [onExpire]);

    useEffect(() => {
        if (!siteKey) {
            console.error('Turnstile: siteKey is missing');
            return;
        }

        let mounted = true;
        let widgetId: string | null = null;

        const cleanup = () => {
            mounted = false;
            // Clean up previous widget instance if it exists
            if (widgetId && window.turnstile) {
                try {
                    window.turnstile.remove(widgetId);
                } catch (e) {
                    // Ignore removal errors
                }
                widgetId = null;
            }
        };

        const renderWidget = () => {
            if (!mounted || !containerRef.current || !window.turnstile) return;

            // Ensure clean slate - prevent duplication
            containerRef.current.innerHTML = '';

            try {
                // Force primitive string
                const siteKeyStr = String(siteKey);

                widgetId = window.turnstile.render(containerRef.current, {
                    sitekey: siteKeyStr,
                    callback: handleSuccess,
                    'error-callback': handleError,
                    'expired-callback': handleExpire,
                    theme: theme as 'light' | 'dark' | 'auto',
                    'refresh-expired': 'auto',
                });
            } catch (error) {
                console.error('Turnstile render error:', error);
                if (onError && mounted) onError('Falha ao carregar CAPTCHA - Configuração Inválida');
            }
        };

        loadTurnstileScript().then(() => {
            if (mounted) renderWidget();
        });

        return cleanup;
    }, [siteKey, theme, handleSuccess, handleError, handleExpire]);

    return <div ref={containerRef} className="turnstile-container" style={{ minHeight: '65px' }} />;
};

export default NativeTurnstile;
