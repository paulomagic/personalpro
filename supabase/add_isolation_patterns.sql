-- ============================================
-- MIGRATION: Adicionar patterns de isolamento
-- Execute ANTES do exercises_seed.sql
-- ============================================

-- 1. Remover constraint antigo
ALTER TABLE exercises 
DROP CONSTRAINT IF EXISTS exercises_movement_pattern_check;

-- 2. Adicionar constraint com novos patterns
ALTER TABLE exercises 
ADD CONSTRAINT exercises_movement_pattern_check 
CHECK (movement_pattern IN (
    -- Compostos
    'empurrar_horizontal',
    'empurrar_vertical',
    'puxar_horizontal',
    'puxar_vertical',
    'agachar',
    'hinge',
    'core',
    -- Isolados (NOVOS)
    'isolar_biceps',
    'isolar_triceps',
    'isolar_ombro',
    'isolar_panturrilha',
    'isolar_antebraco'
));

-- Verificar
SELECT 'Constraint atualizado! Agora execute o exercises_seed.sql' as status;
