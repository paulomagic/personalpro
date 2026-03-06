-- Migration: expand privacy operations with audit trail, self-service export datasets and cancellation flow
-- Created: 2026-03-06

CREATE TABLE IF NOT EXISTS public.privacy_request_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    privacy_request_id UUID NOT NULL REFERENCES public.privacy_requests(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_request_events_request_id
    ON public.privacy_request_events(privacy_request_id, created_at DESC);

ALTER TABLE public.privacy_request_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own privacy request events" ON public.privacy_request_events;
CREATE POLICY "Users can read own privacy request events"
    ON public.privacy_request_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.privacy_requests pr
            WHERE pr.id = privacy_request_events.privacy_request_id
              AND pr.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can read privacy request events" ON public.privacy_request_events;
CREATE POLICY "Admins can read privacy request events"
    ON public.privacy_request_events
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

DROP POLICY IF EXISTS "System can insert privacy request events" ON public.privacy_request_events;
CREATE POLICY "System can insert privacy request events"
    ON public.privacy_request_events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        actor_user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.user_profiles up
            WHERE up.id = auth.uid()
              AND up.role = 'admin'
        )
    );

ALTER TABLE public.privacy_requests
    DROP CONSTRAINT IF EXISTS privacy_requests_status_check;

ALTER TABLE public.privacy_requests
    ADD CONSTRAINT privacy_requests_status_check
    CHECK (status IN ('open', 'in_review', 'completed', 'rejected', 'cancelled'));

CREATE OR REPLACE FUNCTION public.touch_privacy_request_updated_at()
RETURNS TRIGGER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_privacy_request_updated_at ON public.privacy_requests;
CREATE TRIGGER trg_touch_privacy_request_updated_at
BEFORE UPDATE ON public.privacy_requests
FOR EACH ROW
EXECUTE FUNCTION public.touch_privacy_request_updated_at();

