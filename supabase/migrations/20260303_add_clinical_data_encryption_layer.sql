-- Migration: clinical data encryption layer (progressive rollout)
-- Created: 2026-03-03
-- Goal: protect sensitive fitness/health fields at column level without breaking current reads.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS injuries_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS observations_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS preferences_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS bmi_encrypted BYTEA;

CREATE INDEX IF NOT EXISTS idx_clients_injuries_encrypted_present
    ON public.clients ((injuries_encrypted IS NOT NULL));

-- Resolve encryption key with secure-first precedence:
-- 1) Supabase Vault secret named "clinical_data_key" (when vault is available)
-- 2) DB setting app.settings.clinical_data_key (fallback)
CREATE OR REPLACE FUNCTION public.get_clinical_data_key()
RETURNS TEXT
AS $$
DECLARE
    v_key TEXT;
BEGIN
    BEGIN
        IF to_regclass('vault.decrypted_secrets') IS NOT NULL THEN
            EXECUTE
                'SELECT decrypted_secret
                   FROM vault.decrypted_secrets
                  WHERE name = ''clinical_data_key''
               ORDER BY created_at DESC
                  LIMIT 1'
            INTO v_key;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            v_key := NULL;
    END;

    IF v_key IS NULL OR length(trim(v_key)) < 16 THEN
        v_key := current_setting('app.settings.clinical_data_key', true);
    END IF;

    IF v_key IS NULL OR length(trim(v_key)) < 16 THEN
        RETURN NULL;
    END IF;

    RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_clinical_data_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_clinical_data_key() TO service_role;

CREATE OR REPLACE FUNCTION public.encrypt_clients_sensitive_columns()
RETURNS TRIGGER
AS $$
DECLARE
    v_key TEXT;
    v_bmi NUMERIC(6,2);
BEGIN
    v_key := public.get_clinical_data_key();
    IF v_key IS NULL THEN
        RETURN NEW;
    END IF;

    NEW.injuries_encrypted := pgp_sym_encrypt(
        COALESCE(NEW.injuries, ''),
        v_key,
        'cipher-algo=aes256, compress-algo=1'
    );

    NEW.observations_encrypted := pgp_sym_encrypt(
        COALESCE(NEW.observations, ''),
        v_key,
        'cipher-algo=aes256, compress-algo=1'
    );

    NEW.preferences_encrypted := pgp_sym_encrypt(
        COALESCE(NEW.preferences, ''),
        v_key,
        'cipher-algo=aes256, compress-algo=1'
    );

    v_bmi := NULL;
    IF NEW.weight IS NOT NULL AND NEW.height IS NOT NULL AND NEW.height > 0 THEN
        v_bmi := ROUND((NEW.weight / ((NEW.height / 100.0) * (NEW.height / 100.0)))::NUMERIC, 2);
    END IF;

    NEW.bmi_encrypted := pgp_sym_encrypt(
        COALESCE(v_bmi::TEXT, ''),
        v_key,
        'cipher-algo=aes256, compress-algo=1'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_encrypt_clients_sensitive_columns ON public.clients;
CREATE TRIGGER trg_encrypt_clients_sensitive_columns
BEFORE INSERT OR UPDATE OF injuries, observations, preferences, weight, height
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_clients_sensitive_columns();

-- Decrypt helper for privileged domains only (admin or owner coach)
CREATE OR REPLACE FUNCTION public.get_client_sensitive_data(
    p_client_id UUID
)
RETURNS TABLE (
    injuries TEXT,
    observations TEXT,
    preferences TEXT,
    bmi NUMERIC
)
AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
    can_access BOOLEAN := FALSE;
    v_key TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    ) INTO is_admin;

    SELECT EXISTS (
        SELECT 1
        FROM public.clients c
        WHERE c.id = p_client_id
          AND (c.coach_id = auth.uid() OR is_admin = TRUE)
    ) INTO can_access;

    IF NOT can_access THEN
        RAISE EXCEPTION 'Insufficient privileges';
    END IF;

    v_key := public.get_clinical_data_key();
    IF v_key IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        NULLIF(pgp_sym_decrypt(c.injuries_encrypted, v_key), '') AS injuries,
        NULLIF(pgp_sym_decrypt(c.observations_encrypted, v_key), '') AS observations,
        NULLIF(pgp_sym_decrypt(c.preferences_encrypted, v_key), '') AS preferences,
        NULLIF(pgp_sym_decrypt(c.bmi_encrypted, v_key), '')::NUMERIC AS bmi
    FROM public.clients c
    WHERE c.id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_client_sensitive_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_client_sensitive_data(UUID) TO authenticated;

-- Backfill encrypted columns in controlled batches.
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
    IF auth.role() = 'service_role' THEN
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

COMMENT ON COLUMN public.clients.injuries_encrypted IS 'AES-256 encrypted shadow of injuries text.';
COMMENT ON COLUMN public.clients.observations_encrypted IS 'AES-256 encrypted shadow of coach observations.';
COMMENT ON COLUMN public.clients.preferences_encrypted IS 'AES-256 encrypted shadow of training preferences.';
COMMENT ON COLUMN public.clients.bmi_encrypted IS 'AES-256 encrypted BMI snapshot derived from weight/height.';
COMMENT ON FUNCTION public.backfill_client_sensitive_encryption IS 'Backfills encrypted clinical shadows in batches.';
