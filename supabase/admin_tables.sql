-- ================================================
-- PERSONAL PRO ADMIN - Tabelas de Logs
-- Execute este SQL no Supabase SQL Editor
-- ================================================

-- Tabela de Logs de IA (detalhe completo)
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'generate_workout', 'refine', 'regenerate_exercise', 'insight', 'message_template'
  model_used TEXT, -- 'gemini-2.5-flash', 'gemini-2.5-flash-lite'
  prompt TEXT,
  response TEXT,
  tokens_input INT,
  tokens_output INT,
  latency_ms INT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB -- { feedback: 'up'|'down', client_id, client_name, etc }
);

-- Tabela de Logs de Atividade
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'login', 'logout', 'create_workout', 'save_workout', 'create_client', 'update_client', 'create_assessment'
  resource_type TEXT, -- 'workout', 'client', 'assessment', 'session'
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB -- detalhes extras
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_action ON ai_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_success ON ai_logs(success);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- RLS (Row Level Security) - Admin pode ver tudo
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: Para simplificar, permitir acesso total (ajustar depois se necessário)
DROP POLICY IF EXISTS "Admin can view all ai_logs" ON ai_logs;
CREATE POLICY "Admin can view all ai_logs" ON ai_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin can view all activity_logs" ON activity_logs;
CREATE POLICY "Admin can view all activity_logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert own ai_logs" ON ai_logs;
CREATE POLICY "Users can insert own ai_logs" ON ai_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity_logs" ON activity_logs;
CREATE POLICY "Users can insert own activity_logs" ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ================================================
-- Verificação: Listar tabelas criadas
-- ================================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('ai_logs', 'activity_logs');
