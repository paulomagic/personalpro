# 🔐 Security Checklist — Apex Premium PT Assistant

**Última Atualização:** 2026-02-27  
**Responsável:** Paulo Ricardo  
**Projeto:** Apex Premium PT Assistant (PersonalPro)

---

## ✅ Checklist para Novas Features

### 1. Validação de Entrada
- [ ] Todos os campos de texto são validados antes de usar
- [ ] Campos numéricos têm validação de range (min/max)
- [ ] Emails são validados com regex
- [ ] URLs externas são validadas contra lista de domínios permitidos
- [ ] Uploads de arquivo verificam tipo MIME e tamanho

### 2. Autenticação e Autorização
- [ ] View requer autenticação (`user?.id` verificado)
- [ ] RLS policies aplicadas para novas tabelas
- [ ] `coach_id` é usado para filtrar dados
- [ ] Tokens/sessões são verificados antes de operações sensíveis

### 3. Proteção de Dados
- [ ] Dados sensíveis NÃO são logados no console
- [ ] API keys estão em variáveis de ambiente (`.env.local` ou Supabase Secrets)
- [ ] Senhas nunca são armazenadas localmente
- [ ] Dados do usuário são sanitizados antes de exibição

### 4. Comunicação Segura
- [ ] Todas as requisições usam HTTPS
- [ ] URLs de redirecionamento são validadas
- [ ] `window.open()` usa URLs confiáveis

### 5. Database (Supabase)
- [ ] Nova tabela tem `ENABLE ROW LEVEL SECURITY`
- [ ] Policies criadas para SELECT, INSERT, UPDATE, DELETE
- [ ] `coach_id` referencia `auth.users(id)`
- [ ] Dados não são expostos sem filtro de `coach_id`

---

## 🛡️ Status de Segurança (2026-02-27)

### ✅ Implementado e Funcional

| Item | Status | Implementação |
|------|--------|---------------|
| API Keys protegidas via Edge Functions | ✅ | `gemini-proxy`, `groq-proxy` |
| CAPTCHA no registro (Cloudflare Turnstile) | ✅ | `validate-turnstile` + `LoginView.tsx` |
| CAPTCHA Fail-Closed | ✅ | Retorna 503 se secret ausente |
| HTTPS obrigatório | ✅ | Vercel + Supabase |
| Autenticação via Supabase Auth (JWT) | ✅ | `supabaseCore.ts` |
| Row Level Security (RLS) | ✅ | Todas as tabelas críticas |
| CORS com lista de origens permitidas | ✅ | `supabase/functions/_shared/` |
| Rate Limiting nas Edge Functions | ✅ | `_shared/rateLimit.ts` — DB + fallback em memória |
| Rate Limiting no Login/Registro (Server-side) | ✅ | `auth-guard/index.ts` + `services/auth/authGuard.ts` |
| Proteção local contra Brute Force (Client-side) | ✅ | `services/auth/lockoutStorage.ts` |
| Token de convite criptográfico (CSPRNG) | ✅ | `crypto.getRandomValues` (32 bytes / 256 bits) |
| Fluxo de convite atômico (race condition) | ✅ | RPC `accept_invitation` no Supabase |
| Escalada de privilégio bloqueada | ✅ | `handle_new_user()` força `role='coach'` |
| Limpeza automática de rate limit (DB) | ✅ | `cleanup_edge_rate_limits` RPC (a cada 500 req) |
| SHA-256 hash anônimo de identidade no auth-guard | ✅ | `sha256Hex(action + email + ip)` |
| Validação de IP de origem no CAPTCHA | ✅ | `x-forwarded-for` incluído na validação Turnstile |
| CI com verificação de segurança automatizada | ✅ | `.github/workflows/ci.yml` — `npm run security-check` |

### 🟡 Parcialmente Implementado

| Item | Status | Observação |
|------|--------|------------|
| Sanitização de dados retornados pela IA | 🟡 | `escapeHtml()` no AIBuilderView. Falta DOMPurify global |
| Logs condicionais em produção | 🟡 | `console.error` ainda presente em alguns serviços |
| Validação de schemas com Zod | 🟡 | Zod instalado mas não aplicado a todas as operações de DB |

### ❌ Pendente

| Item | Prioridade | Observação |
|------|------------|------------|
| Dados Sensíveis em Prompts de IA (anonimização) | 🟠 MÉDIA | Nome, lesões e preferências do aluno vão para a API |
| Content Security Policy (CSP) | 🟡 BAIXA | Não configurado no `vercel.json` ou `index.html` |
| Monitoramento de custos de API | 🟡 BAIXA | Sem alertas automáticos de quota |
| Modo Demo com banco isolado | 🟡 BAIXA | Demo usa banco real (dados de demonstração) |

---

## 🤖 Proteção das APIs de IA

Todas as chamadas para Gemini e Groq são feitas via **Edge Functions** no Supabase, protegendo as chaves do frontend.

### Edge Functions Ativas:

| Função | Endpoint | Rate Limit | CORS |
|--------|----------|------------|------|
| `gemini-proxy` | `/functions/v1/gemini-proxy` | ✅ Ativo | ✅ Restrito |
| `groq-proxy` | `/functions/v1/groq-proxy` | ✅ Ativo | ✅ Restrito |
| `validate-turnstile` | `/functions/v1/validate-turnstile` | ✅ Ativo | ✅ Restrito |
| `auth-guard` | `/functions/v1/auth-guard` | ✅ Ativo | ✅ Restrito |

### Deploy:
```bash
supabase functions deploy gemini-proxy
supabase functions deploy groq-proxy
supabase functions deploy validate-turnstile
supabase functions deploy auth-guard
```

### Secrets no Supabase:
```bash
supabase secrets set GEMINI_API_KEY_PRIMARY=sua-chave
supabase secrets set GEMINI_API_KEY_FALLBACK=sua-chave-fallback
supabase secrets set GROQ_API_KEY=sua-chave
supabase secrets set TURNSTILE_SECRET_KEY=sua-chave
```

---

## 📝 Histórico de Auditorias

| Data | Auditor | Vulnerabilidades | Resultado |
|------|---------|------------------|-----------|
| 2024-12-28 | Paulo Ricardo | 0 | ✅ Nenhuma ação necessária |
| 2025-12-30 | Paulo Ricardo | 1 (API Key exposta) | ✅ Migrado para Edge Function |
| 2026-02-15 | Paulo Ricardo | 12 identificadas | ✅ 9 corrigidas, 3 pendentes |
| 2026-02-27 | Paulo Ricardo | Rate limit e auth-guard | ✅ Server-side rate limit implementado |

---

## 🔄 Rotina de Segurança Recomendada

| Frequência | Ação |
|------------|------|
| A cada commit | CI executa `npm run security-check` automaticamente |
| Semanal | `npm audit` manual |
| Mensal | `npm update` + revisão de dependências |
| Por feature | Verificar checklist deste arquivo antes do PR |
| Por release | Code review de segurança + atualizar este documento |

---

## 🚀 Comandos Úteis

```bash
# Verificação completa de segurança (Audit + Env Var + Files)
npm run security-check

# Verificar vulnerabilidades em dependências
npm audit

# Corrigir vulnerabilidades automaticamente
npm audit fix

# Ver detalhes em JSON
npm audit --json

# Executar todos os testes (inclui testes de segurança unitários)
npm run test:regression
```

---

*Este arquivo é atualizado automaticamente pelo workflow `.github/workflows/docs-update.yml` quando há mudanças no código.*
