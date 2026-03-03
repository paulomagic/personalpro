-- Verify rollout: migrations + encryption key + backfill + retention scheduler
-- Run in Supabase SQL Editor (production project)

-- 1) Confirm target migrations are applied
SELECT version
FROM supabase_migrations.schema_migrations
WHERE version IN (
  '20260303_add_ai_log_retention_and_usage_metrics',
  '20260303_schedule_log_retention_job',
  '20260303_add_clinical_data_encryption_layer'
)
ORDER BY version;

-- 2) Confirm functions and encrypted columns exist
SELECT
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_logs') AS has_cleanup_old_logs,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_logs_system') AS has_cleanup_old_logs_system,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_ai_usage_by_user') AS has_get_ai_usage_by_user,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'backfill_client_sensitive_encryption') AS has_backfill_client_sensitive_encryption;

SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'injuries_encrypted'
  ) AS has_injuries_encrypted,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'observations_encrypted'
  ) AS has_observations_encrypted,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'preferences_encrypted'
  ) AS has_preferences_encrypted,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'bmi_encrypted'
  ) AS has_bmi_encrypted;

-- 3) Check encryption key availability (without exposing secret value)
SELECT to_regclass('vault.decrypted_secrets') IS NOT NULL AS has_vault;

SELECT
  CASE
    WHEN to_regclass('vault.decrypted_secrets') IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1
      FROM vault.decrypted_secrets
      WHERE name = 'clinical_data_key'
    )
  END AS has_vault_clinical_data_key,
  current_setting('app.settings.clinical_data_key', true) IS NOT NULL AS has_db_setting_clinical_data_key;

-- 4) Backfill progress for encrypted clinical shadows
SELECT
  COUNT(*) AS total_clients,
  COUNT(*) FILTER (WHERE injuries_encrypted IS NOT NULL) AS injuries_encrypted_count,
  COUNT(*) FILTER (WHERE observations_encrypted IS NOT NULL) AS observations_encrypted_count,
  COUNT(*) FILTER (WHERE preferences_encrypted IS NOT NULL) AS preferences_encrypted_count,
  COUNT(*) FILTER (WHERE bmi_encrypted IS NOT NULL) AS bmi_encrypted_count
FROM public.clients;

-- Optional: run batched backfill manually until this returns 0
-- SELECT public.backfill_client_sensitive_encryption(500) AS rows_updated;

-- 5) Retention scheduler checks (pg_cron)
SELECT to_regnamespace('cron') IS NOT NULL AS has_cron_schema;

SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'personalpro_cleanup_old_logs_daily';

SELECT
  jrd.jobid,
  jrd.status,
  jrd.start_time,
  jrd.end_time,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname = 'personalpro_cleanup_old_logs_daily'
ORDER BY jrd.start_time DESC
LIMIT 20;
