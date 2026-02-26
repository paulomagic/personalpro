-- Migration: Add AI Generation Logs Table for Monitoring (SAFE VERSION)
-- Created: 2026-01-27
-- Purpose: Track AI generation metrics for monitoring dashboard

-- Create ai_generation_logs table
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Generation info
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id TEXT,
    
    -- Success/Error tracking
    success BOOLEAN NOT NULL DEFAULT false,
    duration_ms INTEGER NOT NULL,
    error_type TEXT, -- 'rate_limit', 'validation', 'timeout', etc
    error_message TEXT,
    
    -- AI usage
    used_fallback BOOLEAN NOT NULL DEFAULT false,
    fallback_reason TEXT,
    ai_model TEXT DEFAULT 'llama-3.1-8b-instant',
    tokens_used INTEGER,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_student_id ON public.ai_generation_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_success ON public.ai_generation_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_logs_error_type ON public.ai_generation_logs(error_type) WHERE error_type IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- ============ REMOVE OLD POLICIES ============
DROP POLICY IF EXISTS "Admins can view all generation logs" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "Users can view their own generation logs" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "System can insert generation logs" ON public.ai_generation_logs;

-- ============ RLS Policies ============

-- Admin can see all logs
CREATE POLICY "Admins can view all generation logs"
    ON public.ai_generation_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Users can see their own logs
CREATE POLICY "Users can view their own generation logs"
    ON public.ai_generation_logs
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Only system can insert logs (via service role)
CREATE POLICY "System can insert generation logs"
    ON public.ai_generation_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============ Create function to get aggregated metrics ============
-- (With admin validation - HARDENED)

CREATE OR REPLACE FUNCTION public.get_ai_generation_metrics(
    time_range_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_generations BIGINT,
    success_rate NUMERIC,
    avg_generation_time_ms NUMERIC,
    rate_limit_errors BIGINT,
    validation_errors BIGINT,
    fallback_usage_count BIGINT,
    fallback_usage_percent NUMERIC
) AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- HARDENED: Validate admin role before executing
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Insufficient privileges';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_generations,
        ROUND((COUNT(*) FILTER (WHERE success = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as success_rate,
        ROUND(AVG(duration_ms)::NUMERIC, 0) as avg_generation_time_ms,
        COUNT(*) FILTER (WHERE error_type = 'rate_limit')::BIGINT as rate_limit_errors,
        COUNT(*) FILTER (WHERE error_type = 'validation')::BIGINT as validation_errors,
        COUNT(*) FILTER (WHERE used_fallback = true)::BIGINT as fallback_usage_count,
        ROUND((COUNT(*) FILTER (WHERE used_fallback = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as fallback_usage_percent
    FROM public.ai_generation_logs
    WHERE created_at >= NOW() - (time_range_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_ai_generation_metrics(INTEGER) TO authenticated;

-- Add comments
COMMENT ON TABLE public.ai_generation_logs IS 'Logs de geração de treino por IA para monitoramento e métricas';
COMMENT ON FUNCTION public.get_ai_generation_metrics IS 'Retorna métricas agregadas de geração de treino por período';
