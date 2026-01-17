-- ============================================
-- EXERCISES SEED - Personal Pro
-- 40 exercícios fundamentais
-- Núcleo biomecânico mínimo viável
-- Execute APÓS exercises_domain_schema.sql
-- ============================================

-- ============ EMPURRAR HORIZONTAL (6) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('supino-barra', 'Supino com Barra', 'forca', 'peito', ARRAY['triceps','ombro'], 'empurrar_horizontal', ARRAY['barra'], true, 'moderado', 'baixo', ARRAY['ombro']),
('supino-halteres', 'Supino com Halteres', 'forca', 'peito', ARRAY['triceps','ombro'], 'empurrar_horizontal', ARRAY['halter'], true, 'moderado', 'moderado', ARRAY['ombro']),
('supino-maquina', 'Supino na Máquina', 'forca', 'peito', ARRAY['triceps'], 'empurrar_horizontal', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('flexao-solo', 'Flexão de Braços', 'forca', 'peito', ARRAY['triceps','core'], 'empurrar_horizontal', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('flexao-inclinada', 'Flexão Inclinada', 'forca', 'peito', ARRAY['triceps'], 'empurrar_horizontal', ARRAY['peso_corporal'], true, 'baixo', 'moderado', ARRAY[]::text[]),
('crucifixo-halter', 'Crucifixo com Halteres', 'forca', 'peito', ARRAY['ombro'], 'empurrar_horizontal', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']);

-- ============ EMPURRAR VERTICAL (5) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('desenvolvimento-barra', 'Desenvolvimento com Barra', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['barra'], true, 'alto', 'moderado', ARRAY['ombro','coluna']),
('desenvolvimento-halter', 'Desenvolvimento com Halteres', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['ombro']),
('desenvolvimento-maquina', 'Desenvolvimento na Máquina', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('arnold-press', 'Arnold Press', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['ombro']),
('elevacao-frontal', 'Elevação Frontal', 'forca', 'ombro', ARRAY[]::text[], 'empurrar_vertical', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']);

-- ============ PUXAR HORIZONTAL (6) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('remada-curvada', 'Remada Curvada', 'forca', 'costas', ARRAY['biceps'], 'puxar_horizontal', ARRAY['barra'], true, 'alto', 'alto', ARRAY['coluna']),
('remada-halter', 'Remada Unilateral com Halter', 'forca', 'costas', ARRAY['biceps'], 'puxar_horizontal', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['coluna']),
('remada-maquina', 'Remada na Máquina', 'forca', 'costas', ARRAY['biceps'], 'puxar_horizontal', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('remada-baixa', 'Remada Baixa no Cabo', 'forca', 'costas', ARRAY['biceps'], 'puxar_horizontal', ARRAY['cabo'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('remada-invertida', 'Remada Invertida', 'forca', 'costas', ARRAY['biceps','core'], 'puxar_horizontal', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('pullover', 'Pullover', 'forca', 'costas', ARRAY['peito'], 'puxar_horizontal', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']);

-- ============ PUXAR VERTICAL (5) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('barra-fixa', 'Barra Fixa', 'forca', 'costas', ARRAY['biceps','core'], 'puxar_vertical', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('puxada-frontal', 'Puxada Frontal', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('puxada-neutra', 'Puxada Neutra', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('chin-up', 'Chin Up', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('pulldown-cabo', 'Pulldown no Cabo', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['cabo'], true, 'baixo', 'baixo', ARRAY[]::text[]);

-- ============ AGACHAR (6) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('agachamento-livre', 'Agachamento Livre', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['barra'], true, 'alto', 'alto', ARRAY['joelho','coluna']),
('agachamento-goblet', 'Agachamento Goblet', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['joelho']),
('leg-press', 'Leg Press', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('hack-machine', 'Hack Machine', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('agachamento-bulgaro', 'Agachamento Búlgaro', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['halter'], true, 'baixo', 'alto', ARRAY['joelho']),
('afundo', 'Afundo', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['halter'], true, 'baixo', 'alto', ARRAY['joelho']);

-- ============ HINGE QUADRIL (5) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('levantamento-terra', 'Levantamento Terra', 'forca', 'posterior_coxa', ARRAY['gluteos','costas'], 'hinge', ARRAY['barra'], true, 'alto', 'alto', ARRAY['coluna']),
('terra-romeno', 'Terra Romeno', 'forca', 'posterior_coxa', ARRAY['gluteos'], 'hinge', ARRAY['barra'], true, 'moderado', 'moderado', ARRAY['coluna']),
('stiff-halter', 'Stiff com Halteres', 'forca', 'posterior_coxa', ARRAY['gluteos'], 'hinge', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['coluna']),
('hip-thrust', 'Hip Thrust', 'forca', 'gluteos', ARRAY['posterior_coxa'], 'hinge', ARRAY['barra'], true, 'baixo', 'moderado', ARRAY[]::text[]),
('mesa-flexora', 'Mesa Flexora', 'forca', 'posterior_coxa', ARRAY[]::text[], 'hinge', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY[]::text[]);

-- ============ CORE (4) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('prancha', 'Prancha', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['peso_corporal'], false, 'baixo', 'alto', ARRAY['coluna']),
('abdominal-crunch', 'Abdominal Crunch', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['peso_corporal'], false, 'baixo', 'baixo', ARRAY['coluna']),
('dead-bug', 'Dead Bug', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['peso_corporal'], false, 'baixo', 'moderado', ARRAY[]::text[]),
('pallof-press', 'Pallof Press', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['cabo'], false, 'baixo', 'moderado', ARRAY[]::text[]);

-- ============ VERIFICAÇÃO ============
-- Confirmar 40 exercícios inseridos
SELECT 
  movement_pattern,
  COUNT(*) as total
FROM exercises
GROUP BY movement_pattern
ORDER BY movement_pattern;
