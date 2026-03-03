-- Migration: AI logs retention + usage metrics by user
-- Created: 2026-03-03

-- Extra indexes for analytics and cleanup jobs
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_desc ON public.ai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_desc ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_created ON public.ai_logs(user_id, created_at DESC);

-- Cleanup function to enforce retention policy (admin only)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs(
    p_retention_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    ai_logs_deleted BIGINT,
    activity_logs_deleted BIGINT
) AS $$
DECLARE
    is_admin BOOLEAN;
    retention_days INTEGER := GREATEST(p_retention_days, 7);
    v_ai_deleted BIGINT := 0;
    v_activity_deleted BIGINT := 0;
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

    DELETE FROM public.ai_logs
    WHERE created_at < NOW() - make_interval(days => retention_days);
    GET DIAGNOSTICS v_ai_deleted = ROW_COUNT;

    DELETE FROM public.activity_logs
    WHERE created_at < NOW() - make_interval(days => retention_days);
    GET DIAGNOSTICS v_activity_deleted = ROW_COUNT;

    RETURN QUERY SELECT v_ai_deleted, v_activity_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.cleanup_old_logs(INTEGER) TO authenticated;

-- Cost/usage visibility by user (admin only)
CREATE OR REPLACE FUNCTION public.get_ai_usage_by_user(
    p_days INTEGER DEFAULT 30,
    p_limit INTEGER DEFAULT 25
)
RETURNS TABLE (
    user_id UUID,
    total_requests BIGINT,
    successful_requests BIGINT,
    success_rate NUMERIC,
    total_tokens BIGINT,
    avg_latency_ms NUMERIC,
    last_request_at TIMESTAMPTZ
) AS $$
DECLARE
    is_admin BOOLEAN;
    v_days INTEGER := GREATEST(p_days, 1);
    v_limit INTEGER := GREATEST(p_limit, 1);
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
    SELECT
        logs.user_id,
        COUNT(*)::BIGINT AS total_requests,
        COUNT(*) FILTER (WHERE logs.success = true)::BIGINT AS successful_requests,
        ROUND(
            (COUNT(*) FILTER (WHERE logs.success = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
            2
        ) AS success_rate,
        COALESCE(SUM(COALESCE(logs.tokens_input, 0) + COALESCE(logs.tokens_output, 0)), 0)::BIGINT AS total_tokens,
        ROUND(AVG(logs.latency_ms)::NUMERIC, 0) AS avg_latency_ms,
        MAX(logs.created_at) AS last_request_at
    FROM public.ai_logs AS logs
    WHERE logs.created_at >= NOW() - make_interval(days => v_days)
    GROUP BY logs.user_id
    ORDER BY total_tokens DESC, total_requests DESC
    LIMIT v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_ai_usage_by_user(INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.cleanup_old_logs IS 'Enforces retention policy for ai_logs and activity_logs (admin only).';
COMMENT ON FUNCTION public.get_ai_usage_by_user IS 'Returns AI token/request usage by user for cost monitoring (admin only).';
