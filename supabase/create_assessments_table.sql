-- Criar tabela de avaliações físicas
CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(5,2),
  body_fat DECIMAL(5,2),
  muscle_mass DECIMAL(5,2),
  visceral_fat DECIMAL(5,2),
  measures JSONB DEFAULT '{}'::jsonb,  -- Circunferências (braço, perna, peito, etc)
  skinfolds JSONB DEFAULT '{}'::jsonb, -- Dobras cutâneas
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (iguais às outras tabelas)
CREATE POLICY "Users can view their own assessments" ON assessments
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert their own assessments" ON assessments
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own assessments" ON assessments
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete their own assessments" ON assessments
  FOR DELETE USING (auth.uid() = coach_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_assessments_client ON assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(date);
