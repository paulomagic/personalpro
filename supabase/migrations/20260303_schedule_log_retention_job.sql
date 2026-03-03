-- Migration: schedule automatic retention cleanup for logs
-- Created: 2026-03-03

-- Internal/system cleanup function callable by scheduler (no auth.uid dependency)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs_system(
    p_retention_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    ai_logs_deleted BIGINT,
    activity_logs_deleted BIGINT
) AS $$
DECLARE
    retention_days INTEGER := GREATEST(p_retention_days, 7);
    v_ai_deleted BIGINT := 0;
    v_activity_deleted BIGINT := 0;
BEGIN
    DELETE FROM public.ai_logs
    WHERE created_at < NOW() - make_interval(days => retention_days);
    GET DIAGNOSTICS v_ai_deleted = ROW_COUNT;

    DELETE FROM public.activity_logs
    WHERE created_at < NOW() - make_interval(days => retention_days);
    GET DIAGNOSTICS v_activity_deleted = ROW_COUNT;

    RETURN QUERY SELECT v_ai_deleted, v_activity_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.cleanup_old_logs_system(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs_system(INTEGER) TO service_role;

-- Keep authenticated admin entrypoint, but delegate execution to system function.
CREATE OR REPLACE FUNCTION public.cleanup_old_logs(
    p_retention_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    ai_logs_deleted BIGINT,
    activity_logs_deleted BIGINT
) AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Insufficient privileges';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.cleanup_old_logs_system(p_retention_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.cleanup_old_logs(INTEGER) TO authenticated;

-- Try to enable pg_cron (when available on project)
DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_cron;
    EXCEPTION
        WHEN undefined_file THEN
            RAISE NOTICE 'pg_cron extension not available in this environment';
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'Insufficient privilege to create pg_cron extension';
    END;
END;
$$;

-- Schedule daily retention cleanup at 03:20 UTC (00:20 America/Sao_Paulo in standard time)
DO $$
DECLARE
    existing_job_id BIGINT;
BEGIN
    IF to_regnamespace('cron') IS NULL THEN
        RAISE NOTICE 'cron schema not available; retention schedule not created';
        RETURN;
    END IF;

    SELECT jobid
      INTO existing_job_id
      FROM cron.job
     WHERE jobname = 'personalpro_cleanup_old_logs_daily'
     LIMIT 1;

    IF existing_job_id IS NOT NULL THEN
        PERFORM cron.unschedule(existing_job_id);
    END IF;

    PERFORM cron.schedule(
        'personalpro_cleanup_old_logs_daily',
        '20 3 * * *',
        'SELECT public.cleanup_old_logs_system(90);'
    );
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_logs_system IS 'System log retention cleanup for scheduler/service role.';
