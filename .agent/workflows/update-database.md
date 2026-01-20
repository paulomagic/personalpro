---
description: Como atualizar dados no banco Supabase (o jeito simples)
---

# Workflow: Atualizar Dados no Supabase

## ⚠️ IMPORTANTE: Mantenha Simples!

**NÃO** tente executar via scripts Node.js ou APIs complexas.
**SIM** crie SQL que o usuário cola manualmente no Supabase.

---

## Processo Padrão

### 1. Criar Arquivo SQL
Crie um arquivo `.sql` na pasta `supabase/` com nome descritivo:
- Exemplo: `COLAR_NO_SUPABASE.sql`, `update_students.sql`, etc.

### 2. Estrutura do SQL
```sql
-- ============================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- ============================================

-- 1. DELETE (se necessário)
DELETE FROM assessments 
WHERE client_id IN (SELECT id FROM clients WHERE name IN ('Nome1', 'Nome2'));

DELETE FROM clients WHERE name IN ('Nome1', 'Nome2');

-- 2. INSERT/UPDATE
INSERT INTO clients (coach_id, name, age, ...)
SELECT 
  coach_id, -- Pega de um cliente existente
  'Novo Nome',
  ...
FROM clients 
LIMIT 1;

-- 3. Verificação
SELECT * FROM clients WHERE name IN ('Novo Nome');
```

### 3. Usar SELECT para coach_id
**NUNCA** peça o UUID do usuário manualmente.
**SEMPRE** use `SELECT coach_id FROM clients LIMIT 1` para pegar automaticamente.

### 4. Commit e Deploy
```bash
git add -A
git commit -m "feat: descrição das mudanças SQL"
git push origin main
```

### 5. Informar ao Usuário
Diga ao usuário:
1. Abra Supabase SQL Editor
2. Cole o SQL do arquivo criado
3. Execute
4. Recarregue o app

---

## Exemplo Real (Substituir Alunos)

Ver arquivo: `supabase/COLAR_NO_SUPABASE.sql`

**Passos:**
1. DELETE dos alunos antigos (e seus assessments)
2. INSERT dos novos alunos usando `SELECT coach_id FROM clients LIMIT 1`
3. SELECT de verificação
4. Commit e push
5. Usuário cola no Supabase

---

## ❌ O Que NÃO Fazer

- ❌ Criar scripts Node.js que tentam autenticar
- ❌ Usar APIs do Supabase com anon key (raramente funciona para admin)
- ❌ Pedir UUIDs manualmente ao usuário
- ❌ Tentar automatizar tudo via código

## ✅ O Que Fazer

- ✅ SQL simples e direto
- ✅ Usar SELECT para pegar coach_id automaticamente
- ✅ Nome de arquivo óbvio (COLAR_NO_SUPABASE.sql)
- ✅ Instruções claras de 3-4 passos
- ✅ Deixar o usuário colar no Supabase manualmente
