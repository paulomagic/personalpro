-- ============================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- ============================================

-- Título 1: Status das Execuções do CRON JOB (Limpeza de Logs de IA)
SELECT 
  j.jobname,
  r.start_time, 
  r.end_time, 
  r.status, 
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname = 'personalpro_cleanup_old_logs_daily'
ORDER BY r.start_time DESC 
LIMIT 5;

-- Título 2: Validação Contínua de Criptografia (Gatilho em Inserts/Updates recentes)
-- (Conta se algum cliente que foi atualizado hoje FICOU SEM os dados criptografados, o que indicaria falha do trigger)
SELECT 
  count(*) as total_modificados_recente,
  count(*) filter (where injuries_encrypted IS NULL AND (injuries IS NOT NULL AND injuries != '')) as falhas_injuries,
  count(*) filter (where observations_encrypted IS NULL AND (observations IS NOT NULL AND observations != '')) as falhas_observations,
  count(*) filter (where preferences_encrypted IS NULL AND (preferences IS NOT NULL AND preferences != '')) as falhas_preferences
FROM public.clients
WHERE updated_at > now() - interval '2 days';

-- Título 3: Certificando a Saúde Geral (Backfill Completo)
-- O número de ok_ deve ser sempre igual ao total de clientes
SELECT
  count(*) as total_clients,
  count(*) filter (where injuries_encrypted is not null) as injuries_ok,
  count(*) filter (where observations_encrypted is not null) as observations_ok,
  count(*) filter (where preferences_encrypted is not null) as preferences_ok,
  count(*) filter (where bmi_encrypted is not null) as bmi_ok
FROM public.clients;
