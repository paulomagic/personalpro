-- ============================================
-- RESCHEDULE REQUESTS - Sistema de Reagendamento
-- Execute no Supabase SQL Editor
-- ============================================

-- ============ TABELA DE SOLICITAÇÕES DE REAGENDAMENTO ============
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_date TIMESTAMP WITH TIME ZONE NOT NULL,
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  response_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_reschedule_coach ON reschedule_requests(coach_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_status ON reschedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_reschedule_client ON reschedule_requests(client_id);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;

-- Coaches can view all their requests
CREATE POLICY "Coaches can view their reschedule requests" ON reschedule_requests
  FOR SELECT USING (auth.uid() = coach_id);

-- Coaches can update (approve/reject) their requests
CREATE POLICY "Coaches can update their reschedule requests" ON reschedule_requests
  FOR UPDATE USING (auth.uid() = coach_id);

-- Students can view their own requests
CREATE POLICY "Students can view their reschedule requests" ON reschedule_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'student'
        AND up.client_id = reschedule_requests.client_id
    )
  );

-- Students can create reschedule requests
CREATE POLICY "Students can create reschedule requests" ON reschedule_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'student'
        AND up.client_id = reschedule_requests.client_id
    )
  );

-- ============ RLS PARA ALUNOS VEREM APPOINTMENTS ============
-- Students can view their own appointments (based on client_id)
CREATE POLICY "Students can view their appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'student'
        AND up.client_id = appointments.client_id
    )
  );

-- ============ COMMENTS ============
COMMENT ON TABLE reschedule_requests IS 'Stores reschedule requests from students pending coach approval';
COMMENT ON COLUMN reschedule_requests.status IS 'pending = awaiting response, approved = date changed, rejected = not approved';
