-- ============================================
-- FIX: Vincular client_id ao user_profile da Camila
-- Execute no Supabase SQL Editor
-- ============================================

-- Passo 1: Encontrar o ID do usuário Camila e o cliente correspondente
-- Rode esta query primeiro para ver os dados:

SELECT 
  up.id as user_id,
  up.role,
  up.coach_id,
  up.client_id,
  up.full_name,
  i.email,
  i.client_id as invitation_client_id
FROM user_profiles up
LEFT JOIN invitations i ON i.email = (
  SELECT email FROM auth.users WHERE id = up.id
)
WHERE up.role = 'student';

-- Passo 2: Listar clientes para encontrar a Camila
SELECT id, name, email FROM clients WHERE name ILIKE '%camila%';

-- Passo 3: Atualizar o user_profile com o client_id correto
-- SUBSTITUA os UUIDs abaixo pelos valores corretos!

-- UPDATE user_profiles
-- SET client_id = 'ID_DO_CLIENTE_CAMILA'
-- WHERE id = '31c0a83c-5072-4308-b862-317551bad0f';

-- OU, para atualizar automaticamente baseado no email:
UPDATE user_profiles up
SET client_id = c.id
FROM clients c
WHERE c.email = (SELECT email FROM auth.users WHERE id = up.id)
  AND up.role = 'student'
  AND up.client_id IS NULL;
