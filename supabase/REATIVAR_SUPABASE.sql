-- ============================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- Script de Reativação do Projeto
-- ============================================

-- 1. Verificar status do projeto
SELECT 
  'Projeto Ativo' as status,
  NOW() as timestamp,
  COUNT(*) as total_clients
FROM clients;

-- 2. Verificar últimos agendamentos
SELECT 
  COUNT(*) as total_appointments,
  MAX(created_at) as ultimo_agendamento
FROM appointments;

-- 3. Verificar treinos ativos
SELECT 
  COUNT(*) as total_workouts,
  MAX(created_at) as ultimo_treino
FROM workouts;

-- 4. Estatísticas gerais
SELECT 
  (SELECT COUNT(*) FROM clients) as total_alunos,
  (SELECT COUNT(*) FROM appointments) as total_agendamentos,
  (SELECT COUNT(*) FROM workouts) as total_treinos,
  (SELECT COUNT(*) FROM assessments) as total_avaliacoes;

-- ============================================
-- FIM - Projeto Reativado! 🚀
-- ============================================
