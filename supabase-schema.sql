-- ============================================
-- SCHEMA DO BANCO DE DADOS - Personal Pro
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ CLIENTS TABLE ============
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  goal VARCHAR(100) NOT NULL DEFAULT 'Saúde',
  level VARCHAR(50) NOT NULL DEFAULT 'Iniciante',
  age INTEGER,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  observations TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'at-risk')),
  adherence INTEGER DEFAULT 0 CHECK (adherence >= 0 AND adherence <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ APPOINTMENTS TABLE ============
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration VARCHAR(20) DEFAULT '1h',
  type VARCHAR(20) NOT NULL DEFAULT 'training' CHECK (type IN ('training', 'assessment', 'consultation')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ PAYMENTS TABLE ============
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  plan VARCHAR(50) NOT NULL DEFAULT 'Mensal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ WORKOUTS TABLE ============
CREATE TABLE IF NOT EXISTS workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  objective TEXT,
  duration VARCHAR(50),
  splits JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_clients_coach ON clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_appointments_coach_date ON appointments(coach_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_coach_status ON payments(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_workouts_client ON workouts(client_id);

-- ============ ROW LEVEL SECURITY (RLS) ============

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policies for clients
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = coach_id);

-- Policies for appointments
CREATE POLICY "Users can view their own appointments" ON appointments
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert their own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete their own appointments" ON appointments
  FOR DELETE USING (auth.uid() = coach_id);

-- Policies for payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own payments" ON payments
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete their own payments" ON payments
  FOR DELETE USING (auth.uid() = coach_id);

-- Policies for workouts
CREATE POLICY "Users can view their own workouts" ON workouts
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert their own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete their own workouts" ON workouts
  FOR DELETE USING (auth.uid() = coach_id);

-- ============ SAMPLE DATA (opcional) ============
-- Descomente para inserir dados de exemplo após criar uma conta

-- INSERT INTO clients (coach_id, name, email, phone, goal, level, status, adherence) VALUES
-- ('SEU_USER_ID', 'Ana Silva', 'ana@email.com', '61999999999', 'Hipertrofia', 'Intermediário', 'active', 75),
-- ('SEU_USER_ID', 'Carlos Mendes', 'carlos@email.com', '61988888888', 'Perda de Peso', 'Iniciante', 'at-risk', 40);
