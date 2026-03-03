-- Migration: batch RPC to fetch decrypted sensitive data for multiple clients
-- Created: 2026-03-03

CREATE OR REPLACE FUNCTION public.get_clients_sensitive_data(
    p_client_ids UUID[]
)
RETURNS TABLE (
    client_id UUID,
    injuries TEXT,
    observations TEXT,
    preferences TEXT,
    bmi NUMERIC
)
AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
    v_key TEXT;
BEGIN
    IF p_client_ids IS NULL OR array_length(p_client_ids, 1) IS NULL THEN
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    ) INTO is_admin;

    v_key := public.get_clinical_data_key();
    IF v_key IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        c.id AS client_id,
        NULLIF(pgp_sym_decrypt(c.injuries_encrypted, v_key), '') AS injuries,
        NULLIF(pgp_sym_decrypt(c.observations_encrypted, v_key), '') AS observations,
        NULLIF(pgp_sym_decrypt(c.preferences_encrypted, v_key), '') AS preferences,
        NULLIF(pgp_sym_decrypt(c.bmi_encrypted, v_key), '')::NUMERIC AS bmi
    FROM public.clients c
    WHERE c.id = ANY(p_client_ids)
      AND (
        c.coach_id = auth.uid()
        OR is_admin = TRUE
        OR EXISTS (
            SELECT 1
            FROM public.user_profiles up
            WHERE up.id = auth.uid()
              AND up.role = 'student'
              AND up.client_id = c.id
        )
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

REVOKE ALL ON FUNCTION public.get_clients_sensitive_data(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_clients_sensitive_data(UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_clients_sensitive_data IS 'Returns decrypted sensitive data for multiple clients when caller has access.';
