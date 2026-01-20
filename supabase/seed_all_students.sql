-- ============================================
-- SEED COMPLETO - Copie e cole no Supabase SQL Editor
-- IMPORTANTE: Substitua 'SEU_COACH_ID_AQUI' pelo seu UUID de coach
-- Para descobrir seu ID, rode: SELECT id FROM auth.users WHERE email = 'seu@email.com';
-- ============================================

-- Inserir todos os 10 alunos (com Ana Soares e Carlos Mendes no lugar de João e Patrícia)
INSERT INTO clients (coach_id, name, age, goal, level, status, adherence, avatar_url, observations, injuries, preferences, email, phone, height, weight)
VALUES
  -- Enzo Gabriel
  ('SEU_COACH_ID_AQUI', 'Enzo Gabriel', 16, 'Hipertrofia', 'Iniciante', 'active', 90,
   'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'Adolescente, muito motivado. Foco em ganhar massa muscular nos braços e peito. Precisa de orientação constante na postura.',
   'Nenhuma',
   'Gosta de supino e rosca direta. Odeia leg day.',
   'enzo.gabriel@exemplo.com', '(11) 99999-9999', 1.70, 66),

  -- Maria Helena
  ('SEU_COACH_ID_AQUI', 'Maria Helena', 68, 'Saúde e Mobilidade', 'Iniciante', 'active', 100,
   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'Idosa com osteoporose leve. Foco total em fortalecimento funcional e prevenção de quedas.',
   'Osteoporose lombar, Dores no joelho (artrose leve).',
   'Prefere exercícios sentada ou com apoio. Gosta de música clássica durante o treino.',
   'maria.helena@exemplo.com', '(11) 99999-9999', 1.70, 64),

  -- Juliana Costa
  ('SEU_COACH_ID_AQUI', 'Juliana Costa', 29, 'Gestante Saudável', 'Intermediário', 'active', 85,
   'https://images.unsplash.com/photo-1596489399852-5a39cb36ca02?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'Gestante (24 semanas). Monitorar frequência cardíaca e evitar decúbito dorsal por tempo prolongado.',
   'Lombalgia gestacional.',
   'Gosta de pilates e exercícios na bola suíça.',
   'juliana.costa@exemplo.com', '(11) 99999-9999', 1.70, 68),

  -- Roberto Andrade
  ('SEU_COACH_ID_AQUI', 'Roberto Andrade', 42, 'Emagrecimento', 'Iniciante', 'at-risk', 50,
   'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'Obesidade grau 1. Hipertenso controlado. Tem dificuldade com consistência e dieta.',
   'Condromalácia patelar grau 2.',
   'Prefere esteira assistindo séries. Não gosta de burpees.',
   'roberto.andrade@exemplo.com', '(11) 99999-9999', 1.70, 106),

  -- Camila Vegan
  ('SEU_COACH_ID_AQUI', 'Camila Vegan', 26, 'Hipertrofia Glúteo', 'Avançado', 'active', 95,
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'Atleta Wellness amadora. Dieta vegana estrita. Treina pesado, foco total em inferiores.',
   'Nenhuma.',
   'Ama Elevação Pélvica (200kg) e Agachamento Búlgaro.',
   'camila.vegan@exemplo.com', '(11) 99999-9999', 1.70, 62),

  -- Lucas Ferreira
  ('SEU_COACH_ID_AQUI', 'Lucas Ferreira', 31, 'Reabilitação LCA', 'Intermediário', 'paused', 0,
   'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'Pós-operatório LCA (4 meses). Já liberado para fortalecimento mais intenso, mas viajou a trabalho.',
   'Pós-op LCA Joelho Direito.',
   'Focado em voltar a jogar futebol.',
   'lucas.ferreira@exemplo.com', '(11) 99999-9999', 1.70, 80),

  -- 🆕 Ana Soares (substituiu Patrícia Lima)
  ('SEU_COACH_ID_AQUI', 'Ana Soares', 70, 'Saúde e Mobilidade', 'Iniciante', 'active', 95,
   'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'Idosa ativa de 70 anos. Sem lesões ou limitações graves. Foco em longevidade, força funcional e manutenção da qualidade de vida.',
   'Nenhuma.',
   'Gosta de exercícios com peso corporal e elásticos. Prefere treinos pela manhã.',
   'ana.soares@exemplo.com', '(11) 99999-9999', 1.60, 57),

  -- Marcos Strong
  ('SEU_COACH_ID_AQUI', 'Marcos Strong', 28, 'Força (Powerlifting)', 'Atleta', 'active', 98,
   'https://images.unsplash.com/photo-1544348817-5f2cf14b88c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'Competidor de Powerlifting. Ciclo de choque. Cargas extremas.',
   'Tendinite cotovelo recorrente.',
   'Treino simples: SBD (Squat, Bench, Deadlift).',
   'marcos.strong@exemplo.com', '(11) 99999-9999', 1.70, 94),

  -- Fernanda Executiva
  ('SEU_COACH_ID_AQUI', 'Fernanda Executiva', 40, 'Anti-Stress/Saúde', 'Intermediário', 'active', 60,
   'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'CEO de startup. Altíssimo stress. Cortisol alto. Treina pra não surtar.',
   'Tensão cervical crônica.',
   'Boxe e HIIT para desestressar.',
   'fernanda.executiva@exemplo.com', '(11) 99999-9999', 1.70, 60),

  -- 🆕 Carlos Mendes (substituiu João Maratonista)
  ('SEU_COACH_ID_AQUI', 'Carlos Mendes', 72, 'Saúde e Mobilidade', 'Iniciante', 'active', 85,
   'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
   'Idoso de 72 anos com artrose de quadril bilateral. Foco em manter mobilidade articular e prevenir atrofia muscular. Evitar impactos e amplitudes extremas.',
   'Artrose de quadril bilateral (grau 2), Rigidez matinal.',
   'Prefere exercícios na água ou sentado. Não gosta de agachamentos profundos.',
   'carlos.mendes@exemplo.com', '(11) 99999-8888', 1.72, 70);

-- Verificação
SELECT name, age, goal, injuries FROM clients WHERE name IN ('Ana Soares', 'Carlos Mendes');
