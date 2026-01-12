-- ============================================
-- MONTHLY SCHEDULE SCHEMA
-- Agendamento Mensal - PersonalPro
-- ============================================

-- ============ MONTHLY SCHEDULE TEMPLATES TABLE ============
-- Armazena templates de agendamento mensal para reutilização
CREATE TABLE IF NOT EXISTS monthly_schedule_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Template metadata
  name VARCHAR(255),  -- Ex: "Camila - Padrão Janeiro"
  
  -- Pattern configuration
  pattern_type VARCHAR(20) NOT NULL CHECK (pattern_type IN ('weekly', 'custom', 'specific_dates')),
  week_days INTEGER[],  -- [1,3,5] para SEG/QUA/SEX (1=SEG, 7=DOM)
  times JSONB,  -- {"1": "14:00", "3": "14:00", "5": "16:00"}
  
  -- Session details
  session_type VARCHAR(20) DEFAULT 'training' CHECK (session_type IN ('training', 'assessment', 'consultation')),
  duration VARCHAR(20) DEFAULT '1h',
  
  -- Usage tracking
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ MONTHLY SCHEDULE BATCHES TABLE ============
-- Rastreia batches de agendamentos mensais criados (permite edição em massa)
CREATE TABLE IF NOT EXISTS monthly_schedule_batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Batch metadata
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  total_sessions INTEGER NOT NULL DEFAULT 0,
  
  -- Reference to template used (optional)
  template_id UUID REFERENCES monthly_schedule_templates(id) ON DELETE SET NULL,
  
  -- Pattern info (denormalized for quick access)
  pattern_type VARCHAR(20),
  week_days INTEGER[],
  times JSONB,
  session_type VARCHAR(20) DEFAULT 'training',
  duration VARCHAR(20) DEFAULT '1h',
  
  -- Track exceptions
  exceptions JSONB DEFAULT '[]',  -- ["2026-01-25", "2026-01-30"]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ UPDATE APPOINTMENTS TABLE ============
-- Adicionar coluna batch_id para vincular appointments a batches mensais
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='appointments' AND column_name='batch_id'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN batch_id UUID REFERENCES monthly_schedule_batches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_monthly_templates_coach_client 
  ON monthly_schedule_templates(coach_id, client_id);

CREATE INDEX IF NOT EXISTS idx_monthly_templates_active 
  ON monthly_schedule_templates(coach_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_monthly_batches_client_date 
  ON monthly_schedule_batches(client_id, year, month);

CREATE INDEX IF NOT EXISTS idx_monthly_batches_coach 
  ON monthly_schedule_batches(coach_id, year, month);

CREATE INDEX IF NOT EXISTS idx_appointments_batch 
  ON appointments(batch_id) 
  WHERE batch_id IS NOT NULL;

-- ============ ROW LEVEL SECURITY (RLS) ============

-- Enable RLS
ALTER TABLE monthly_schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_schedule_batches ENABLE ROW LEVEL SECURITY;

-- Policies for monthly_schedule_templates
CREATE POLICY "Users can view their own templates" ON monthly_schedule_templates
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert their own templates" ON monthly_schedule_templates
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own templates" ON monthly_schedule_templates
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete their own templates" ON monthly_schedule_templates
  FOR DELETE USING (auth.uid() = coach_id);

-- Policies for monthly_schedule_batches
CREATE POLICY "Users can view their own batches" ON monthly_schedule_batches
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert their own batches" ON monthly_schedule_batches
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own batches" ON monthly_schedule_batches
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete their own batches" ON monthly_schedule_batches
  FOR DELETE USING (auth.uid() = coach_id);

-- ============ HELPER FUNCTIONS ============

-- Function to update batch updated_at timestamp
CREATE OR REPLACE FUNCTION update_batch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_batch_timestamp ON monthly_schedule_batches;
CREATE TRIGGER trigger_update_batch_timestamp
  BEFORE UPDATE ON monthly_schedule_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_updated_at();

-- Function to update total_sessions count in batch
CREATE OR REPLACE FUNCTION update_batch_total_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_sessions when appointments are added/removed
  IF TG_OP = 'INSERT' THEN
    UPDATE monthly_schedule_batches 
    SET total_sessions = (
      SELECT COUNT(*) FROM appointments WHERE batch_id = NEW.batch_id
    )
    WHERE id = NEW.batch_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE monthly_schedule_batches 
    SET total_sessions = (
      SELECT COUNT(*) FROM appointments WHERE batch_id = OLD.batch_id
    )
    WHERE id = OLD.batch_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update total_sessions (separate triggers for INSERT and DELETE)
DROP TRIGGER IF EXISTS trigger_update_batch_count_insert ON appointments;
CREATE TRIGGER trigger_update_batch_count_insert
  AFTER INSERT ON appointments
  FOR EACH ROW
  WHEN (NEW.batch_id IS NOT NULL)
  EXECUTE FUNCTION update_batch_total_sessions();

DROP TRIGGER IF EXISTS trigger_update_batch_count_delete ON appointments;
CREATE TRIGGER trigger_update_batch_count_delete
  AFTER DELETE ON appointments
  FOR EACH ROW
  WHEN (OLD.batch_id IS NOT NULL)
  EXECUTE FUNCTION update_batch_total_sessions();

