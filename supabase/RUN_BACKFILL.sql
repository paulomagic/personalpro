-- ============================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- ============================================

-- 0) Garantir extensão pgcrypto (em Supabase Cloud, fica no schema "extensions")
create extension if not exists pgcrypto schema extensions;

-- 1) Recriar get_clinical_data_key com search_path correto
create or replace function public.get_clinical_data_key()
returns text
as $$
declare
  v_key text;
begin
  begin
    if to_regclass('vault.decrypted_secrets') is not null then
      execute
        'select decrypted_secret
           from vault.decrypted_secrets
          where name = ''clinical_data_key''
          order by created_at desc
          limit 1'
      into v_key;
    end if;
  exception
    when others then
      v_key := null;
  end;

  if v_key is null or length(trim(v_key)) < 16 then
    v_key := current_setting('app.settings.clinical_data_key', true);
  end if;

  if v_key is null or length(trim(v_key)) < 16 then
    return null;
  end if;

  return v_key;
end;
-- IMPORTANTE: search_path inclui "extensions" para encontrar pgp_sym_encrypt
$$ language plpgsql security definer set search_path = public, extensions;

-- 2) Recriar trigger com search_path correto (inclui "extensions")
create or replace function public.encrypt_clients_sensitive_columns()
returns trigger
as $$
declare
  v_key text;
  v_bmi numeric;
  v_height_m numeric;
begin
  v_key := public.get_clinical_data_key();
  if v_key is null then
    return new;
  end if;

  new.injuries_encrypted := pgp_sym_encrypt(
    coalesce(new.injuries, ''),
    v_key,
    'cipher-algo=aes256, compress-algo=1'
  );

  new.observations_encrypted := pgp_sym_encrypt(
    coalesce(new.observations, ''),
    v_key,
    'cipher-algo=aes256, compress-algo=1'
  );

  new.preferences_encrypted := pgp_sym_encrypt(
    coalesce(new.preferences, ''),
    v_key,
    'cipher-algo=aes256, compress-algo=1'
  );

  v_bmi := null;
  if new.weight is not null and new.weight > 0
     and new.height is not null and new.height > 0 then
    -- Se height > 3, assumir centímetros; senão assumir metros
    if new.height > 3 then
      v_height_m := new.height / 100.0;
    else
      v_height_m := new.height;
    end if;
    if v_height_m > 0.3 then
      v_bmi := round((new.weight / (v_height_m * v_height_m))::numeric, 2);
      -- Ignorar valores absurdos (BMI razoável: 10 a 100)
      if v_bmi < 5 or v_bmi > 200 then
        v_bmi := null;
      end if;
    end if;
  end if;

  new.bmi_encrypted := pgp_sym_encrypt(
    coalesce(v_bmi::text, ''),
    v_key,
    'cipher-algo=aes256, compress-algo=1'
  );

  return new;
end;
-- IMPORTANTE: search_path inclui "extensions" para encontrar pgp_sym_encrypt
$$ language plpgsql security definer set search_path = public, extensions;

drop trigger if exists trg_encrypt_clients_sensitive_columns on public.clients;
create trigger trg_encrypt_clients_sensitive_columns
before insert or update of injuries, observations, preferences, weight, height
on public.clients
for each row
execute function public.encrypt_clients_sensitive_columns();

-- 3) Recriar backfill com permissão para papel postgres do SQL Editor
create or replace function public.backfill_client_sensitive_encryption(
  p_limit integer default 500
)
returns bigint
as $$
declare
  is_admin boolean := false;
  v_limit integer := greatest(p_limit, 1);
  v_updated bigint := 0;
begin
  if current_user = 'postgres' or auth.role() = 'service_role' then
    is_admin := true;
  else
    select exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    ) into is_admin;
  end if;

  if not is_admin then
    raise exception 'Insufficient privileges';
  end if;

  with candidates as (
    select id
    from public.clients
    where injuries_encrypted is null
       or observations_encrypted is null
       or preferences_encrypted is null
       or bmi_encrypted is null
    order by created_at asc
    limit v_limit
  )
  update public.clients c
     set injuries = c.injuries
    from candidates
   where c.id = candidates.id;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$ language plpgsql security definer set search_path = public, extensions;

-- 4) Salvar chave no Vault (sem precisar de ALTER DATABASE)
do $$
begin
  if to_regclass('vault.decrypted_secrets') is not null then
    if not exists (select 1 from vault.decrypted_secrets where name = 'clinical_data_key') then
      perform vault.create_secret(
        '3a549bce05623bb3a3f8031b132b4c53c2803507535d41b988a8df4025c2f249',
        'clinical_data_key',
        'Chave AES-256 para dados clinicos sensiveis'
      );
    end if;
  end if;
end $$;

-- 5) Rodar backfill
select public.backfill_client_sensitive_encryption(500) as rows_updated;

-- 6) Confirmar resultados
select
  count(*) as total_clients,
  count(*) filter (where injuries_encrypted is not null) as injuries_ok,
  count(*) filter (where observations_encrypted is not null) as observations_ok,
  count(*) filter (where preferences_encrypted is not null) as preferences_ok,
  count(*) filter (where bmi_encrypted is not null) as bmi_ok
from public.clients;
