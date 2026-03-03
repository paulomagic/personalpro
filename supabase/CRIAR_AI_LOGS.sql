-- ============================================
-- COLE NO SUPABASE SQL EDITOR
-- Fix: Criar tabela ai_logs para o AI Router
-- ============================================

-- 1. Criar tabela ai_logs (se não existir)
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type     TEXT NOT NULL DEFAULT 'unknown',
    provider_used   TEXT NOT NULL DEFAULT 'none',
    model_used      TEXT,
    prompt          TEXT,
    response        TEXT,
    tokens_input    INTEGER,
    tokens_output   INTEGER,
    latency_ms      INTEGER NOT NULL DEFAULT 0,
    success         BOOLEAN NOT NULL DEFAULT false,
    error_message   TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_desc  ON public.ai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_created  ON public.ai_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_success_2     ON public.ai_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_logs_action_type   ON public.ai_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_provider      ON public.ai_logs(provider_used);

-- 3. Enable RLS
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Admins can view all ai_logs" ON public.ai_logs;
DROP POLICY IF EXISTS "Users can view own ai_logs" ON public.ai_logs;
DROP POLICY IF EXISTS "Authenticated users can insert ai_logs" ON public.ai_logs;

CREATE POLICY "Admins can view all ai_logs"
    ON public.ai_logs FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view own ai_logs"
    ON public.ai_logs FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert ai_logs"
    ON public.ai_logs FOR INSERT TO authenticated
    WITH CHECK (true);

-- 5. Verificação
SELECT 'Tabela ai_logs criada com sucesso!' as status;
SELECT COUNT(*) as total_logs FROM public.ai_logs;
