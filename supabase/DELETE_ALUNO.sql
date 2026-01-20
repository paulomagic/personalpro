-- ============================================
-- DELETAR ALUNO - COPIE E COLE NO SUPABASE SQL EDITOR
-- ============================================

-- Substitua 'NOME_DO_ALUNO' pelo nome exato do aluno que quer deletar

-- 1. Deletar assessments do aluno
DELETE FROM assessments 
WHERE client_id IN (
  SELECT id FROM clients WHERE name = 'NOME_DO_ALUNO'
);

-- 2. Deletar o aluno
DELETE FROM clients WHERE name = 'NOME_DO_ALUNO';

-- 3. Verificar se foi deletado
SELECT name FROM clients ORDER BY name;
