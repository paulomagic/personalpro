-- Migration: Create ai_logs table
-- Created: 2026-03-03
-- Purpose: Central log table for AI router (aiRouter.ts) tracking all AI calls
--          across providers (groq, gemini, local) per action type.
--          Used by get_ai_usage_by_user() and cleanup_old_logs() RPCs.

CREATE TABLE IF NOT EXISTS public.ai_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Authenticated user who triggered the AI call
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Action / provider info
    action_type     TEXT NOT NULL DEFAULT 'unknown',   -- training_intent, insight, message, etc.
    provider_used   TEXT NOT NULL DEFAULT 'none',      -- groq, gemini, local, none
    model_used      TEXT,                              -- llama-3.3-70b-versatile, gemini-2.5-flash, etc.

    -- Prompt / response (redacted by aiRouter before insert)
    prompt          TEXT,
    response        TEXT,

    -- Token usage
    tokens_input    INTEGER,
    tokens_output   INTEGER,

    -- Performance
    latency_ms      INTEGER NOT NULL DEFAULT 0,

    -- Result
    success         BOOLEAN NOT NULL DEFAULT false,
    error_message   TEXT,

    -- Routing metadata
    metadata        JSONB DEFAULT '{}'::jsonb          -- schema_valid, fallback_used, fallback_provider, etc.
);

-- Indexes (note: 20260303_add_ai_log_retention_and_usage_metrics.sql adds more)
CREATE INDEX IF NOT EXISTS idx_ai_logs_success     ON public.ai_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_logs_action_type ON public.ai_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_provider    ON public.ai_logs(provider_used);

-- Enable Row Level Security
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all ai_logs"
    ON public.ai_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Users can view their own logs
CREATE POLICY "Users can view own ai_logs"
    ON public.ai_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Any authenticated user can insert logs (the aiRouter inserts on behalf of the current user)
CREATE POLICY "Authenticated users can insert ai_logs"
    ON public.ai_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMENT ON TABLE public.ai_logs IS 'Central AI router log table – tracks every AI provider call (groq, gemini, local) for monitoring, cost control and debugging.';
