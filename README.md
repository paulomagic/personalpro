# Personal Pro

Aplicação web para personal trainers com foco em gestão de alunos, treinos, agenda, financeiro, IA para prescrição e operação mobile-first.

## Estado atual

O projeto já não é um protótipo de AI Studio. Hoje ele roda como app React + Vite + Supabase, com:

- autenticação e perfis por papel
- dashboard coach e dashboard aluno
- gestão de alunos, perfil clínico e avaliações
- builder de treino e execução de treino
- agenda, financeiro e convites
- área admin com usuários, IA, logs e atividade
- PWA com fallback offline
- E2E com Playwright rodando como padrão do projeto
- operação de LGPD com solicitação, auditoria, exportação e cancelamento

## Stack

- `React 19`
- `Vite 6`
- `TypeScript`
- `React Router`
- `TanStack Query`
- `Supabase`
- `Framer Motion`
- `Playwright`

## Execução local

Pré-requisitos:

- `Node.js 22+`
- projeto Supabase configurado
- `.env.local` compatível com `.env.example`

Instalação:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Preview de produção:

```bash
npm run build
npm run preview
```

## Validação obrigatória

Antes de merge ou deploy:

```bash
npm run typecheck:all
npm run test:regression
npm run build
npm run bundle:budget
npm run test:e2e
```

Verificação de segurança:

```bash
npm run security-check
```

## Deploy e backend

Migrations recentes relevantes:

- `20260303_add_clinical_data_encryption_layer.sql`
- `20260305_create_push_subscriptions.sql`
- `20260306_add_privacy_requests_and_export_rpc.sql`
- `20260306_expand_privacy_operations.sql`

Edge Functions ativas:

- `auth-guard`
- `validate-turnstile`
- `gemini-proxy`
- `groq-proxy`
- `complete-invite-signup`
- `send-push`
- `admin-users`

Deploy típico:

```bash
supabase db push
supabase functions deploy auth-guard
supabase functions deploy validate-turnstile
supabase functions deploy gemini-proxy
supabase functions deploy groq-proxy
supabase functions deploy complete-invite-signup
supabase functions deploy send-push
supabase functions deploy admin-users
```

## Convenções importantes

- usuário `demo` pode ver dados demo
- usuário real nunca deve receber fallback demo silencioso
- acesso ao banco na UI passa por `services/supabase/domains/*`
- erros operacionais devem usar logger estruturado, não `console.*` cru
- novas jornadas críticas devem ser cobertas por regressão e, quando fizer sentido, E2E

## Documentação canônica

- [docs/README.md](docs/README.md)
- [docs/APP_CURRENT_STATE.md](docs/APP_CURRENT_STATE.md)
- [docs/LGPD_OPERATIONS.md](docs/LGPD_OPERATIONS.md)
- [docs/PWA_OFFLINE.md](docs/PWA_OFFLINE.md)
- [docs/PUSH_SETUP.md](docs/PUSH_SETUP.md)
- [docs/SECRETS_POLICY.md](docs/SECRETS_POLICY.md)
- [docs/adr/0001-architecture-v2.md](docs/adr/0001-architecture-v2.md)
- [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)
- [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)

## Observação

Documentos históricos e relatórios automáticos que estavam desatualizados foram removidos de propósito para evitar referência errada ao estado atual do app.
