-- Adicionar colunas faltantes na tabela clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS injuries TEXT,
ADD COLUMN IF NOT EXISTS preferences TEXT;

-- Opcional: Adicionar missed_classes e assessments se necessário, mas geralmente são tabelas separadas ou JSONB
-- Para simplificar, vou adicionar assessments como JSONB se for o caso do frontend enviar tudo junto, 
-- mas o ideal é normalizar. Por enquanto, vamos focar no que causou o erro.

-- Se o frontend estiver mandando 'demo-user-id' para coach_id, isso vai falhar porque coach_id é UUID.
-- Precisamos garantir que o usuário esteja logado.
