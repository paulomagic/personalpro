
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
        try {
            const stored = localStorage.getItem('apex_theme') as ThemeMode | null;
            if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
        } catch {}
        return 'dark';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
        const stored = typeof localStorage !== 'undefined'
            ? (localStorage.getItem('apex_theme') as ThemeMode | null)
            : null;
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
        localStorage.setItem('apex_theme', next);
        const resolved = next === 'system' ? getSystemTheme() : next;
        setResolvedTheme(resolved);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
