-- ============================================
-- CORREÇÃO CRÍTICA: Metadata de Exercícios
-- Execute no Supabase SQL Editor
-- Data: 2026-01-20
-- ============================================

-- 1. BLOQUEIO DE HACK SQUAT (Crítico para Artrose de Quadril e Joelho)
-- Adiciona a tag 'quadril' (Hack gera alta compressão no quadril em flexão profunda)
UPDATE exercises 
SET avoid_for_injuries = array_append(avoid_for_injuries, 'quadril')
WHERE name ILIKE '%hack%' 
  AND NOT ('quadril' = ANY(COALESCE(avoid_for_injuries, '{}')));

-- 2. BLOQUEIO DE CABLE CRUNCH (Crítico para Osteopenia/Hérnia/Idosos)
-- Adiciona a tag 'coluna' (flexão espinhal sob carga = risco)
UPDATE exercises 
SET avoid_for_injuries = array_append(avoid_for_injuries, 'coluna')
WHERE (name ILIKE '%cable crunch%' OR name ILIKE '%abdominal%cabo%' OR name ILIKE '%crunch%')
  AND NOT ('coluna' = ANY(COALESCE(avoid_for_injuries, '{}')));

-- 3. BÔNUS PREVENTIVO: LEG PRESS 45 (Artrose Severa)
-- Leg 45 força retroversão pélvica em amplitude profunda
UPDATE exercises 
SET caution_for_injuries = array_append(caution_for_injuries, 'quadril')
WHERE name ILIKE '%leg press 45%'
  AND NOT ('quadril' = ANY(COALESCE(caution_for_injuries, '{}')));

-- 4. BLOQUEAR AGACHAMENTOS PROFUNDOS PARA ARTROSE
UPDATE exercises 
SET avoid_for_injuries = array_append(avoid_for_injuries, 'quadril')
WHERE (name ILIKE '%agachamento livre%' OR name ILIKE '%agachamento profundo%')
  AND NOT ('quadril' = ANY(COALESCE(avoid_for_injuries, '{}')));

-- 5. VERIFICAÇÃO: Listar exercícios bloqueados para quadril
SELECT name, avoid_for_injuries, caution_for_injuries
FROM exercises
WHERE 'quadril' = ANY(avoid_for_injuries) OR 'quadril' = ANY(caution_for_injuries)
ORDER BY name;
