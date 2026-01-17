-- Migration: Add provider_used column to ai_logs table
-- Date: 2026-01-17
-- This fixes the 400 Bad Request error when logging AI actions from the new AI Router

-- Add provider_used column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ai_logs' AND column_name = 'provider_used') THEN
        ALTER TABLE ai_logs ADD COLUMN provider_used TEXT;
    END IF;
END $$;

-- Note: Other fields like schema_valid, rejection_reason, fallback_used 
-- are stored in the existing 'metadata' JSONB column, so no additional columns needed

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_logs' 
ORDER BY ordinal_position;
