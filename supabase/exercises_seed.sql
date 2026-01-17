-- ============================================
-- EXERCISES SEED V2 - Personal Pro
-- 120+ exercícios profissionais
-- Inclui patterns de isolamento
-- Execute APÓS exercises_domain_schema.sql
-- ============================================

-- Limpar tabela para reinserir
TRUNCATE TABLE exercises CASCADE;

-- ============ EMPURRAR HORIZONTAL (10) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('supino-barra', 'Supino Reto com Barra', 'forca', 'peito', ARRAY['triceps','ombro'], 'empurrar_horizontal', ARRAY['barra'], true, 'moderado', 'baixo', ARRAY['ombro']),
('supino-halteres', 'Supino Reto com Halteres', 'forca', 'peito', ARRAY['triceps','ombro'], 'empurrar_horizontal', ARRAY['halter'], true, 'moderado', 'moderado', ARRAY['ombro']),
('supino-inclinado-barra', 'Supino Inclinado com Barra', 'forca', 'peito', ARRAY['triceps','ombro'], 'empurrar_horizontal', ARRAY['barra'], true, 'moderado', 'baixo', ARRAY['ombro']),
('supino-inclinado-halter', 'Supino Inclinado com Halteres', 'forca', 'peito', ARRAY['triceps','ombro'], 'empurrar_horizontal', ARRAY['halter'], true, 'moderado', 'moderado', ARRAY['ombro']),
('supino-declinado', 'Supino Declinado', 'forca', 'peito', ARRAY['triceps'], 'empurrar_horizontal', ARRAY['barra'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('supino-maquina', 'Supino na Máquina', 'forca', 'peito', ARRAY['triceps'], 'empurrar_horizontal', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('flexao-solo', 'Flexão de Braços', 'forca', 'peito', ARRAY['triceps','core'], 'empurrar_horizontal', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('flexao-inclinada', 'Flexão Inclinada (pés elevados)', 'forca', 'peito', ARRAY['triceps'], 'empurrar_horizontal', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('crucifixo-halter', 'Crucifixo com Halteres', 'forca', 'peito', ARRAY['ombro'], 'empurrar_horizontal', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']),
('crossover-cabo', 'Crossover no Cabo', 'forca', 'peito', ARRAY['ombro'], 'empurrar_horizontal', ARRAY['cabo'], false, 'baixo', 'moderado', ARRAY['ombro']);

-- ============ EMPURRAR VERTICAL (8) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('desenvolvimento-barra', 'Desenvolvimento com Barra', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['barra'], true, 'alto', 'moderado', ARRAY['ombro','coluna']),
('desenvolvimento-halter', 'Desenvolvimento com Halteres', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['ombro']),
('desenvolvimento-maquina', 'Desenvolvimento na Máquina', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('desenvolvimento-sentado', 'Desenvolvimento Sentado', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['halter'], true, 'baixo', 'moderado', ARRAY['ombro']),
('arnold-press', 'Arnold Press', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['ombro']),
('push-press', 'Push Press', 'forca', 'ombro', ARRAY['triceps','quadriceps'], 'empurrar_vertical', ARRAY['barra'], true, 'alto', 'alto', ARRAY['ombro','coluna']),
('pike-pushup', 'Pike Push-up', 'forca', 'ombro', ARRAY['triceps'], 'empurrar_vertical', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('z-press', 'Z-Press', 'forca', 'ombro', ARRAY['triceps','core'], 'empurrar_vertical', ARRAY['halter'], true, 'baixo', 'alto', ARRAY['ombro']);

-- ============ PUXAR HORIZONTAL (10) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('remada-curvada', 'Remada Curvada com Barra', 'forca', 'costas', ARRAY['biceps'], 'puxar_horizontal', ARRAY['barra'], true, 'alto', 'alto', ARRAY['coluna']),
('remada-halter', 'Remada Unilateral com Halter', 'forca', 'costas', ARRAY['biceps'], 'puxar_horizontal', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['coluna']),
('remada-maquina', 'Remada na Máquina', 'forca', 'costas', ARRAY['biceps'], 'puxar_horizontal', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('remada-baixa', 'Remada Baixa no Cabo', 'forca', 'costas', ARRAY['biceps'], 'puxar_horizontal', ARRAY['cabo'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('remada-cavalinho', 'Remada Cavalinho (T-Bar)', 'forca', 'costas', ARRAY['biceps','posterior_coxa'], 'puxar_horizontal', ARRAY['barra'], true, 'alto', 'moderado', ARRAY['coluna']),
('remada-invertida', 'Remada Invertida', 'forca', 'costas', ARRAY['biceps','core'], 'puxar_horizontal', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('remada-pendlay', 'Remada Pendlay', 'forca', 'costas', ARRAY['biceps','core'], 'puxar_horizontal', ARRAY['barra'], true, 'alto', 'alto', ARRAY['coluna']),
('remada-seal', 'Seal Row', 'forca', 'costas', ARRAY['biceps'], 'puxar_horizontal', ARRAY['halter'], true, 'baixo', 'moderado', ARRAY[]::text[]),
('pullover', 'Pullover com Halter', 'forca', 'costas', ARRAY['peito'], 'puxar_horizontal', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']),
('face-pull', 'Face Pull', 'forca', 'costas', ARRAY['ombro'], 'puxar_horizontal', ARRAY['cabo'], false, 'baixo', 'baixo', ARRAY[]::text[]);

-- ============ PUXAR VERTICAL (8) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('barra-fixa', 'Barra Fixa (Pull-up)', 'forca', 'costas', ARRAY['biceps','core'], 'puxar_vertical', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('puxada-frontal', 'Puxada Frontal', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('puxada-neutra', 'Puxada Pegada Neutra', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('puxada-aberta', 'Puxada Pegada Aberta', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY['ombro']),
('chin-up', 'Chin Up (Pegada Supinada)', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro']),
('pulldown-cabo', 'Pulldown Unilateral no Cabo', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['cabo'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('puxada-triangulo', 'Puxada com Triângulo', 'forca', 'costas', ARRAY['biceps'], 'puxar_vertical', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('muscle-up', 'Muscle Up', 'forca', 'costas', ARRAY['triceps','peito'], 'puxar_vertical', ARRAY['peso_corporal'], true, 'moderado', 'alto', ARRAY['ombro','cotovelo']);

-- ============ AGACHAR (15) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('agachamento-livre', 'Agachamento Livre com Barra', 'forca', 'quadriceps', ARRAY['gluteos','core'], 'agachar', ARRAY['barra'], true, 'alto', 'alto', ARRAY['joelho','coluna']),
('agachamento-frontal', 'Agachamento Frontal', 'forca', 'quadriceps', ARRAY['gluteos','core'], 'agachar', ARRAY['barra'], true, 'alto', 'alto', ARRAY['joelho','coluna','punho']),
('agachamento-goblet', 'Agachamento Goblet', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['joelho']),
('agachamento-sumo', 'Agachamento Sumô', 'forca', 'quadriceps', ARRAY['gluteos','posterior_coxa'], 'agachar', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['joelho']),
('leg-press', 'Leg Press', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('leg-press-45', 'Leg Press 45°', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['maquina'], true, 'moderado', 'baixo', ARRAY['coluna']),
('hack-machine', 'Hack Squat na Máquina', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('agachamento-bulgaro', 'Agachamento Búlgaro', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['halter'], true, 'baixo', 'alto', ARRAY['joelho']),
('afundo', 'Afundo (Lunge)', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['halter'], true, 'baixo', 'alto', ARRAY['joelho']),
('afundo-caminhando', 'Afundo Caminhando', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['halter'], true, 'baixo', 'alto', ARRAY['joelho']),
('step-up', 'Step Up', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['halter'], true, 'baixo', 'alto', ARRAY['joelho']),
('sissy-squat', 'Sissy Squat', 'forca', 'quadriceps', ARRAY[]::text[], 'agachar', ARRAY['peso_corporal'], false, 'baixo', 'alto', ARRAY['joelho']),
('cadeira-extensora', 'Cadeira Extensora', 'forca', 'quadriceps', ARRAY[]::text[], 'agachar', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY['joelho']),
('pistol-squat', 'Pistol Squat', 'forca', 'quadriceps', ARRAY['gluteos','core'], 'agachar', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['joelho']),
('belt-squat', 'Belt Squat', 'forca', 'quadriceps', ARRAY['gluteos'], 'agachar', ARRAY['maquina'], true, 'baixo', 'moderado', ARRAY[]::text[]);

-- ============ HINGE QUADRIL (15) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('levantamento-terra', 'Levantamento Terra Convencional', 'forca', 'posterior_coxa', ARRAY['gluteos','costas','core'], 'hinge', ARRAY['barra'], true, 'alto', 'alto', ARRAY['coluna']),
('terra-sumo', 'Levantamento Terra Sumô', 'forca', 'gluteos', ARRAY['posterior_coxa','quadriceps'], 'hinge', ARRAY['barra'], true, 'alto', 'alto', ARRAY['coluna']),
('terra-romeno', 'Terra Romeno', 'forca', 'posterior_coxa', ARRAY['gluteos'], 'hinge', ARRAY['barra'], true, 'moderado', 'moderado', ARRAY['coluna']),
('stiff-halter', 'Stiff com Halteres', 'forca', 'posterior_coxa', ARRAY['gluteos'], 'hinge', ARRAY['halter'], true, 'moderado', 'alto', ARRAY['coluna']),
('stiff-unilateral', 'Stiff Unilateral', 'forca', 'posterior_coxa', ARRAY['gluteos','core'], 'hinge', ARRAY['halter'], true, 'baixo', 'alto', ARRAY['coluna']),
('hip-thrust', 'Hip Thrust com Barra', 'forca', 'gluteos', ARRAY['posterior_coxa'], 'hinge', ARRAY['barra'], true, 'baixo', 'moderado', ARRAY[]::text[]),
('hip-thrust-maquina', 'Hip Thrust na Máquina', 'forca', 'gluteos', ARRAY['posterior_coxa'], 'hinge', ARRAY['maquina'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('glute-bridge', 'Glute Bridge', 'forca', 'gluteos', ARRAY['posterior_coxa'], 'hinge', ARRAY['peso_corporal'], true, 'baixo', 'baixo', ARRAY[]::text[]),
('mesa-flexora', 'Mesa Flexora Deitado', 'forca', 'posterior_coxa', ARRAY[]::text[], 'hinge', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('mesa-flexora-sentado', 'Mesa Flexora Sentado', 'forca', 'posterior_coxa', ARRAY[]::text[], 'hinge', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('good-morning', 'Good Morning', 'forca', 'posterior_coxa', ARRAY['gluteos','coluna'], 'hinge', ARRAY['barra'], true, 'alto', 'alto', ARRAY['coluna']),
('nordic-curl', 'Nordic Curl', 'forca', 'posterior_coxa', ARRAY[]::text[], 'hinge', ARRAY['peso_corporal'], false, 'baixo', 'alto', ARRAY['joelho']),
('hiperextensao', 'Hiperextensão', 'forca', 'posterior_coxa', ARRAY['gluteos','coluna'], 'hinge', ARRAY['peso_corporal'], true, 'moderado', 'moderado', ARRAY['coluna']),
('kickback-gluteo', 'Kickback de Glúteo', 'forca', 'gluteos', ARRAY[]::text[], 'hinge', ARRAY['cabo'], false, 'baixo', 'moderado', ARRAY[]::text[]),
('abdutora', 'Abdutora de Quadril', 'forca', 'gluteos', ARRAY[]::text[], 'hinge', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY[]::text[]);

-- ============ CORE (10) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('prancha', 'Prancha Frontal', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['peso_corporal'], false, 'baixo', 'alto', ARRAY['coluna']),
('prancha-lateral', 'Prancha Lateral', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['peso_corporal'], false, 'baixo', 'alto', ARRAY['coluna','ombro']),
('abdominal-crunch', 'Abdominal Crunch', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['peso_corporal'], false, 'baixo', 'baixo', ARRAY['coluna']),
('abdominal-infra', 'Elevação de Pernas', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['peso_corporal'], false, 'moderado', 'moderado', ARRAY['coluna']),
('dead-bug', 'Dead Bug', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['peso_corporal'], false, 'baixo', 'moderado', ARRAY[]::text[]),
('pallof-press', 'Pallof Press', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['cabo'], false, 'baixo', 'moderado', ARRAY[]::text[]),
('russian-twist', 'Russian Twist', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['halter'], false, 'moderado', 'moderado', ARRAY['coluna']),
('ab-wheel', 'Ab Wheel Rollout', 'core', 'core', ARRAY['ombro'], 'core', ARRAY['peso_corporal'], false, 'moderado', 'alto', ARRAY['coluna','ombro']),
('hanging-leg-raise', 'Elevação de Pernas Suspenso', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['peso_corporal'], false, 'baixo', 'alto', ARRAY['coluna']),
('cable-crunch', 'Cable Crunch', 'core', 'core', ARRAY[]::text[], 'core', ARRAY['cabo'], false, 'baixo', 'baixo', ARRAY[]::text[]);

-- ============ ISOLAR BÍCEPS (8) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('rosca-direta', 'Rosca Direta com Barra', 'forca', 'biceps', ARRAY[]::text[], 'isolar_biceps', ARRAY['barra'], false, 'baixo', 'baixo', ARRAY['cotovelo']),
('rosca-alternada', 'Rosca Alternada com Halteres', 'forca', 'biceps', ARRAY[]::text[], 'isolar_biceps', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['cotovelo']),
('rosca-martelo', 'Rosca Martelo', 'forca', 'biceps', ARRAY['antebraco'], 'isolar_biceps', ARRAY['halter'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('rosca-scott', 'Rosca Scott', 'forca', 'biceps', ARRAY[]::text[], 'isolar_biceps', ARRAY['barra'], false, 'baixo', 'baixo', ARRAY['cotovelo']),
('rosca-concentrada', 'Rosca Concentrada', 'forca', 'biceps', ARRAY[]::text[], 'isolar_biceps', ARRAY['halter'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('rosca-cabo', 'Rosca no Cabo', 'forca', 'biceps', ARRAY[]::text[], 'isolar_biceps', ARRAY['cabo'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('rosca-inclinada', 'Rosca Inclinada', 'forca', 'biceps', ARRAY[]::text[], 'isolar_biceps', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']),
('rosca-21', 'Rosca 21', 'forca', 'biceps', ARRAY[]::text[], 'isolar_biceps', ARRAY['barra'], false, 'baixo', 'baixo', ARRAY['cotovelo']);

-- ============ ISOLAR TRÍCEPS (8) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('triceps-pulley', 'Tríceps Pulley', 'forca', 'triceps', ARRAY[]::text[], 'isolar_triceps', ARRAY['cabo'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('triceps-corda', 'Tríceps Corda', 'forca', 'triceps', ARRAY[]::text[], 'isolar_triceps', ARRAY['cabo'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('triceps-frances', 'Tríceps Francês', 'forca', 'triceps', ARRAY[]::text[], 'isolar_triceps', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['cotovelo']),
('triceps-testa', 'Tríceps Testa com Barra', 'forca', 'triceps', ARRAY[]::text[], 'isolar_triceps', ARRAY['barra'], false, 'baixo', 'moderado', ARRAY['cotovelo']),
('triceps-banco', 'Tríceps no Banco', 'forca', 'triceps', ARRAY[]::text[], 'isolar_triceps', ARRAY['peso_corporal'], false, 'baixo', 'moderado', ARRAY['ombro']),
('triceps-coice', 'Kickback de Tríceps', 'forca', 'triceps', ARRAY[]::text[], 'isolar_triceps', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY[]::text[]),
('triceps-mergulho', 'Mergulho nas Paralelas', 'forca', 'triceps', ARRAY['peito','ombro'], 'isolar_triceps', ARRAY['peso_corporal'], true, 'baixo', 'alto', ARRAY['ombro','cotovelo']),
('triceps-overhead', 'Extensão Overhead no Cabo', 'forca', 'triceps', ARRAY[]::text[], 'isolar_triceps', ARRAY['cabo'], false, 'baixo', 'baixo', ARRAY[]::text[]);

-- ============ ISOLAR OMBRO (8) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('elevacao-lateral', 'Elevação Lateral', 'forca', 'ombro', ARRAY[]::text[], 'isolar_ombro', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']),
('elevacao-lateral-cabo', 'Elevação Lateral no Cabo', 'forca', 'ombro', ARRAY[]::text[], 'isolar_ombro', ARRAY['cabo'], false, 'baixo', 'baixo', ARRAY['ombro']),
('elevacao-frontal', 'Elevação Frontal', 'forca', 'ombro', ARRAY[]::text[], 'isolar_ombro', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']),
('crucifixo-invertido', 'Crucifixo Invertido', 'forca', 'ombro', ARRAY['costas'], 'isolar_ombro', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']),
('crucifixo-maquina', 'Crucifixo Invertido na Máquina', 'forca', 'ombro', ARRAY['costas'], 'isolar_ombro', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('encolhimento', 'Encolhimento de Ombros', 'forca', 'ombro', ARRAY[]::text[], 'isolar_ombro', ARRAY['halter'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('high-pull', 'High Pull', 'forca', 'ombro', ARRAY['costas'], 'isolar_ombro', ARRAY['barra'], true, 'baixo', 'moderado', ARRAY['ombro']),
('lu-raise', 'Lu Raise', 'forca', 'ombro', ARRAY[]::text[], 'isolar_ombro', ARRAY['halter'], false, 'baixo', 'moderado', ARRAY['ombro']);

-- ============ ISOLAR PANTURRILHA (6) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('panturrilha-em-pe', 'Panturrilha em Pé', 'forca', 'panturrilha', ARRAY[]::text[], 'isolar_panturrilha', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('panturrilha-sentado', 'Panturrilha Sentado', 'forca', 'panturrilha', ARRAY[]::text[], 'isolar_panturrilha', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('panturrilha-leg-press', 'Panturrilha no Leg Press', 'forca', 'panturrilha', ARRAY[]::text[], 'isolar_panturrilha', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('panturrilha-unilateral', 'Panturrilha Unilateral', 'forca', 'panturrilha', ARRAY[]::text[], 'isolar_panturrilha', ARRAY['peso_corporal'], false, 'baixo', 'alto', ARRAY[]::text[]),
('panturrilha-burro', 'Donkey Calf Raise', 'forca', 'panturrilha', ARRAY[]::text[], 'isolar_panturrilha', ARRAY['maquina'], false, 'baixo', 'baixo', ARRAY[]::text[]),
('tibial-raise', 'Tibial Raise', 'forca', 'panturrilha', ARRAY[]::text[], 'isolar_panturrilha', ARRAY['peso_corporal'], false, 'baixo', 'baixo', ARRAY[]::text[]);

-- ============ ISOLAR ANTEBRAÇO (4) ============
INSERT INTO exercises
(slug, name, category, primary_muscle, secondary_muscles, movement_pattern, equipment, is_compound, spinal_load, stability_demand, avoid_for_injuries)
VALUES
('rosca-punho', 'Rosca de Punho', 'forca', 'antebraco', ARRAY[]::text[], 'isolar_antebraco', ARRAY['barra'], false, 'baixo', 'baixo', ARRAY['punho']),
('rosca-punho-reversa', 'Rosca de Punho Reversa', 'forca', 'antebraco', ARRAY[]::text[], 'isolar_antebraco', ARRAY['barra'], false, 'baixo', 'baixo', ARRAY['punho']),
('farmer-walk', 'Farmer Walk', 'forca', 'antebraco', ARRAY['core','ombro'], 'isolar_antebraco', ARRAY['halter'], true, 'baixo', 'alto', ARRAY[]::text[]),
('dead-hang', 'Dead Hang', 'forca', 'antebraco', ARRAY['costas'], 'isolar_antebraco', ARRAY['peso_corporal'], false, 'baixo', 'baixo', ARRAY['ombro']);

-- ============ VERIFICAÇÃO FINAL ============
SELECT 
  movement_pattern,
  COUNT(*) as total
FROM exercises
GROUP BY movement_pattern
ORDER BY movement_pattern;

-- Esperado: ~120 exercícios em 12 patterns
SELECT COUNT(*) as total_exercises FROM exercises;
