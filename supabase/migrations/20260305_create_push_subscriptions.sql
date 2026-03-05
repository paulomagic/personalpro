-- Migration: create push_subscriptions table
-- Created: 2026-03-05
-- Purpose: store Web Push subscriptions per authenticated user for PWA notifications.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint        TEXT NOT NULL,
    p256dh          TEXT,
    auth            TEXT,
    user_agent      TEXT,
    last_test_at    TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error      TEXT,
    failure_count   INTEGER NOT NULL DEFAULT 0,
    disabled_at     TIMESTAMPTZ,

    CONSTRAINT push_subscriptions_user_endpoint_key UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
    ON public.push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
    ON public.push_subscriptions(user_id, disabled_at)
    WHERE disabled_at IS NULL;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
    ON public.push_subscriptions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions"
    ON public.push_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push subscriptions"
    ON public.push_subscriptions
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
    ON public.push_subscriptions
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

COMMENT ON TABLE public.push_subscriptions IS 'Web Push subscriptions for authenticated PWA users.';
