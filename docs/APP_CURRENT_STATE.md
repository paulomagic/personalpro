# Estado Atual do App

## Resumo

O app está em estágio de produto funcional, não de MVP cru. O núcleo coach/aluno/admin já existe, com IA, Supabase, PWA, testes e operação básica de LGPD.

## Arquitetura atual

- shell principal em `App.tsx`
- roteamento real com `React Router` em `components/AppContentRouter.tsx`
- sincronização de URL, contexto e hidratação via:
  - `services/app/useRouterNavigationSync.ts`
  - `services/app/useDeepLinkHydration.ts`
  - `services/navigation/historyNavigation.ts`
- estado de shell em `services/appShellStore.ts`
- acesso a dados da UI via `services/supabase/domains/*`
- pipeline de IA concentrado em:
  - `services/ai/workoutGenerationOrchestrator.ts`
  - `services/ai/aiRouter.ts`
  - `services/ai/trainingEngine.ts`

## Áreas do produto

### Coach

- dashboard
- alunos
- perfil do aluno
- agenda
- financeiro
- builder de treino
- execução de treino
- avaliações
- configurações

### Aluno

- dashboard do aluno
- calendário do aluno
- execução de treino
- perfil/configurações

### Admin

- visão geral admin
- usuários
- logs de IA
- dashboard de IA
- logs de atividade
- configurações admin

## Demo vs real

- modo demo continua existindo para validação comercial e smoke tests
- fluxos reais não devem mais cair para dados demo silenciosamente
- estados vazios e erros operacionais agora precisam aparecer como estados honestos da aplicação

## Segurança e privacidade

- auth guard server-side
- validação de Turnstile
- rate limit
- RLS no Supabase
- camada de criptografia clínica
- logger estruturado em fluxos críticos
- privacidade operacional com solicitação e exportação LGPD

## Observabilidade atual

- logging estruturado em partes críticas do frontend, domains, providers e edge functions
- dashboard admin de IA com saúde operacional
- ainda falta centralização externa madura e alertas automatizados mais amplos

## PWA e offline

- `public/offline.html`
- service worker versionado
- banner de conectividade
- persistência offline para filas específicas
- teste E2E cobrindo fallback offline

## Testes

- regressão via `node --test`
- E2E via Playwright
- auditoria de acessibilidade no E2E
- build e orçamento de bundle tratados como gate

## Pendências reais

- remover `alert(...)` remanescente de telas e componentes ainda não revisados
- ampliar acessibilidade além das telas já cobertas
- concluir anonimização de prompts em toda a superfície de IA
- evoluir observabilidade para alertas e visão operacional mais completa
- revisar áreas especializadas ainda muito acopladas, como treino esportivo e builder tradicional
