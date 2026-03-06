import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// @ts-ignore - Vite env
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
// @ts-ignore - Vite env
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        global: {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        },
    });
}

export { supabase };
export { SUPABASE_URL, SUPABASE_ANON_KEY };
