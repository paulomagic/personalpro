# 🔐 Análise de Segurança — Apex Premium PT Assistant

**Data da Última Atualização:** 2026-02-27  
**Versão:** 2.0  
**Projeto:** Apex Premium PT Assistant (PersonalPro)  
**Repositório:** github.com/paulomagic/personalpro

---

## 📋 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura e Stack Tecnológico](#2-arquitetura-e-stack-tecnológico)
3. [Arquitetura de Segurança Atual](#3-arquitetura-de-segurança-atual)
4. [Serviços e Módulos de Segurança](#4-serviços-e-módulos-de-segurança)
5. [Edge Functions](#5-edge-functions)
6. [Status Consolidado de Vulnerabilidades](#6-status-consolidado-de-vulnerabilidades)
7. [Vulnerabilidades Pendentes](#7-vulnerabilidades-pendentes)
8. [Histórico de Mudanças de Segurança](#8-histórico-de-mudanças-de-segurança)

---

## 1. Visão Geral do Projeto

O **Apex Premium PT Assistant** é uma aplicação web PWA para personal trainers gerenciarem alunos, treinos e agendamentos. Utiliza IA (Gemini e Groq) para geração de treinos personalizados.

### Funcionalidades:
- ✅ Gestão de alunos (CRUD completo)
- ✅ Geração de treinos com IA
- ✅ Sistema de convites para alunos
- ✅ Agendamento de sessões com reagendamento
- ✅ Controle financeiro
- ✅ Avaliações físicas com fotos
- ✅ Dashboard para alunos (Student Mode)
- ✅ Painel administrativo

### Perfis de Usuários:
- **Admin**: Acesso total, gerencia coaches e configurações globais
- **Coach**: Personal trainers — usuários principais
- **Student**: Alunos — acesso restrito ao próprio perfil e treinos

---

## 2. Arquitetura e Stack Tecnológico

### Frontend:
- **Framework**: React 19.2.3 + TypeScript 5.8.2
- **Build**: Vite 6.2.0 com Code Splitting manual (vendor chunks)
- **Styling**: TailwindCSS 3.4.17
- **Animations**: Framer Motion 12.23.26
- **Icons**: Lucide React 0.562.0
- **Validation**: Zod 4.3.5

### Backend/Database:
- **BaaS**: Supabase (PostgreSQL + Auth + Storage)
- **Edge Functions**: Deno (TypeScript) — 4 funções ativas
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage (fotos de avaliações)

### APIs Externas:
- **Gemini API**: Google Generative AI (via Edge Function proxy — chave não exposta)
- **Groq API**: LLaMA 3.3 70B / 3.1 8B (via Edge Function proxy — chave não exposta)
- **Cloudflare Turnstile**: CAPTCHA com validação server-side

### CI/CD:
- **GitHub Actions**: Pipeline com typecheck, testes de regressão, security-check e build
- **Vercel**: Deploy automático na `main`
- **Supabase CLI**: Deploy manual das Edge Functions

---

## 3. Arquitetura de Segurança Atual

### Camadas de Proteção (Defense in Depth):

```
[Usuário]
    ↓
[Cloudflare Turnstile — CAPTCHA no Registro]
    ↓
[auth-guard Edge Function — Rate Limit Server-side por IP + Email + Ação]
    ↓  (hash SHA-256 anônimo: action:email:ip)
[lockoutStorage — Bloqueio Client-side local por tentativas]
    ↓
[Supabase Auth — JWT + Sessão Persistente]
    ↓
[Row Level Security (RLS) — Dados só acessíveis pelo dono (coach_id)]
    ↓
[handle_new_user() — Força role='coach', ignora role no payload]
```

---

## 4. Serviços e Módulos de Segurança

### `services/auth/authGuard.ts`
Conector frontend → Edge Function `auth-guard`.

- Envia `{ action, email }` com timeout de 6 segundos
- Interpret os códigos HTTP (`200`, `429`, `503`) como `AuthGuardResult`
- Fail-safe: em caso de timeout ou erro de rede, bloqueia por 15 segundos

### `services/auth/lockoutStorage.ts`
Proteção client-side contra brute force por tentativas locais.

- Persiste contagem de tentativas e timestamp de bloqueio no `localStorage`
- Limpeza automática de bloqueios expirados na leitura
- Totalmente testado por `tests/lockoutStorage.test.ts`

### `services/auth/authFlow.ts`
Funções de autorização, cálculo de duração de lockout e resolução de roles.

### `services/supabaseCore.ts` *(novo — refatorado em 2026-02-27)*
Instância principal do cliente Supabase. Extraído do `supabaseClient.ts` para isolamento.

### `services/invitations/invitationAuthService.ts` *(novo — refatorado em 2026-02-27)*
Funções de autenticação via token de convite, separadas do cliente geral.

### `services/invitations/invitationUtils.ts`
Normalização e validação dos resultados de convites.

---

## 5. Edge Functions

### Visão Geral

| Função | Arquivo | Propósito | Rate Limit | CORS |
|--------|---------|-----------|------------|------|
| `auth-guard` | `supabase/functions/auth-guard/index.ts` | Rate limit de login/registro | ✅ DB + memória | ✅ Restrito |
| `gemini-proxy` | `supabase/functions/gemini-proxy/index.ts` | Proxy IA Gemini | ✅ Via `_shared/rateLimit.ts` | ✅ Restrito |
| `groq-proxy` | `supabase/functions/groq-proxy/index.ts` | Proxy IA Groq | ✅ Via `_shared/rateLimit.ts` | ✅ Restrito |
| `validate-turnstile` | `supabase/functions/validate-turnstile/index.ts` | Validação CAPTCHA | ✅ Via `_shared/rateLimit.ts` | ✅ Restrito |

### `_shared/rateLimit.ts`
Módulo compartilhado de rate limiting entre todas as Edge Functions.

- **Primário**: Verifica via RPC `check_rate_limit` no Supabase (persistente entre instâncias)
- **Fallback**: In-memory map por `rateKey` (isolado por instância Deno)
- **Auto-cleanup**: A cada 500 requisições, chama `cleanup_edge_rate_limits` no banco
- **Configurável via env**: `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_RETENTION_SECONDS`

### `auth-guard/index.ts`
Rate limiting específico para autenticação com maior rigor.

- Hash anônimo por: `SHA-256(action:email:ip)` — nenhum PII salvo no banco
- Limites independentes: `AUTH_RATE_LIMIT_MAX` (padrão: 8) e `AUTH_RATE_LIMIT_WINDOW_MS` (padrão: 60s)
- Respostas: `HTTP 200` (allowed), `HTTP 429` com `Retry-After`, `HTTP 503` (serviço indisponível)
- Headers de resposta: `X-RateLimit-Remaining`, `Retry-After`

---

## 6. Status Consolidado de Vulnerabilidades

| # | Vulnerabilidade | Risco Original | Status | Data Correção |
|---|----------------|---------------|--------|---------------|
| 1 | API Key exposta no frontend | CRÍTICO | ✅ Corrigido | 2025-12-30 |
| 2 | CORS aberto (`*`) nas Edge Functions | CRÍTICO | ✅ Corrigido | 2026-02-15 |
| 3 | Ausência de Rate Limiting | ALTO | ✅ Corrigido | 2026-02-27 |
| 4 | Brute Force no Login (sem limite) | ALTO | ✅ Corrigido | 2026-02-27 |
| 5 | CAPTCHA Fail-Open (Turnstile) | MÉDIO | ✅ Corrigido | 2026-02-15 |
| 6 | XSS em exportação HTML da IA | MÉDIO | ✅ Corrigido | 2026-02-15 |
| 7 | Escalada de privilégio via signup | ALTO | ✅ Corrigido | 2026-02-15 |
| 8 | RLS fraca em `user_profiles` | MÉDIO | ✅ Corrigido | 2026-02-15 |
| 9 | Políticas abertas em logs (`FOR ALL`) | MÉDIO | ✅ Corrigido | 2026-02-15 |
| 10 | Função de métricas sem validação admin | MÉDIO | ✅ Corrigido | 2026-02-15 |
| 11 | Credenciais hardcoded em scripts | ALTO | ✅ Corrigido | 2026-02-15 |
| 12 | Token de convite não criptográfico | MÉDIO | ✅ Corrigido | 2026-02-15 |
| 13 | Fluxo de convite não atômico (race condition) | MÉDIO | ✅ Corrigido | 2026-02-15 |
| 14 | `supabaseClient.ts` — God Object com lógica mista | ARQUITETURAL | ✅ Refatorado | 2026-02-27 |

---

## 7. Vulnerabilidades Pendentes

### 🟠 Prioridade Média

**Dados Sensíveis em Prompts de IA**
- **Risco**: Nome, lesões e preferências do aluno são enviados para as APIs de IA
- **Impacto**: Conformidade LGPD/GDPR — dados armazenados em logs das APIs externas
- **Solução sugerida**: Anonimizar com IDs em vez de nomes; adicionar opt-out no termo de uso
- **Arquivos afetados**: `services/ai/` (prompts de geração)

**Sanitização global de dados da IA**
- **Risco**: `escapeHtml()` implementado apenas em `AIBuilderView`. Outros pontos de renderização podem ser vulneráveis a XSS
- **Solução sugerida**: Instalar `dompurify` e aplicar globalmente

### 🟡 Prioridade Baixa

**Content Security Policy (CSP)**
- Não configurado em `vercel.json` ou `index.html`
- Previne XSS de scripts externos

**Monitoramento de Custos de API**
- Sem alertas automáticos quando quota excede limites
- Risco de custos elevados em caso de abuso persistente

**Modo Demo com banco isolado**
- Demo utiliza o banco real; recomenda-se banco separado ou reset periódico

---

## 8. Histórico de Mudanças de Segurança

| Data | Mudança | Arquivos Afetados |
|------|---------|-------------------|
| 2025-12-30 | Migração da API Key Gemini para Edge Function | `gemini-proxy/index.ts`, `geminiService.ts` |
| 2026-02-15 | Hardening completo: CORS, RLS, Turnstile, XSS, escalada de privilégio | Múltiplos |
| 2026-02-27 | Rate limiting server-side (auth-guard), lockoutStorage, refatoração de módulos de auth | `auth-guard/index.ts`, `_shared/rateLimit.ts`, `authGuard.ts`, `lockoutStorage.ts`, `invitationAuthService.ts`, `supabaseCore.ts` |
| 2026-02-27 | CI pipeline com security-check obrigatório | `.github/workflows/ci.yml` |
| 2026-02-27 | Branch protection na `main` (PR obrigatório + quality-gate) | GitHub Settings |

---

*Este arquivo é atualizado automaticamente pelo workflow `.github/workflows/docs-update.yml` quando há mudanças no código.*

**Próxima revisão agendada:** 2026-03-13
