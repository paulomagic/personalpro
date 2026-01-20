-- ============================================
-- AUDITORIA E MIGRAÇÃO: BiomechanicalProfile
-- Execute no Supabase SQL Editor
-- ============================================

-- ========== PARTE 1: AUDITORIA ==========

-- 1.1 Exercícios de ALTO RISCO com spinal_load possivelmente errado
SELECT 
    '⚠️ RISCO' as status,
    name, 
    movement_pattern,
    spinal_load, 
    stability_demand,
    is_machine,
    avoid_for_injuries
FROM exercises 
WHERE 
    (name ILIKE '%agachamento%' 
     OR name ILIKE '%squat%'
     OR name ILIKE '%terra%'
     OR name ILIKE '%stiff%'
     OR name ILIKE '%press%45%'
     OR name ILIKE '%hack%'
     OR name ILIKE '%leg press%')
    AND spinal_load IN ('baixo', 'moderado')
ORDER BY spinal_load, name;

-- 1.2 Exercícios com spinal_load ALTO mas sem avoid_for_injuries
SELECT 
    '🔴 CRÍTICO' as status,
    name, 
    movement_pattern,
    spinal_load,
    avoid_for_injuries
FROM exercises
WHERE spinal_load = 'alto'
  AND (avoid_for_injuries = '{}' OR avoid_for_injuries IS NULL)
ORDER BY name;

-- 1.3 Exercícios de perna/hinge que NÃO são máquina (risco para idosos)
SELECT 
    '👴 IDOSO' as status,
    name, 
    movement_pattern,
    is_machine,
    stability_demand,
    avoid_for_injuries
FROM exercises
WHERE movement_pattern IN ('agachar', 'hinge')
  AND is_machine = false
  AND stability_demand != 'baixo'
ORDER BY stability_demand DESC, name;

-- 1.4 Exercícios overhead sem verificação de ombro
SELECT 
    '🏋️ OVERHEAD' as status,
    name,
    movement_pattern,
    avoid_for_injuries,
    caution_for_injuries
FROM exercises
WHERE movement_pattern = 'empurrar_vertical'
  AND NOT ('ombro' = ANY(avoid_for_injuries) OR 'ombro' = ANY(caution_for_injuries))
ORDER BY name;


-- ========== PARTE 2: ADICIONAR NOVAS COLUNAS ==========

-- 2.1 Adicionar axial_load (compressão vertical)
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS axial_load TEXT 
CHECK (axial_load IN ('baixo', 'moderado', 'alto'));

COMMENT ON COLUMN exercises.axial_load IS 
'Compressão vertical nas vértebras (ex: agachamento com barra). Diferente de spinal_load que é cisalhamento.';

-- 2.2 Adicionar knee_flexion_depth (profundidade de flexão do joelho)
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS knee_flexion_depth TEXT 
CHECK (knee_flexion_depth IN ('minimal', 'moderate', 'deep'));

COMMENT ON COLUMN exercises.knee_flexion_depth IS 
'Profundidade de flexão do joelho. Deep = >90°, afeta condromalácia/artrose.';

-- 2.3 Adicionar is_overhead (posição acima da cabeça)
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS is_overhead BOOLEAN DEFAULT false;

COMMENT ON COLUMN exercises.is_overhead IS 
'True se exercício coloca peso acima da cabeça (risco para ombro/gestantes).';


-- ========== PARTE 3: POPULAR VALORES INICIAIS ==========

-- 3.1 Exercícios com alta carga AXIAL
UPDATE exercises SET axial_load = 'alto'
WHERE name ILIKE ANY(ARRAY[
    '%agachamento com barra%',
    '%agachamento livre%',
    '%leg press 45%',
    '%hack squat%',
    '%levantamento terra%',
    '%militar em pé%',
    '%push press%',
    '%thruster%'
]);

UPDATE exercises SET axial_load = 'moderado'
WHERE name ILIKE ANY(ARRAY[
    '%agachamento goblet%',
    '%agachamento smith%',
    '%leg press horizontal%',
    '%desenvolvimento%'
]) AND (axial_load IS NULL OR axial_load = 'baixo');

UPDATE exercises SET axial_load = 'baixo'
WHERE axial_load IS NULL;

-- 3.2 Exercícios com flexão PROFUNDA de joelho
UPDATE exercises SET knee_flexion_depth = 'deep'
WHERE name ILIKE ANY(ARRAY[
    '%agachamento%',
    '%squat%',
    '%afundo%',
    '%lunge%',
    '%búlgaro%',
    '%pistol%'
]);

UPDATE exercises SET knee_flexion_depth = 'moderate'
WHERE name ILIKE ANY(ARRAY[
    '%leg press%',
    '%hack%',
    '%extensora%',
    '%flexora%'
]) AND knee_flexion_depth IS NULL;

UPDATE exercises SET knee_flexion_depth = 'minimal'
WHERE knee_flexion_depth IS NULL;

-- 3.3 Exercícios OVERHEAD
UPDATE exercises SET is_overhead = true
WHERE movement_pattern = 'empurrar_vertical'
   OR name ILIKE ANY(ARRAY[
       '%militar%',
       '%desenvolvimento%',
       '%push press%',
       '%thruster%',
       '%arnold%'
   ]);


-- ========== PARTE 4: CORREÇÕES de avoid_for_injuries ==========

-- 4.1 Exercícios de coluna devem evitar para 'coluna'
UPDATE exercises 
SET avoid_for_injuries = array_append(avoid_for_injuries, 'coluna')
WHERE spinal_load = 'alto'
  AND NOT ('coluna' = ANY(avoid_for_injuries));

-- 4.2 Exercícios overhead devem ter cautela para 'ombro'
UPDATE exercises 
SET caution_for_injuries = array_append(caution_for_injuries, 'ombro')
WHERE is_overhead = true
  AND NOT ('ombro' = ANY(caution_for_injuries))
  AND NOT ('ombro' = ANY(avoid_for_injuries));

-- 4.3 Exercícios com deep knee flexion devem ter cautela para 'joelho'
UPDATE exercises 
SET caution_for_injuries = array_append(caution_for_injuries, 'joelho')
WHERE knee_flexion_depth = 'deep'
  AND NOT ('joelho' = ANY(caution_for_injuries))
  AND NOT ('joelho' = ANY(avoid_for_injuries));


-- ========== PARTE 5: CRIAR ÍNDICES ==========

CREATE INDEX IF NOT EXISTS idx_exercises_axial_load 
ON exercises(axial_load);

CREATE INDEX IF NOT EXISTS idx_exercises_is_overhead 
ON exercises(is_overhead);


-- ========== PARTE 6: VERIFICAÇÃO FINAL ==========

-- Mostrar resumo das alterações
SELECT 
    'RESUMO' as tipo,
    COUNT(*) FILTER (WHERE axial_load = 'alto') as axial_alto,
    COUNT(*) FILTER (WHERE axial_load = 'moderado') as axial_moderado,
    COUNT(*) FILTER (WHERE axial_load = 'baixo') as axial_baixo,
    COUNT(*) FILTER (WHERE is_overhead = true) as overhead,
    COUNT(*) FILTER (WHERE knee_flexion_depth = 'deep') as deep_knee,
    COUNT(*) FILTER (WHERE 'coluna' = ANY(avoid_for_injuries)) as evita_coluna,
    COUNT(*) as total
FROM exercises;
