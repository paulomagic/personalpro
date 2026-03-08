# LGPD e Operação de Privacidade

## O que já existe

Fluxo operacional ativo para o titular:

- criar solicitação de privacidade
- cancelar solicitação aberta
- exportar dados próprios
- registrar trilha de auditoria por evento
- consultar histórico na interface
- registrar e revogar consentimentos auditáveis

## Banco e migrations

Migrations mínimas deste fluxo:

1. `20260306_add_privacy_requests_and_export_rpc.sql`
2. `20260306_expand_privacy_operations.sql`
3. `20260308_add_privacy_consents.sql`

Complemento importante para dados sensíveis:

- `20260303_add_clinical_data_encryption_layer.sql`

## Estruturas principais

- `public.privacy_requests`
- `public.privacy_request_events`
- `public.privacy_consents`

Funções principais:

- `create_privacy_request`
- `export_my_privacy_data`
- `cancel_my_privacy_request`
- `upsert_my_privacy_consent`

## Camada de aplicação

- serviço: `services/privacyService.ts`
- UI: `components/settings/SettingsPrivacyModal.tsx`
- acesso: Configurações → Privacidade e Dados
- versão atual da política: `2026-03-08`

## Validação rápida no banco

Verificar funções:

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'create_privacy_request',
    'export_my_privacy_data',
    'cancel_my_privacy_request',
    'upsert_my_privacy_consent'
  )
order by routine_name;
```

Verificar tabelas:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('privacy_requests', 'privacy_request_events', 'privacy_consents')
order by table_name;
```

Verificar solicitações recentes:

```sql
select id, request_type, status, created_at, processed_at
from public.privacy_requests
order by created_at desc
limit 10;
```

Verificar eventos:

```sql
select privacy_request_id, event_type, message, created_at
from public.privacy_request_events
order by created_at desc
limit 20;
```

Verificar consentimentos:

```sql
select consent_type, granted, version, granted_at, revoked_at, created_at
from public.privacy_consents
order by updated_at desc
limit 20;
```

## Escopo atual

Implementado:

- solicitação de acesso
- solicitação de exclusão
- exportação self-service
- cancelamento de solicitação aberta
- histórico e auditoria
- consentimento explícito registrável para política, IA e dados clínicos
- inventário resumido de dados e política pública alinhada com a interface

Ainda não fechado ponta a ponta:

- exclusão material completa orquestrada em todos os domínios
- política operacional completa de retenção por tipo de dado
- revisão final das telas de entrada para consentimento contextual por fluxo

## Inventário resumido de dados

- identificação e conta: nome, email, avatar, autenticação e sessão
- operação do serviço: agenda, alunos, pagamentos, convites, notificações e preferências
- treino e evolução: programas, feedbacks, métricas, histórico de execução e avaliações
- dados sensíveis: observações clínicas e campos protegidos pela camada de criptografia clínica
- governança: solicitações LGPD, eventos de auditoria, consentimentos e exportações

## Fluxo operacional atual

1. O titular abre `Configurações → Privacidade e Dados`.
2. Pode solicitar acesso, correção, exclusão ou exportação.
3. Pode consultar o histórico de solicitações já registradas.
4. Pode conceder ou revogar consentimentos auditáveis.
5. O backend registra trilha de auditoria e inclui consentimentos na exportação.

## Posição oficial

O app já tem base operacional de privacidade real, mas ainda não deve ser tratado como compliance “enterprise completo”. A camada atual reduz risco e melhora transparência; não substitui governança formal.
