# Plano de Resposta a Incidentes

Documento operacional curto para incidentes reais.

## Papéis

- responsável técnico
  - investigação, contenção, correção e validação
- responsável de comunicação
  - alinhamento com usuário final, se houver impacto externo

## Severidade

- `P1`
  - vazamento de dados, indisponibilidade ampla, bypass de auth, quebra de LGPD
- `P2`
  - falha grave em login, edge functions, agenda, treino ou persistência
- `P3`
  - erro funcional importante com workaround
- `P4`
  - problema visual ou local sem impacto operacional relevante

## Resposta imediata

1. confirmar se o incidente é real
2. identificar escopo
3. conter o vetor
4. corrigir
5. validar
6. registrar post-mortem se for `P1` ou `P2`

## Contenção por cenário

| Cenário | Ação |
|---|---|
| segredo exposto | rotacionar no Supabase/Vercel imediatamente |
| abuso em auth | revisar `auth-guard`, rate limit e sessões |
| edge function comprometida | redeploy da função com versão segura |
| regressão em produção | `git revert` do commit responsável + redeploy |
| quebra de banco/migration | isolar operação afetada e validar impacto antes de novo deploy |

## Validação mínima após correção

```bash
npm run secret-scan
npm run security-check
npm run typecheck:all
npm run test:regression
npm run build
npm run test:e2e
```

## Locais de investigação

- Supabase Functions logs
- Supabase Auth logs
- Supabase Database logs
- Vercel deployments
- GitHub Actions
- painéis admin e logs do próprio app

## Documentos que devem refletir a correção

- `README.md`
- `SECURITY_CHECKLIST.md`
- doc operacional específica, se o incidente alterar fluxo permanente
