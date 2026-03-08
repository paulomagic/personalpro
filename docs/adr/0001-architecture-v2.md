# ADR 0001: Arquitetura Alvo V2

## Status
Aceito

## Contexto
O aplicativo já possui boa cobertura funcional, mas vinha acumulando três tensões:
- shell principal com estado de navegação/contexto espalhado
- acesso a dados híbrido entre domains novos e legado
- geração de treino com múltiplos caminhos de orquestração

Isso aumenta custo de mudança, risco de regressão e variabilidade da IA.

## Decisão
Adotar a arquitetura v2 com as seguintes fronteiras:

1. Shell de aplicação
- `App.tsx` permanece responsável por composição, autenticação, error boundary e layout principal.
- estado compartilhado de navegação/contexto fica em store leve dedicado.
- roteamento formal é feito por `React Router` em `components/AppContentRouter.tsx`.
- sincronização entre estado interno e URL fica em `useRouterNavigationSync` e `useDeepLinkHydration`.

2. Dados
- `services/supabase/domains/*` é a porta padrão de acesso ao banco para a UI.
- `supabaseCore` continua como infraestrutura de baixo nível.
- caminhos legados agregadores devem continuar sendo removidos.

3. IA
- `workoutGenerationOrchestrator` é o ponto único de orquestração de geração.
- `trainingEngine`, `aiRouter` e fallback local operam como estratégias internas.
- providers ficam encapsulados sob router e validação.

4. Observabilidade
- logging de produto, qualidade IA e saúde operacional usa `loggingService` e `appLogger`.
- edge functions compartilham logger próprio em `supabase/functions/_shared/edgeLogger.ts`.
- jornadas críticas devem emitir evento estruturado.

5. PWA
- service worker permanece versionado e responsável por cache, offline shell, background sync e push.
- filas offline persistentes usam storage local controlado.

## Consequências
### Positivas
- menor acoplamento no shell
- router e URL reais
- caminho único para geração de treino
- acesso a dados mais previsível
- melhor testabilidade por módulo
- melhor separação entre fluxo demo e fluxo real

### Negativas
- ainda existem pontos herdados de navegação e hidratação contextual que exigem disciplina
- store leve resolve estado compartilhado, mas não substitui server-state
- há áreas especializadas ainda com acoplamento acima do ideal

## Próximos Passos
1. remover todo acesso residual ao legado de dados
2. continuar reduzindo acoplamento do shell e de telas grandes
3. ampliar observabilidade e alertas operacionais
4. reduzir `alert(...)` remanescente e melhorar acessibilidade
