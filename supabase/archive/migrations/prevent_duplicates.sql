-- ===========================================
-- PREVENÇÃO DE AGENDAMENTOS DUPLICADOS
-- ===========================================
-- Este script adiciona uma constraint ÚNICA na tabela appointments
-- para impedir que dois agendamentos ocupem o mesmo horário
-- para o mesmo coach

-- Primeiro, identificar e listar duplicados existentes
SELECT 
    coach_id,
    date,
    time,
    COUNT(*) as total,
    STRING_AGG(id::text, ', ') as appointment_ids
FROM appointments 
WHERE status != 'cancelled'
GROUP BY coach_id, date, time
HAVING COUNT(*) > 1;

-- ⚠️ IMPORTANTE: Antes de rodar o próximo comando,
-- você precisa MANUALMENTE deletar os agendamentos duplicados
-- mantendo apenas 1 por horário

-- Para deletar duplicados (EXECUTE MANUALMENTE após revisar):
-- DELETE FROM appointments 
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT id, ROW_NUMBER() OVER (PARTITION BY coach_id, date, time ORDER BY created_at DESC) as rn
--         FROM appointments
--         WHERE status != 'cancelled'
--     ) t
--     WHERE rn > 1
-- );

-- Após limpar os duplicados, adicione a constraint:
-- ALTER TABLE appointments
-- ADD CONSTRAINT unique_coach_date_time 
-- UNIQUE (coach_id, date, time);

-- OU, se quiser uma constraint mais flexível que permite múltiplos 
-- agendamentos para diferentes clientes no mesmo horário (caso de grupo):
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_appointment 
-- ON appointments(coach_id, date, time, client_id) 
-- WHERE status != 'cancelled';
