-- ============================================
-- EXERCISES DOMAIN SCHEMA - Personal Pro
-- Fase 1: Tabela única com biomecânica inline
-- Execute no Supabase SQL Editor
-- ============================================

-- Enable UUID extension (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ TABELA EXERCISES ============
-- Entidade central do domínio
-- IA trabalha com movement_pattern + primary_muscle
-- Nunca com nomes de exercícios

CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT, -- Para futuro i18n
  
  -- Categorização
  category TEXT NOT NULL CHECK (category IN ('forca', 'cardio', 'mobilidade', 'core')),
  difficulty TEXT NOT NULL DEFAULT 'intermediario' CHECK (difficulty IN ('iniciante', 'intermediario', 'avancado', 'atleta')),
  
  -- Músculos
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] DEFAULT '{}',
  
  -- Padrão de Movimento (linguagem da IA)
  movement_pattern TEXT NOT NULL CHECK (movement_pattern IN (
    'empurrar_horizontal',  -- supino, flexão
    'empurrar_vertical',    -- desenvolvimento
    'puxar_horizontal',     -- remada
    'puxar_vertical',       -- puxada
    'agachar',              -- agachamento, leg press
    'hinge',                -- stiff, levantamento terra
    'core'                  -- prancha, abdominal
  )),
  
  -- Equipamentos
  equipment TEXT[] DEFAULT '{}', -- halter, barra, maquina, cabo, peso_corporal
  
  -- Flags
  is_compound BOOLEAN DEFAULT false,
  is_unilateral BOOLEAN DEFAULT false,
  is_machine BOOLEAN DEFAULT false,
  
  -- Biomecânica inline (evita join)
  spinal_load TEXT NOT NULL CHECK (spinal_load IN ('baixo', 'moderado', 'alto')),
  stability_demand TEXT NOT NULL CHECK (stability_demand IN ('baixo', 'moderado', 'alto')),
  
  -- Restrições inline (evita join)
  -- Lesões que devem EVITAR este exercício
  avoid_for_injuries TEXT[] DEFAULT '{}', -- ombro, joelho, coluna, cotovelo, punho
  -- Lesões que exigem CUIDADO
  caution_for_injuries TEXT[] DEFAULT '{}',
  
  -- Instruções
  execution_tips TEXT,
  video_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ÍNDICES ============
-- Índice principal para resolução IA
CREATE INDEX IF NOT EXISTS idx_exercises_resolve 
ON exercises(movement_pattern, primary_muscle);

-- Índice para busca textual
CREATE INDEX IF NOT EXISTS idx_exercises_name 
ON exercises USING gin(to_tsvector('portuguese', name));

-- Índice para filtro por equipamento
CREATE INDEX IF NOT EXISTS idx_exercises_equipment 
ON exercises USING gin(equipment);

-- Índice para filtro por lesões
CREATE INDEX IF NOT EXISTS idx_exercises_injuries 
ON exercises USING gin(avoid_for_injuries);

-- ============ RLS ============
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Leitura pública para todos (exercícios são globais)
CREATE POLICY "Public read exercises"
ON exercises FOR SELECT
USING (true);

-- Edição apenas para admins
-- Nota: requer user_profiles.role = 'admin'
CREATE POLICY "Admin can manage exercises"
ON exercises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============ TRIGGER UPDATED_AT ============
CREATE OR REPLACE FUNCTION update_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exercises_updated_at
BEFORE UPDATE ON exercises
FOR EACH ROW
EXECUTE FUNCTION update_exercises_updated_at();

-- ============ COMENTÁRIOS ============
COMMENT ON TABLE exercises IS 'Entidade de domínio para exercícios. IA resolve por intenção (movement_pattern + muscle), nunca por nome.';
COMMENT ON COLUMN exercises.movement_pattern IS 'Padrão biomecânico - usado pela IA para resolver exercícios por intenção';
COMMENT ON COLUMN exercises.avoid_for_injuries IS 'Lesões que devem evitar completamente este exercício';
COMMENT ON COLUMN exercises.caution_for_injuries IS 'Lesões que exigem cuidado/adaptação';
