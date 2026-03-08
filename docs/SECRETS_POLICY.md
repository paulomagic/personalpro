# Política de Segredos e Dados Clínicos

## Objetivo

Evitar vazamento de credenciais, reduzir exposição operacional e elevar proteção de dados sensíveis de saúde.

## Regras obrigatórias

1. Nunca versionar `.env`, `.env.local` ou chaves privadas.
2. Nunca colocar segredos em `VITE_*` (frontend é público por definição).
3. Chaves sensíveis devem ficar em:
   - Supabase Secrets (Edge Functions), ou
   - configuração segura do banco para criptografia clínica.
4. Toda alteração deve passar por secret scan:
   - local (pre-commit): `npm run secret-scan:staged`
   - CI: `npm run secret-scan`

## Segredos operacionais atuais

- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_SECRET_KEY`
- `WEB_PUSH_VAPID_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT`
- chaves dos providers de IA usados nas edge functions
- chave de criptografia clínica

## Regras adicionais

- logs não devem conter payload sensível bruto
- prompts de IA devem receber contexto sanitizado
- secrets de edge function não devem ser espelhados em config de frontend
- qualquer feature nova com arquivo, webhook, push ou provider externo deve documentar seus segredos aqui ou em doc operacional específico

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

- política padrão: 90 dias para `ai_logs` e `activity_logs`
- Funções:
  - `cleanup_old_logs(90)` para admin autenticado
  - `cleanup_old_logs_system(90)` para scheduler/service role

## Criptografia de dados clínicos (rollout progressivo)

- colunas cifradas em `clients`:
  - `injuries_encrypted`
  - `observations_encrypted`
  - `preferences_encrypted`
  - `bmi_encrypted`
- trigger automático cifra campos em insert/update quando a chave está disponível
- ainda existe transição de rollout; a política deve tratar leitura legada e leitura criptografada com cautela

## Backfill das colunas cifradas
Executar em lotes:
```sql
select public.backfill_client_sensitive_encryption(500);
```
