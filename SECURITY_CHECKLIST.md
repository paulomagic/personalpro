# Security Checklist

## Uso

Este é o checklist operacional de segurança vigente. Ele deve refletir o estado real do projeto, não histórico de auditoria.

## Antes de merge ou deploy

- [ ] `npm run secret-scan`
- [ ] `npm run security-check`
- [ ] `npm run typecheck:all`
- [ ] `npm run test:regression`
- [ ] `npm run build`
- [ ] `npm run test:e2e`

## Para toda nova feature

### Entrada e saída

- [ ] campos textuais validados antes de persistir ou renderizar
- [ ] campos numéricos com range coerente
- [ ] URLs externas validadas
- [ ] uploads com validação de tipo e tamanho
- [ ] saída de IA tratada como dado não confiável

### Auth e autorização

- [ ] autenticação obrigatória onde o fluxo não é demo
- [ ] RLS aplicada em novas tabelas
- [ ] operações sensíveis não dependem só de bloqueio client-side
- [ ] admin continua validado por backend e políticas, não só por UI

### Dados sensíveis

- [ ] nada sensível em `console.*`
- [ ] prompts de IA recebem contexto sanitizado
- [ ] segredos não são expostos em `VITE_*`
- [ ] leitura e escrita de dados clínicos seguem o rollout de criptografia

### Rede e browser

- [ ] `window.open()` com destino conhecido e `noopener,noreferrer`
- [ ] CORS restrito nas edge functions
- [ ] rate limit em endpoints expostos a abuso
- [ ] service worker não quebra fluxo autenticado nem purga incorretamente dados do usuário

## Controles hoje ativos

- edge functions para IA e auth
- Turnstile no fluxo correspondente
- auth guard com rate limit server-side
- secret scan
- security check em CI
- RLS nas áreas críticas
- retenção de logs
- camada de criptografia clínica
- logger estruturado em fluxos críticos

## Gaps ainda abertos

- anonimização completa em toda a superfície de IA
- remoção total de `console.*` residual
- política de leitura 100% migrada para dados criptografados
- centralização de alertas de segurança e operação
- revisão ampla de componentes ainda não cobertos por saneamento/a11y

## Edge functions em produção

- `auth-guard`
- `validate-turnstile`
- `gemini-proxy`
- `groq-proxy`
- `complete-invite-signup`
- `send-push`
- `admin-users`
