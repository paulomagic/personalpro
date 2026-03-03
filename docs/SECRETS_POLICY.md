# Política de Segredos e Dados Clínicos

## Objetivo
Evitar vazamento de credenciais e elevar proteção de dados sensíveis de saúde (LGPD).

## Regras obrigatórias
1. Nunca versionar `.env`, `.env.local` ou chaves privadas.
2. Nunca colocar segredos em `VITE_*` (frontend é público por definição).
3. Chaves sensíveis devem ficar em:
   - Supabase Secrets (Edge Functions), ou
   - Vault/setting seguro do banco para criptografia clínica.
4. Toda alteração deve passar por secret scan:
   - local (pre-commit): `npm run secret-scan:staged`
   - CI: `npm run secret-scan`

## Setup do pre-commit
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

## Rotação de segredos (quando houver incidente)
1. Revogar credencial comprometida no provedor.
2. Gerar nova credencial.
3. Atualizar segredo no ambiente seguro (Supabase/Vercel).
4. Revalidar deploy e executar `npm run security-check`.

## Retenção de logs
- Política padrão: 90 dias para `ai_logs` e `activity_logs`.
- Funções:
  - `cleanup_old_logs(90)` para admin autenticado
  - `cleanup_old_logs_system(90)` para scheduler/service role

## Criptografia de dados clínicos (rollout progressivo)
- Colunas cifradas em `clients`:
  - `injuries_encrypted`
  - `observations_encrypted`
  - `preferences_encrypted`
  - `bmi_encrypted`
- Trigger automático cifra campos em insert/update quando a chave está disponível.
- Chave buscada com prioridade:
  1. `vault.decrypted_secrets` com nome `clinical_data_key`
  2. `app.settings.clinical_data_key` (fallback)

## Backfill das colunas cifradas
Executar em lotes:
```sql
select public.backfill_client_sensitive_encryption(500);
```
