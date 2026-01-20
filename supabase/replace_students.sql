-- ============================================
-- Script para substituir João Maratonista e Patrícia Lima
-- por Ana Soares e Carlos Mendes
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Atualizar Patrícia Lima → Ana Soares
UPDATE clients
SET 
    name = 'Ana Soares',
    age = 70,
    goal = 'Saúde e Mobilidade',
    level = 'Iniciante',
    status = 'active',
    adherence = 95,
    observations = 'Idosa ativa de 70 anos. Sem lesões ou limitações graves. Foco em longevidade, força funcional e manutenção da qualidade de vida.',
    injuries = 'Nenhuma.',
    preferences = 'Gosta de exercícios com peso corporal e elásticos. Prefere treinos pela manhã.',
    avatar_url = 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    email = 'ana.soares@exemplo.com',
    weight = 57,
    updated_at = NOW()
WHERE name = 'Patrícia Lima';

-- 2. Atualizar assessments de Patrícia → Ana (ajustar histórico)
UPDATE assessments
SET 
    weight = CASE 
        WHEN date = (SELECT MIN(date) FROM assessments WHERE client_id = (SELECT id FROM clients WHERE name = 'Ana Soares')) THEN 58.0
        ELSE 57.0 + (RANDOM() * 1 - 0.5)
    END,
    body_fat = CASE 
        WHEN date = (SELECT MIN(date) FROM assessments WHERE client_id = (SELECT id FROM clients WHERE name = 'Ana Soares')) THEN 26.0
        ELSE 24.0 + (RANDOM() * 1 - 0.5)
    END,
    notes = CASE 
        WHEN date = (SELECT MIN(date) FROM assessments WHERE client_id = (SELECT id FROM clients WHERE name = 'Ana Soares')) THEN 'Avaliação inicial'
        WHEN date = (SELECT MAX(date) FROM assessments WHERE client_id = (SELECT id FROM clients WHERE name = 'Ana Soares')) THEN 'Avaliação atual'
        ELSE 'Acompanhamento mensal'
    END
WHERE client_id = (SELECT id FROM clients WHERE name = 'Ana Soares');

-- 3. Atualizar João Maratonista → Carlos Mendes
UPDATE clients
SET 
    name = 'Carlos Mendes',
    age = 72,
    goal = 'Saúde e Mobilidade',
    level = 'Iniciante',
    status = 'active',
    adherence = 85,
    observations = 'Idoso de 72 anos com artrose de quadril bilateral. Foco em manter mobilidade articular e prevenir atrofia muscular. Evitar impactos e amplitudes extremas.',
    injuries = 'Artrose de quadril bilateral (grau 2), Rigidez matinal.',
    preferences = 'Prefere exercícios na água ou sentado. Não gosta de agachamentos profundos.',
    avatar_url = 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    email = 'carlos.mendes@exemplo.com',
    weight = 70,
    updated_at = NOW()
WHERE name = 'João Maratonista';

-- 4. Atualizar assessments de João → Carlos (ajustar histórico)
UPDATE assessments
SET 
    weight = CASE 
        WHEN date = (SELECT MIN(date) FROM assessments WHERE client_id = (SELECT id FROM clients WHERE name = 'Carlos Mendes')) THEN 72.0
        ELSE 70.0 + (RANDOM() * 1 - 0.5)
    END,
    body_fat = CASE 
        WHEN date = (SELECT MIN(date) FROM assessments WHERE client_id = (SELECT id FROM clients WHERE name = 'Carlos Mendes')) THEN 22.0
        ELSE 20.0 + (RANDOM() * 1 - 0.5)
    END,
    notes = CASE 
        WHEN date = (SELECT MIN(date) FROM assessments WHERE client_id = (SELECT id FROM clients WHERE name = 'Carlos Mendes')) THEN 'Avaliação inicial'
        WHEN date = (SELECT MAX(date) FROM assessments WHERE client_id = (SELECT id FROM clients WHERE name = 'Carlos Mendes')) THEN 'Avaliação atual'
        ELSE 'Acompanhamento mensal'
    END
WHERE client_id = (SELECT id FROM clients WHERE name = 'Carlos Mendes');

-- 5. Verificação
SELECT 
    name, 
    age, 
    goal, 
    level, 
    injuries, 
    adherence 
FROM clients 
WHERE name IN ('Ana Soares', 'Carlos Mendes')
ORDER BY name;
