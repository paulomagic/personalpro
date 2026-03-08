-- Migration: add auditable privacy consents and include them in self-service export

CREATE TABLE IF NOT EXISTS public.privacy_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT false,
    version TEXT NOT NULL DEFAULT '2026-03-08',
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT privacy_consents_user_type_unique UNIQUE (user_id, consent_type),
    CONSTRAINT privacy_consents_type_check CHECK (
        consent_type IN ('privacy_policy', 'ai_data_processing', 'clinical_data_processing')
    )
);

CREATE INDEX IF NOT EXISTS idx_privacy_consents_user_id
    ON public.privacy_consents(user_id, updated_at DESC);

ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own privacy consents" ON public.privacy_consents;
CREATE POLICY "Users can read own privacy consents"
    ON public.privacy_consents
    FOR SELECT
    USING (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.touch_privacy_consents_updated_at();
CREATE OR REPLACE FUNCTION public.touch_privacy_consents_updated_at()
RETURNS TRIGGER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_privacy_consents_updated_at ON public.privacy_consents;
CREATE TRIGGER trg_touch_privacy_consents_updated_at
BEFORE UPDATE ON public.privacy_consents
FOR EACH ROW
EXECUTE FUNCTION public.touch_privacy_consents_updated_at();

CREATE OR REPLACE FUNCTION public.upsert_my_privacy_consent(
    p_consent_type TEXT,
    p_granted BOOLEAN,
    p_version TEXT DEFAULT '2026-03-08',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.privacy_consents
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_row public.privacy_consents;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_consent_type NOT IN ('privacy_policy', 'ai_data_processing', 'clinical_data_processing') THEN
        RAISE EXCEPTION 'Unsupported consent type: %', p_consent_type;
    END IF;

    INSERT INTO public.privacy_consents (
        user_id,
        consent_type,
        granted,
        version,
        granted_at,
        revoked_at,
        metadata
    )
    VALUES (
        v_user_id,
        p_consent_type,
        p_granted,
        COALESCE(NULLIF(TRIM(p_version), ''), '2026-03-08'),
        CASE WHEN p_granted THEN NOW() ELSE NULL END,
        CASE WHEN p_granted THEN NULL ELSE NOW() END,
        COALESCE(p_metadata, '{}'::jsonb)
    )
    ON CONFLICT (user_id, consent_type)
    DO UPDATE SET
        granted = EXCLUDED.granted,
        version = EXCLUDED.version,
        granted_at = CASE
            WHEN EXCLUDED.granted THEN NOW()
            ELSE public.privacy_consents.granted_at
        END,
        revoked_at = CASE
            WHEN EXCLUDED.granted THEN NULL
            ELSE NOW()
        END,
        metadata = COALESCE(EXCLUDED.metadata, public.privacy_consents.metadata),
        updated_at = NOW()
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.upsert_my_privacy_consent(TEXT, BOOLEAN, TEXT, JSONB) TO authenticated;

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
    v_privacy_consents JSONB := '[]'::jsonb;
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

    IF to_regclass('public.privacy_consents') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(pc)), '[]'::jsonb)
          INTO v_privacy_consents
          FROM (
              SELECT
                  consent_type,
                  granted,
                  version,
                  granted_at,
                  revoked_at,
                  updated_at,
                  metadata
              FROM public.privacy_consents
              WHERE user_id = auth.uid()
              ORDER BY updated_at DESC
          ) pc;
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
            'privacy_consents_count', jsonb_array_length(v_privacy_consents),
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
            'privacy_consents', v_privacy_consents,
            'ai_logs', v_ai_logs,
            'activity_logs', v_activity_logs
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.export_my_privacy_data() TO authenticated;

COMMENT ON TABLE public.privacy_consents IS 'Tracks auditable privacy consents granted or revoked by authenticated users.';
COMMENT ON FUNCTION public.upsert_my_privacy_consent(TEXT, BOOLEAN, TEXT, JSONB) IS 'Creates or updates the authenticated user privacy consent state.';
