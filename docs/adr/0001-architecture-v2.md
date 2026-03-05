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
- `App.tsx` fica responsável por composição, autenticação e layout.
- Estado compartilhado de navegação/contexto vai para um store leve dedicado.

2. Dados
- `services/supabase/domains/*` vira a única porta de acesso ao banco para a UI.
- `supabaseCore` continua como infraestrutura de baixo nível.
- arquivos agregadores legados devem ser removidos.

3. IA
- `workoutGenerationOrchestrator` passa a ser o ponto único de orquestração de geração.
- `trainingEngine`, `aiRouter` e fallback local viram estratégias internas do pipeline.
- `aiRouter` segue como registry e execução multi-provider.

4. Observabilidade
- métricas de produto, qualidade IA e saúde de providers permanecem em `loggingService`.
- qualquer nova jornada crítica deve emitir eventos de funil.

5. PWA
- service worker permanece versionado e responsável por cache, background sync e push.
- filas offline persistentes usam IndexedDB com fallback controlado.

## Consequências
### Positivas
- menor acoplamento no shell
- caminho único para geração de treino
- acesso a dados mais previsível
- melhor testabilidade por módulo

### Negativas
- ainda existe navegação manual; a migração para router formal fica como passo seguinte
- store leve resolve estado compartilhado imediato, mas não substitui server-state

## Próximos Passos
1. remover todo acesso residual ao legado de dados
2. migrar navegação manual para router formal
3. fechar backend emissor de web push
4. eliminar `unsafe-inline` remanescente da CSP
