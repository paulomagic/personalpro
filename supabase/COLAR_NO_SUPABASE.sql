-- ============================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- ============================================

-- 1. Deletar assessments de João e Patrícia
DELETE FROM assessments 
WHERE client_id IN (
  SELECT id FROM clients WHERE name IN ('João Maratonista', 'Patrícia Lima')
);

-- 2. Deletar João Maratonista e Patrícia Lima
DELETE FROM clients WHERE name IN ('João Maratonista', 'Patrícia Lima');

-- 3. Inserir Ana Soares e Carlos Mendes (usando o coach_id de qualquer cliente existente)
INSERT INTO clients (coach_id, name, age, goal, level, status, adherence, avatar_url, observations, injuries, preferences, email, phone, height, weight)
SELECT 
  coach_id, -- Pega o coach_id de um cliente existente
  'Ana Soares',
  70,
  'Saúde e Mobilidade',
  'Iniciante',
  'active',
  95,
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
  'Idosa ativa de 70 anos. Sem lesões ou limitações graves. Foco em longevidade, força funcional e manutenção da qualidade de vida.',
  'Nenhuma.',
  'Gosta de exercícios com peso corporal e elásticos. Prefere treinos pela manhã.',
  'ana.soares@exemplo.com',
  '(11) 99999-9999',
  1.60,
  57
FROM clients 
LIMIT 1;

INSERT INTO clients (coach_id, name, age, goal, level, status, adherence, avatar_url, observations, injuries, preferences, email, phone, height, weight)
SELECT 
  coach_id,
  'Carlos Mendes',
  72,
  'Saúde e Mobilidade',
  'Iniciante',
  'active',
  85,
  'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
  'Idoso de 72 anos com artrose de quadril bilateral. Foco em manter mobilidade articular e prevenir atrofia muscular. Evitar impactos e amplitudes extremas.',
  'Artrose de quadril bilateral (grau 2), Rigidez matinal.',
  'Prefere exercícios na água ou sentado. Não gosta de agachamentos profundos.',
  'carlos.mendes@exemplo.com',
  '(11) 99999-8888',
  1.72,
  70
FROM clients 
LIMIT 1;

-- 4. Verificar
SELECT name, age, goal, injuries, adherence 
FROM clients 
WHERE name IN ('Ana Soares', 'Carlos Mendes')
ORDER BY name;
