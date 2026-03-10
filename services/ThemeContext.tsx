
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
    theme: ThemeMode;
    resolvedTheme: 'dark' | 'light';
    setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const NEW_THEME_STORAGE_KEY = 'personalpro_theme';
const LEGACY_THEME_STORAGE_KEY = 'apex_theme';

function readStoredTheme(): ThemeMode | null {
    if (typeof window === 'undefined') return null;
    try {
        const next = localStorage.getItem(NEW_THEME_STORAGE_KEY) as ThemeMode | null;
        if (next === 'dark' || next === 'light' || next === 'system') return next;

        const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY) as ThemeMode | null;
        if (legacy === 'dark' || legacy === 'light' || legacy === 'system') {
            localStorage.setItem(NEW_THEME_STORAGE_KEY, legacy);
            return legacy;
        }
    } catch {}
    return null;
}

function getSystemTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(resolved: 'dark' | 'light') {
    const root = document.documentElement;
    if (resolved === 'light') {
        root.setAttribute('data-theme', 'light');
    } else {
        root.removeAttribute('data-theme');
    }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        return readStoredTheme() || 'dark';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
        const stored = readStoredTheme();
        const initial = (stored === 'dark' || stored === 'light' || stored === 'system') ? stored : 'dark';
        return initial === 'system' ? getSystemTheme() : initial;
    });

    // Apply on mount and whenever resolved changes
    useEffect(() => {
        applyTheme(resolvedTheme);
    }, [resolvedTheme]);

    // Listen for system preference changes when in 'system' mode
    useEffect(() => {
        if (theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const handler = (e: MediaQueryListEvent) => {
            const next = e.matches ? 'light' : 'dark';
            setResolvedTheme(next);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    const setTheme = (next: ThemeMode) => {
        setThemeState(next);
        localStorage.setItem(NEW_THEME_STORAGE_KEY, next);
        const resolved = next === 'system' ? getSystemTheme() : next;
        setResolvedTheme(resolved);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
