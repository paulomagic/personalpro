const SUPABASE_UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSupabaseUuid(value?: string | null): value is string {
    return typeof value === 'string' && SUPABASE_UUID_REGEX.test(value);
}
