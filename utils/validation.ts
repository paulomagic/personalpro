/**
 * Validation utilities for security and data integrity
 */

import { createScopedLogger } from '../services/appLogger';

// Valid domains for avatar images
const ALLOWED_AVATAR_DOMAINS = [
    'ui-avatars.com',
    'lh3.googleusercontent.com',
    'googleusercontent.com',
    'supabase.co',       // covers *.supabase.co subdomains via endsWith check
    'supabase.com',      // covers *.supabase.com subdomains
    'storage.googleapis.com',
    'avatars.githubusercontent.com',
    'images.unsplash.com',
];

/**
 * Validates if an image URL is from a trusted domain
 */
export function validateImageUrl(url: string | undefined | null): boolean {
    if (!url) return false;

    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') {
            return false;
        }
        return ALLOWED_AVATAR_DOMAINS.some(domain =>
            parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );
    } catch {
        return false;
    }
}

/**
 * Returns a safe avatar URL or fallback
 */
export function getSafeAvatarUrl(url: string | undefined | null, fallbackName: string): string {
    if (validateImageUrl(url)) {
        return url!;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=3b82f6&color=fff&size=200`;
}

/**
 * Validates weight value is within reasonable range
 */
export function validateWeight(value: string | number): { valid: boolean; error?: string } {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return { valid: false, error: 'Peso inválido' };
    if (num < 20) return { valid: false, error: 'Peso muito baixo (mín: 20kg)' };
    if (num > 300) return { valid: false, error: 'Peso muito alto (máx: 300kg)' };
    return { valid: true };
}

/**
 * Validates body fat percentage
 */
export function validateBodyFat(value: string | number): { valid: boolean; error?: string } {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return { valid: false, error: 'Percentual inválido' };
    if (num < 3) return { valid: false, error: 'Gordura muito baixa (mín: 3%)' };
    if (num > 60) return { valid: false, error: 'Gordura muito alta (máx: 60%)' };
    return { valid: true };
}

/**
 * Validates measurement values (cm)
 */
export function validateMeasurement(value: string | number): { valid: boolean; error?: string } {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return { valid: false, error: 'Medida inválida' };
    if (num < 0) return { valid: false, error: 'Medida não pode ser negativa' };
    if (num > 300) return { valid: false, error: 'Medida muito alta' };
    return { valid: true };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email.trim()) return { valid: false, error: 'Email obrigatório' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { valid: false, error: 'Formato de email inválido' };
    }
    return { valid: true };
}

/**
 * Validates phone number (Brazilian format)
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
    if (!phone.trim()) return { valid: true }; // Phone is optional

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return { valid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
    }
    return { valid: true };
}

/**
 * Sanitizes text input to prevent XSS (basic)
 */
export function sanitizeText(text: string): string {
    if (!text) return '';
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Conditional logger - only logs in development
 */
const isDev = typeof window !== 'undefined'
    && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const validationLogger = createScopedLogger('validation');

export const logger = {
    log: (message: string, metadata?: Record<string, unknown>) => {
        if (isDev) validationLogger.debug(message, metadata);
    },
    warn: (message: string, metadata?: Record<string, unknown>) => {
        if (isDev) validationLogger.warn(message, metadata);
    },
    error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => {
        validationLogger.error(message, error, metadata);
    },
};
