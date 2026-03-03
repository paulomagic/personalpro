-- Fix: allow manual backfill execution from Supabase SQL Editor (role postgres)
-- Created: 2026-03-03

CREATE OR REPLACE FUNCTION public.backfill_client_sensitive_encryption(
    p_limit INTEGER DEFAULT 500
)
RETURNS BIGINT
AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
    v_limit INTEGER := GREATEST(p_limit, 1);
    v_updated BIGINT := 0;
BEGIN
    -- SQL Editor sessions usually run as postgres and do not carry auth.uid().
    IF current_user = 'postgres' OR auth.role() = 'service_role' THEN
        is_admin := TRUE;
    ELSE
        SELECT EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()
              AND role = 'admin'
        ) INTO is_admin;
    END IF;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Insufficient privileges';
    END IF;

    WITH candidates AS (
        SELECT id
        FROM public.clients
        WHERE injuries_encrypted IS NULL
           OR observations_encrypted IS NULL
           OR preferences_encrypted IS NULL
           OR bmi_encrypted IS NULL
        ORDER BY created_at ASC
        LIMIT v_limit
    )
    UPDATE public.clients c
       SET injuries = c.injuries
      FROM candidates
     WHERE c.id = candidates.id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.backfill_client_sensitive_encryption(INTEGER) TO authenticated;