CREATE OR REPLACE FUNCTION public.create_privacy_request(
    p_request_type TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
AS $$
DECLARE
    v_id UUID;
    v_existing_id UUID;
BEGIN
    SELECT pr.id
      INTO v_existing_id
      FROM public.privacy_requests pr
     WHERE pr.user_id = auth.uid()
       AND pr.request_type = p_request_type
       AND pr.status IN ('open', 'in_review')
     ORDER BY pr.created_at DESC
     LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        INSERT INTO public.privacy_request_events (
            privacy_request_id,
            actor_user_id,
            event_type,
            message,
            metadata
        )
        VALUES (
            v_existing_id,
            auth.uid(),
            'deduplicated',
            'Solicitação aberta existente reutilizada.',
            jsonb_build_object('request_type', p_request_type)
        );

        RETURN v_existing_id;
    END IF;

    INSERT INTO public.privacy_requests (
        user_id,
        request_type,
        notes,
        metadata
    )
    VALUES (
        auth.uid(),
        p_request_type,
        NULLIF(trim(p_notes), ''),
        jsonb_build_object('origin', 'self_service')
    )
    RETURNING id INTO v_id;

    INSERT INTO public.privacy_request_events (
        privacy_request_id,
        actor_user_id,
        event_type,
        message,
        metadata
    )
    VALUES (
        v_id,
        auth.uid(),
        'created',
        'Solicitação criada pelo titular.',
        jsonb_build_object('request_type', p_request_type)
    );

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_privacy_request(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_privacy_request(
    p_request_id UUID
)
RETURNS BOOLEAN
AS $$
DECLARE
    v_cancelled_id UUID;
BEGIN
    UPDATE public.privacy_requests pr
       SET status = 'cancelled',
           processed_at = NOW(),
           resolution_notes = COALESCE(pr.resolution_notes, 'Cancelada pelo titular via autoatendimento.'),
           metadata = pr.metadata || jsonb_build_object(
               'cancelled_by_user', TRUE,
               'cancelled_at', NOW()
           )
     WHERE pr.id = p_request_id
       AND pr.user_id = auth.uid()
       AND pr.status = 'open'
    RETURNING pr.id INTO v_cancelled_id;

    IF v_cancelled_id IS NULL THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.privacy_request_events (
        privacy_request_id,
        actor_user_id,
        event_type,
        message
    )
    VALUES (
        v_cancelled_id,
        auth.uid(),
        'cancelled',
        'Solicitação cancelada pelo titular.'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.cancel_my_privacy_request(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.export_my_privacy_data()
RETURNS JSONB
AS $$
DECLARE
    v_profile JSONB := '{}'::jsonb;
    v_clients JSONB := '[]'::jsonb;
    v_appointments JSONB := '[]'::jsonb;
    v_payments JSONB := '[]'::jsonb;
    v_push_subscriptions JSONB := '[]'::jsonb;
    v_privacy_requests JSONB := '[]'::jsonb;
    v_privacy_events JSONB := '[]'::jsonb;
    v_ai_logs JSONB := '[]'::jsonb;
    v_activity_logs JSONB := '[]'::jsonb;
    v_export_request_id UUID;
BEGIN
    SELECT to_jsonb(up.*)
      INTO v_profile
      FROM public.user_profiles up
     WHERE up.id = auth.uid();

    IF to_regclass('public.clients') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
          INTO v_clients
          FROM (
              SELECT
                  id,
                  name,
                  email,
                  phone,
                  avatar_url,
                  goal,
                  level,
                  age,
                  weight,
                  height,
                  body_fat,
                  observations,
                  injuries,
                  preferences,
                  status,
                  adherence,
                  created_at,
                  coach_id,
                  monthly_fee,
                  payment_day,
                  payment_type,
                  session_price
              FROM public.clients
              WHERE coach_id = auth.uid()
              ORDER BY created_at DESC
              LIMIT 500
          ) c;
    END IF;

    IF to_regclass('public.appointments') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
          INTO v_appointments
          FROM (
              SELECT
                  id,
                  client_id,
                  coach_id,
                  date,
                  time,
                  duration,
                  type,
                  status,
                  notes,
                  created_at
              FROM public.appointments
              WHERE coach_id = auth.uid()
              ORDER BY date DESC, time DESC
              LIMIT 500
          ) a;
    END IF;

    IF to_regclass('public.payments') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
          INTO v_payments
          FROM (
              SELECT
                  id,
                  client_id,
                  coach_id,
                  amount,
                  due_date,
                  paid_date,
                  status,
                  plan,
                  payment_method,
                  type,
                  created_at
              FROM public.payments
              WHERE coach_id = auth.uid()
              ORDER BY created_at DESC
              LIMIT 500
          ) p;
    END IF;

    IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(ps)), '[]'::jsonb)
          INTO v_push_subscriptions
          FROM (
              SELECT
                  id,
                  created_at,
                  updated_at,
                  endpoint,
                  user_agent,
                  last_test_at,
                  last_success_at,
                  last_error,
                  failure_count,
                  disabled_at
              FROM public.push_subscriptions
              WHERE user_id = auth.uid()
              ORDER BY created_at DESC
              LIMIT 50
          ) ps;
    END IF;

    SELECT COALESCE(jsonb_agg(to_jsonb(pr)), '[]'::jsonb)
      INTO v_privacy_requests
      FROM (
          SELECT
              id,
              created_at,
              updated_at,
              request_type,
              status,
              notes,
              resolution_notes,
              processed_at,
              metadata
          FROM public.privacy_requests
          WHERE user_id = auth.uid()
          ORDER BY created_at DESC
          LIMIT 100
      ) pr;

    IF to_regclass('public.privacy_request_events') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(pre)), '[]'::jsonb)
          INTO v_privacy_events
          FROM (
              SELECT
                  pre.id,
                  pre.privacy_request_id,
                  pre.event_type,
                  pre.message,
                  pre.metadata,
                  pre.created_at
              FROM public.privacy_request_events pre
              JOIN public.privacy_requests pr
                ON pr.id = pre.privacy_request_id
             WHERE pr.user_id = auth.uid()
             ORDER BY pre.created_at DESC
             LIMIT 200
          ) pre;
    END IF;

    IF to_regclass('public.ai_logs') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(l)), '[]'::jsonb)
          INTO v_ai_logs
          FROM (
              SELECT *
              FROM public.ai_logs
              WHERE user_id = auth.uid()
              ORDER BY created_at DESC
              LIMIT 100
          ) l;
    END IF;

    IF to_regclass('public.activity_logs') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(l)), '[]'::jsonb)
          INTO v_activity_logs
          FROM (
              SELECT *
              FROM public.activity_logs
              WHERE user_id = auth.uid()
              ORDER BY created_at DESC
              LIMIT 100
          ) l;
    END IF;

    INSERT INTO public.privacy_requests (
        user_id,
        request_type,
        status,
        notes,
        resolution_notes,
        processed_at,
        metadata
    )
    VALUES (
        auth.uid(),
        'export',
        'completed',
        'Exportação gerada via autoatendimento.',
        'Arquivo LGPD gerado com sucesso.',
        NOW(),
        jsonb_build_object('origin', 'self_service_export')
    )
    RETURNING id INTO v_export_request_id;

    INSERT INTO public.privacy_request_events (
        privacy_request_id,
        actor_user_id,
        event_type,
        message,
        metadata
    )
    VALUES (
        v_export_request_id,
        auth.uid(),
        'completed',
        'Exportação LGPD gerada em autoatendimento.',
        jsonb_build_object('origin', 'self_service_export')
    );

    RETURN jsonb_build_object(
        'generated_at', NOW(),
        'user_id', auth.uid(),
        'audit', jsonb_build_object(
            'export_request_id', v_export_request_id,
            'channel', 'self_service'
        ),
        'profile', COALESCE(v_profile, '{}'::jsonb),
        'summary', jsonb_build_object(
            'clients_count', jsonb_array_length(v_clients),
            'appointments_count', jsonb_array_length(v_appointments),
            'payments_count', jsonb_array_length(v_payments),
            'push_subscriptions_count', jsonb_array_length(v_push_subscriptions),
            'privacy_requests_count', jsonb_array_length(v_privacy_requests),
            'privacy_events_count', jsonb_array_length(v_privacy_events),
            'ai_logs_count', jsonb_array_length(v_ai_logs),
            'activity_logs_count', jsonb_array_length(v_activity_logs)
        ),
        'datasets', jsonb_build_object(
            'clients', v_clients,
            'appointments', v_appointments,
            'payments', v_payments,
            'push_subscriptions', v_push_subscriptions,
            'privacy_requests', v_privacy_requests,
            'privacy_request_events', v_privacy_events,
            'ai_logs', v_ai_logs,
            'activity_logs', v_activity_logs
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.export_my_privacy_data() TO authenticated;

COMMENT ON TABLE public.privacy_request_events IS 'Immutable audit trail for privacy request lifecycle events.';
COMMENT ON FUNCTION public.cancel_my_privacy_request(UUID) IS 'Cancels an open privacy request owned by the authenticated user.';
COMMENT ON FUNCTION public.export_my_privacy_data() IS 'Returns a self-service LGPD export payload with datasets and records the export in the audit trail.';
