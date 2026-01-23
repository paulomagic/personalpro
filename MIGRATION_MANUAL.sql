-- ============================================================
-- EXECUTAR MANUALMENTE NO SUPABASE SQL EDITOR
-- ============================================================
-- Navegue para: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- Cole este script completo e execute
-- ============================================================

-- Adiciona campos estruturados para dados físicos do cliente
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age > 0 AND age <= 120),
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2) CHECK (weight > 0 AND weight <= 500),
ADD COLUMN IF NOT EXISTS height DECIMAL(5,2) CHECK (height > 0 AND height <= 300);

-- Adiciona comentários para documentação
COMMENT ON COLUMN clients.age IS 'Idade do cliente em anos (1-120)';
COMMENT ON COLUMN clients.weight IS 'Peso do cliente em kg (precisão de 2 casas decimais)';
COMMENT ON COLUMN clients.height IS 'Altura do cliente em cm (precisão de 2 casas decimais)';

-- Criar índice para queries que filtram por idade
CREATE INDEX IF NOT EXISTS idx_clients_age ON clients(age) WHERE age IS NOT NULL;

-- VERIFICAÇÃO (opcional - executar após o ALTER TABLE acima)
-- Descomente as linhas abaixo para verificar que as colunas foram criadas:
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'clients' AND column_name IN ('age', 'weight', 'height');
