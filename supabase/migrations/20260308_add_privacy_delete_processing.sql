-- Migration: operational delete request readiness + controlled backend processing
-- Created: 2026-03-08

CREATE OR REPLACE FUNCTION public.is_privacy_admin_executor()
RETURNS BOOLEAN
AS $$
DECLARE
    v_is_admin BOOLEAN := FALSE;
BEGIN
    IF current_user = 'postgres' OR auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND up.role = 'admin'
    )
    INTO v_is_admin;

    RETURN v_is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.is_privacy_admin_executor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_privacy_admin_executor() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_privacy_delete_readiness()
RETURNS JSONB
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile_exists BOOLEAN := FALSE;
    v_clients_count INTEGER := 0;
    v_appointments_count INTEGER := 0;
    v_payments_count INTEGER := 0;
    v_push_subscriptions_count INTEGER := 0;
    v_ai_logs_count INTEGER := 0;
    v_activity_logs_count INTEGER := 0;
    v_privacy_consents_count INTEGER := 0;
    v_open_delete_request_id UUID := NULL;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = v_user_id
    )
    INTO v_profile_exists;

    IF to_regclass('public.clients') IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_clients_count
        FROM public.clients
        WHERE coach_id = v_user_id;
    END IF;

    IF to_regclass('public.appointments') IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_appointments_count
        FROM public.appointments
        WHERE coach_id = v_user_id;
    END IF;

    IF to_regclass('public.payments') IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_payments_count
        FROM public.payments
        WHERE coach_id = v_user_id;
    END IF;

    IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_push_subscriptions_count
        FROM public.push_subscriptions
        WHERE user_id = v_user_id;
    END IF;

    IF to_regclass('public.ai_logs') IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_ai_logs_count
        FROM public.ai_logs
        WHERE user_id = v_user_id;
    END IF;

    IF to_regclass('public.activity_logs') IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_activity_logs_count
        FROM public.activity_logs
        WHERE user_id = v_user_id;
    END IF;

    IF to_regclass('public.privacy_consents') IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_privacy_consents_count
        FROM public.privacy_consents
        WHERE user_id = v_user_id;
    END IF;

    SELECT pr.id
      INTO v_open_delete_request_id
      FROM public.privacy_requests pr
     WHERE pr.user_id = v_user_id
       AND pr.request_type = 'delete'
       AND pr.status IN ('open', 'in_review')
     ORDER BY pr.created_at DESC
     LIMIT 1;

    RETURN jsonb_build_object(
        'profile_exists', v_profile_exists,
        'clients_count', v_clients_count,
        'appointments_count', v_appointments_count,
        'payments_count', v_payments_count,
        'push_subscriptions_count', v_push_subscriptions_count,
        'ai_logs_count', v_ai_logs_count,
        'activity_logs_count', v_activity_logs_count,
        'privacy_consents_count', v_privacy_consents_count,
        'has_open_delete_request', v_open_delete_request_id IS NOT NULL,
        'open_delete_request_id', v_open_delete_request_id,
        'deletion_mode', 'application_data_erasure'
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_my_privacy_delete_readiness() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_complete_delete_privacy_request(
    p_request_id UUID,
    p_resolution_notes TEXT DEFAULT NULL
)
RETURNS JSONB
AS $$
DECLARE
    v_request RECORD;
    v_user_id UUID;
    v_clients_anonymized INTEGER := 0;
    v_appointments_deleted INTEGER := 0;
    v_payments_deleted INTEGER := 0;
    v_push_deleted INTEGER := 0;
    v_ai_logs_deleted INTEGER := 0;
    v_activity_logs_deleted INTEGER := 0;
    v_profile_deleted INTEGER := 0;
    v_payload JSONB;
BEGIN
    IF NOT public.is_privacy_admin_executor() THEN
        RAISE EXCEPTION 'Insufficient privileges';
    END IF;

    SELECT pr.*
      INTO v_request
      FROM public.privacy_requests pr
     WHERE pr.id = p_request_id
       AND pr.request_type = 'delete'
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Delete privacy request not found';
    END IF;

    IF v_request.status IN ('completed', 'cancelled', 'rejected') THEN
        RAISE EXCEPTION 'Delete privacy request is already closed';
    END IF;

    v_user_id := v_request.user_id;

    IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
        DELETE FROM public.push_subscriptions WHERE user_id = v_user_id;
        GET DIAGNOSTICS v_push_deleted = ROW_COUNT;
    END IF;

    IF to_regclass('public.ai_logs') IS NOT NULL THEN
        DELETE FROM public.ai_logs WHERE user_id = v_user_id;
        GET DIAGNOSTICS v_ai_logs_deleted = ROW_COUNT;
    END IF;

    IF to_regclass('public.activity_logs') IS NOT NULL THEN
        DELETE FROM public.activity_logs WHERE user_id = v_user_id;
        GET DIAGNOSTICS v_activity_logs_deleted = ROW_COUNT;
    END IF;

    IF to_regclass('public.appointments') IS NOT NULL THEN
        DELETE FROM public.appointments WHERE coach_id = v_user_id;
        GET DIAGNOSTICS v_appointments_deleted = ROW_COUNT;
    END IF;

    IF to_regclass('public.payments') IS NOT NULL THEN
        DELETE FROM public.payments WHERE coach_id = v_user_id;
        GET DIAGNOSTICS v_payments_deleted = ROW_COUNT;
    END IF;

    IF to_regclass('public.clients') IS NOT NULL THEN
        UPDATE public.clients
           SET name = CONCAT('Cliente removido ', LEFT(id::TEXT, 8)),
               email = NULL,
               phone = NULL,
               avatar_url = NULL,
               goal = NULL,
               observations = NULL,
               injuries = NULL,
               preferences = NULL,
               monthly_fee = NULL,
               payment_day = NULL,
               payment_type = NULL,
               session_price = NULL,
               injuries_encrypted = NULL,
               observations_encrypted = NULL,
               preferences_encrypted = NULL,
               bmi_encrypted = NULL
         WHERE coach_id = v_user_id;
        GET DIAGNOSTICS v_clients_anonymized = ROW_COUNT;
    END IF;

    IF to_regclass('public.user_profiles') IS NOT NULL THEN
        DELETE FROM public.user_profiles WHERE id = v_user_id;
        GET DIAGNOSTICS v_profile_deleted = ROW_COUNT;
    END IF;

    v_payload := jsonb_build_object(
        'user_id', v_user_id,
        'deletion_mode', 'application_data_erasure',
        'clients_anonymized', v_clients_anonymized,
        'appointments_deleted', v_appointments_deleted,
        'payments_deleted', v_payments_deleted,
        'push_subscriptions_deleted', v_push_deleted,
        'ai_logs_deleted', v_ai_logs_deleted,
        'activity_logs_deleted', v_activity_logs_deleted,
        'profile_deleted', v_profile_deleted
    );

    UPDATE public.privacy_requests pr
       SET status = 'completed',
           processed_at = NOW(),
           resolution_notes = COALESCE(
               NULLIF(trim(p_resolution_notes), ''),
               'Exclusão operacional concluída com anonimização e limpeza de dados de aplicação.'
           ),
           metadata = COALESCE(pr.metadata, '{}'::jsonb) || jsonb_build_object(
               'processed_by', COALESCE(auth.uid()::TEXT, current_user),
               'processed_at', NOW(),
               'delete_processing', v_payload
           )
     WHERE pr.id = p_request_id;

    INSERT INTO public.privacy_request_events (
        privacy_request_id,
        actor_user_id,
        event_type,
        message,
        metadata
    )
    VALUES (
        p_request_id,
        auth.uid(),
        'completed',
        'Exclusão operacional concluída com anonimização dos dados de aplicação.',
        v_payload
    );

    RETURN v_payload;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_complete_delete_privacy_request(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_complete_delete_privacy_request(UUID, TEXT) TO service_role;

COMMENT ON FUNCTION public.get_my_privacy_delete_readiness() IS 'Returns the current user delete-request readiness summary and application-data scope.';
COMMENT ON FUNCTION public.admin_complete_delete_privacy_request(UUID, TEXT) IS 'Completes a delete privacy request with application-data erasure/anonymization for the target user.';
