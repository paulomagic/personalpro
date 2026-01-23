-- Migration: Add client physical data fields
-- Description: Adiciona campos estruturados para idade, peso e altura dos clientes
-- Author: Paulo Ricardo
-- Date: 2026-01-23

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
