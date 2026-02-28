# 🚨 Plano de Resposta a Incidentes (IRP)

**Nível de Confidencialidade:** Interno  
**Última Atualização:** 2026-02-27  
**Responsável:** Paulo Ricardo

Este documento define os procedimentos padrão para detectar, responder e recuperar de incidentes de segurança no PersonalPro.

---

## 👥 1. Funções e Responsabilidades

| Função | Responsabilidade | Contato |
|--------|------------------|---------|
| **Incident Commander** | Coordena a resposta, toma decisões críticas | `@PauloRicardo` |
| **Tech Lead / Dev** | Investigação técnica, correção de código | `@DevTeam` |
| **Comunicação** | Notifica usuários afetados (se necessário) | `@Support` |

---

## 🔄 2. Ciclo de Vida do Incidente

### Fase 1: Detecção e Análise
**Gatilhos automáticos:**
- Logs de erro anômalos no Supabase (`ai_logs`, `activity_logs`)
- Falha na verificação do CI (`npm run security-check`)
- Alerta de usuário sobre comportamento estranho
- Pico incomum de requests nas Edge Functions (rate limit ativado repetidamente)

**Ações:**
1. Validar se é um falso positivo
2. Classificar severidade (Baixa, Média, Alta, Crítica)
3. Abrir issue/ticket de incidente no GitHub

### Fase 2: Contenção
**Objetivo:** Interromper o vetor de ataque imediatamente.

| Cenário | Ação Imediata |
|---------|---------------|
| Vazamento de chave API | Rotacionar no painel Supabase / Vercel imediatamente |
| Ataque DDoS | Verificar rate limits das Edge Functions; ativar "Under Attack Mode" no Cloudflare |
| Abuso de Auth (brute force) | `auth-guard` bloqueia automaticamente; revogar sessão via Supabase Auth se necessário |
| Bug Crítico em produção | `git revert` + `git push` → Vercel redeploy automático |
| Edge Function comprometida | `supabase functions deploy [nome-da-funcao]` com versão segura |

### Fase 3: Erradicação e Recuperação
1. Aplicar hotfix via PR (seguir fluxo Branch → PR → CI verde → Merge)
2. Verificar integridade dos dados nas tabelas afetadas
3. Monitorar logs por 1 hora após a correção
4. Re-executar `npm run security-check` e `npm run test:regression`

### Fase 4: Pós-Incidente (Post-Mortem)
**Obrigatório para severidade Alta/Crítica.**
1. O que aconteceu?
2. Por que aconteceu?
3. O que faremos para evitar que se repita?
4. Atualizar `SECURITY_CHECKLIST.md` e `ANALISE_SEGURANCA_COMPLETA.md`

---

## 📞 3. Matriz de Escalonamento

| Nível | Descrição | Quem Acionar | Tempo de Resposta |
|-------|-----------|--------------|-------------------|
| **P1 - Crítico** | Vazamento de dados, Sistema offline | Commander + Dev imediato | < 30 min |
| **P2 - Alto** | Funcionalidade core quebrada, Falha de Auth | Dev imediato | < 1 hora |
| **P3 - Médio** | Bug funcional, Lentidão | Dev (horário comercial) | < 4 horas |
| **P4 - Baixo** | Visual, Typos | Backlog | N/A |

---

## 🛠️ 4. Ferramentas e Comandos Úteis

### Investigação
```bash
# Ver log de commits recentes
git log --oneline -20

# Reverter último commit (mantém arquivos)
git revert HEAD

# Buscar por padrões suspeitos no código
grep -r "eval\|innerHTML\|dangerouslySetInnerHTML" --include="*.tsx" .

# Verificar segurança das dependências
npm audit

# Executar todos os testes de regressão
npm run test:regression
```

### Deploy de Emergência
```bash
# Reverter para versão anterior no GitHub
git revert <commit-hash>
git push  # Vercel redeploy automático na main

# Reimplantar Edge Function com versão corrigida
supabase functions deploy auth-guard
supabase functions deploy gemini-proxy
supabase functions deploy groq-proxy
supabase functions deploy validate-turnstile
```

### Rotação de Secrets
```bash
# Atualizar chaves no Supabase
supabase secrets set GEMINI_API_KEY_PRIMARY=nova-chave
supabase secrets set TURNSTILE_SECRET_KEY=nova-chave
```

### Monitoramento
- **Logs de Edge Functions**: Supabase Dashboard → Functions → Logs
- **Logs de Auth**: Supabase Dashboard → Auth → Logs
- **Logs de DB**: Supabase Dashboard → Database → Logs
- **Deploys Vercel**: Vercel Dashboard → Deployments
- **CI Pipeline**: GitHub → Actions

---

## 📝 5. Histórico de Incidentes

| Data | Severidade | Descrição | Resolução |
|------|-----------|-----------|-----------|
| 2025-12-30 | P2 | API Key Gemini exposta no frontend | Migrado para Edge Function proxy |
| 2026-02-15 | P1 | Auditoria completa — 12 vulnerabilidades | 9 corrigidas imediatamente |
| 2026-02-27 | P2 | Rate limiting ausente (risco de abuso) | `auth-guard` e `_shared/rateLimit.ts` implementados |

---

*Em caso de dúvida, peque pelo excesso de cautela. Acione o Incident Commander.*  
*Atualize este documento após cada incidente real ou simulado.*
