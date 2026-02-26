-- =========================================================================================
-- SCRIPT DE RESOLUÇÃO DE AVISOS DE SEGURANÇA (Supabase Security Advisor)
-- =========================================================================================
-- Por favor, copie e cole este script no seu Supabase SQL Editor e clique em "Run".
-- 
-- Este script corrige dois problemas comuns apontados pelo Supabase:
-- 1. Views definidas como SECURITY DEFINER sem necessidade (Exclui a view coach_students não utilizada)
-- 2. Funções SECURITY DEFINER vulneráveis à injeção de search_path (Adiciona SET search_path)
-- =========================================================================================

-- 1. REMOVER VIEW NÃO UTILIZADA
-- A view 'coach_students' estava sendo apontada como "Security Definer View". 
-- Após análise do código fonte da aplicação, foi confirmado que ela NÃO é utilizada 
-- em nenhum lugar do frontend. A exclusão é a forma mais fácil e segura de resolver.
DROP VIEW IF EXISTS public.coach_students;

-- 2. CORRIGIR VULNERABILIDADE DE FUNÇÕES SECURITY DEFINER
-- O Supabase exige que funções marcadas como 'SECURITY DEFINER' declarem explicitamente
-- o namespace (search_path) que devem utilizar. Sem isso, a função pode acidentalmente
-- executar objetos mal-intencionados que um usuário crie no schema principal.
-- As alterações abaixo configuram o `search_path = public` de forma segura.

-- Atualizar handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Atualizar accept_invitation 
ALTER FUNCTION public.accept_invitation(VARCHAR) SET search_path = public;

-- Atualizar get_ai_generation_metrics (caso ela exista)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_ai_generation_metrics') THEN
    EXECUTE 'ALTER FUNCTION public.get_ai_generation_metrics(INTEGER) SET search_path = public;';
  END IF;
END $$;

-- Atualizar mensagem do Schema para refletir a correção
COMMENT ON SCHEMA public IS 'Corrigida view coach_students e refatorados os search_paths de funcoes SECURITY DEFINER';
