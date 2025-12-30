-- ============================================
-- WORKOUTS TABLE - PersonalPro (Complete)
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Drop existing table if it exists (CUIDADO: apaga dados existentes)
-- DROP TABLE IF EXISTS workouts;

-- ============ WORKOUTS TABLE ============
CREATE TABLE IF NOT EXISTS workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    objective TEXT,
    duration VARCHAR(50),
    splits JSONB NOT NULL DEFAULT '[]',
    ai_metadata JSONB DEFAULT NULL, -- Metadata from AI generation (model, tokens, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ INDEX ============
CREATE INDEX IF NOT EXISTS idx_workouts_client ON workouts(client_id);
CREATE INDEX IF NOT EXISTS idx_workouts_coach ON workouts(coach_id);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can insert their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON workouts;

-- Create policies
CREATE POLICY "Users can view their own workouts" ON workouts
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert their own workouts" ON workouts
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own workouts" ON workouts
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete their own workouts" ON workouts
    FOR DELETE USING (auth.uid() = coach_id);
