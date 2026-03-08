# LGPD e Operação de Privacidade

## O que já existe

Fluxo operacional ativo para o titular:

- criar solicitação de privacidade
- cancelar solicitação aberta
- exportar dados próprios
- registrar trilha de auditoria por evento
- consultar histórico na interface

## Banco e migrations

Migrations mínimas deste fluxo:

1. `20260306_add_privacy_requests_and_export_rpc.sql`
2. `20260306_expand_privacy_operations.sql`

Complemento importante para dados sensíveis:

- `20260303_add_clinical_data_encryption_layer.sql`

## Estruturas principais

- `public.privacy_requests`
- `public.privacy_request_events`

Funções principais:

- `create_privacy_request`
- `export_my_privacy_data`
- `cancel_my_privacy_request`

## Camada de aplicação

- serviço: `services/privacyService.ts`
- UI: `components/settings/SettingsPrivacyModal.tsx`
- acesso: Configurações → Privacidade e Dados

## Validação rápida no banco

Verificar funções:

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'create_privacy_request',
    'export_my_privacy_data',
    'cancel_my_privacy_request'
  )
order by routine_name;
```

Verificar tabelas:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('privacy_requests', 'privacy_request_events')
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

## Escopo atual

Implementado:

- solicitação de acesso
- solicitação de exclusão
- exportação self-service
- cancelamento de solicitação aberta
- histórico e auditoria

Ainda não fechado ponta a ponta:

- consentimento explícito orientado por base legal nas entradas do produto
- exclusão material completa orquestrada em todos os domínios
- inventário formal de dados sensíveis por categoria
- política operacional completa de retenção por tipo de dado

## Posição oficial

O app já tem base operacional de privacidade real, mas ainda não deve ser tratado como compliance “enterprise completo”. A camada atual reduz risco e melhora transparência; não substitui governança formal.
