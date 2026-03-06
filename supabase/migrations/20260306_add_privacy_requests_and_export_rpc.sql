-- Migration: privacy requests + self-service export summary
-- Created: 2026-03-06

CREATE TABLE IF NOT EXISTS public.privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('access', 'export', 'delete', 'rectify')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'completed', 'rejected')),
    notes TEXT,
    resolution_notes TEXT,
    processed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_user_id
    ON public.privacy_requests(user_id, created_at DESC);

ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own privacy requests" ON public.privacy_requests;
CREATE POLICY "Users can read own privacy requests"
    ON public.privacy_requests
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own privacy requests" ON public.privacy_requests;
CREATE POLICY "Users can create own privacy requests"
    ON public.privacy_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read privacy requests" ON public.privacy_requests;
CREATE POLICY "Admins can read privacy requests"
    ON public.privacy_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles up
            WHERE up.id = auth.uid()
              AND up.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update privacy requests" ON public.privacy_requests;
CREATE POLICY "Admins can update privacy requests"
    ON public.privacy_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles up
            WHERE up.id = auth.uid()
              AND up.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_profiles up
            WHERE up.id = auth.uid()
              AND up.role = 'admin'
        )
    );

CREATE OR REPLACE FUNCTION public.create_privacy_request(
    p_request_type TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.privacy_requests (user_id, request_type, notes)
    VALUES (auth.uid(), p_request_type, NULLIF(trim(p_notes), ''))
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_privacy_request(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.export_my_privacy_data()
RETURNS JSONB
AS $$
DECLARE
    v_profile JSONB := '{}'::jsonb;
    v_client_count INTEGER := 0;
    v_ai_logs_count INTEGER := 0;
    v_activity_logs_count INTEGER := 0;
    v_push_subscriptions_count INTEGER := 0;
    v_privacy_requests_count INTEGER := 0;
BEGIN
    SELECT to_jsonb(up.*)
      INTO v_profile
      FROM public.user_profiles up
     WHERE up.id = auth.uid();

    IF to_regclass('public.clients') IS NOT NULL THEN
        SELECT COUNT(*)
          INTO v_client_count
          FROM public.clients c
         WHERE c.coach_id = auth.uid();
    END IF;

    IF to_regclass('public.ai_logs') IS NOT NULL THEN
        SELECT COUNT(*)
          INTO v_ai_logs_count
          FROM public.ai_logs l
         WHERE l.user_id = auth.uid();
    END IF;

    IF to_regclass('public.activity_logs') IS NOT NULL THEN
        SELECT COUNT(*)
          INTO v_activity_logs_count
          FROM public.activity_logs l
         WHERE l.user_id = auth.uid();
    END IF;

    IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
        SELECT COUNT(*)
          INTO v_push_subscriptions_count
          FROM public.push_subscriptions ps
         WHERE ps.user_id = auth.uid()
           AND ps.disabled_at IS NULL;
    END IF;

    SELECT COUNT(*)
      INTO v_privacy_requests_count
      FROM public.privacy_requests pr
     WHERE pr.user_id = auth.uid();

    RETURN jsonb_build_object(
        'generated_at', NOW(),
        'user_id', auth.uid(),
        'profile', COALESCE(v_profile, '{}'::jsonb),
        'summary', jsonb_build_object(
            'client_count', v_client_count,
            'ai_logs_count', v_ai_logs_count,
            'activity_logs_count', v_activity_logs_count,
            'push_subscriptions_count', v_push_subscriptions_count,
            'privacy_requests_count', v_privacy_requests_count
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.export_my_privacy_data() TO authenticated;

COMMENT ON TABLE public.privacy_requests IS 'Tracks LGPD/privacy requests opened by authenticated users.';
COMMENT ON FUNCTION public.create_privacy_request(TEXT, TEXT) IS 'Creates a privacy request for the authenticated user.';
COMMENT ON FUNCTION public.export_my_privacy_data() IS 'Returns a self-service privacy export summary for the authenticated user.';
