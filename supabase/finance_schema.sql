-- ================================================
-- FINANCIAL SYSTEM UPGRADE
-- Execute no Supabase SQL Editor
-- ================================================

-- ============ CLIENTS - Campos Financeiros ============
ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 350;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_day INTEGER DEFAULT 10;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS session_price DECIMAL(10,2) DEFAULT 80;

-- Add constraint for payment_day (1-31)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clients_payment_day_check'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_payment_day_check 
        CHECK (payment_day >= 1 AND payment_day <= 31);
    END IF;
END $$;

-- Add constraint for payment_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clients_payment_type_check'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_payment_type_check 
        CHECK (payment_type IN ('monthly', 'per_session'));
    END IF;
END $$;

-- ============ PAYMENTS - Campos Adicionais ============
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'pix';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'monthly';

-- Add constraint for payment_method
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payments_method_check'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT payments_method_check 
        CHECK (payment_method IN ('pix', 'cash', 'card', 'transfer'));
    END IF;
END $$;

-- Add constraint for type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payments_type_check'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT payments_type_check 
        CHECK (type IN ('monthly', 'session'));
    END IF;
END $$;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
