# 🔐 Análise de Segurança e Bugs - Apex Premium PT Assistant

**Data:** 2026-02-15  
**Versão:** 1.0  
**Projeto:** Apex Premium PT Assistant (Personal Trainer App)

---

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura e Stack Tecnológico](#arquitetura-e-stack-tecnológico)
3. [Arquivos Críticos para Análise](#arquivos-críticos-para-análise)
4. [Checklist de Segurança Atual](#checklist-de-segurança-atual)
5. [Áreas de Risco Identificadas](#áreas-de-risco-identificadas)
6. [Recomendações de Segurança](#recomendações-de-segurança)
7. [Bugs Conhecidos](#bugs-conhecidos)
8. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral do Projeto

O **Apex Premium PT Assistant** é uma aplicação web PWA para personal trainers gerenciarem seus alunos, treinos e agendamentos. A aplicação utiliza IA (Gemini e Groq) para geração de treinos personalizados.

### Funcionalidades Principais:
- ✅ Gestão de alunos (CRUD completo)
- ✅ Geração de treinos com IA
- ✅ Agendamento de sessões
- ✅ Controle financeiro
- ✅ Avaliações físicas com fotos
- ✅ Dashboard para alunos (Student Mode)
- ✅ Painel administrativo

### Usuários:
- **Admin**: Acesso total ao sistema
- **Coach**: Personal trainers (usuários principais)
- **Student**: Alunos (acesso limitado)

---

## 🏗️ Arquitetura e Stack Tecnológico

### Frontend:
- **Framework**: React 19.2.3 + TypeScript 5.8.2
- **Build**: Vite 6.2.0
- **Styling**: TailwindCSS 3.4.17
- **State**: React Hooks (useState, useEffect)
- **Animations**: Framer Motion 12.23.26
- **Icons**: Lucide React 0.562.0
- **Validation**: Zod 4.3.5

### Backend/Database:
- **BaaS**: Supabase (PostgreSQL + Auth + Storage)
- **Edge Functions**: Deno (TypeScript)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage (fotos de avaliações)

### APIs Externas:
- **Gemini API**: Google Generative AI (via Edge Function proxy)
- **Groq API**: LLaMA 3.3 70B / 3.1 8B (via Edge Function proxy)
- **Cloudflare Turnstile**: CAPTCHA (validação server-side)

### Segurança:
- ✅ API Keys protegidas via Edge Functions (não expostas no frontend)
- ✅ Row Level Security (RLS) no Supabase
- ✅ CAPTCHA no registro/login
- ✅ HTTPS obrigatório
- ✅ CORS configurado

---

## 📂 Arquivos Críticos para Análise

### 1. **Configuração e Variáveis de Ambiente**

#### `.env.example`
```env
# Supabase - Configure suas credenciais
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Cloudflare Turnstile CAPTCHA (obtenha em https://dash.cloudflare.com/turnstile)
VITE_TURNSTILE_SITE_KEY=sua-site-key-aqui

# ⚠️ Gemini API Key - NÃO MAIS NO FRONTEND!
# Configure via Supabase Secrets:
#   supabase secrets set GEMINI_API_KEY_PRIMARY=sua-chave-aqui
#   supabase secrets set GEMINI_API_KEY_FALLBACK=sua-chave-fallback
```

**⚠️ ATENÇÃO**: 
- As API keys do Gemini e Groq **NÃO** devem estar no `.env.local`
- Elas devem estar configuradas como **Supabase Secrets** (server-side)
- Apenas `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_TURNSTILE_SITE_KEY` devem estar no frontend

---

### 2. **Edge Functions (Supabase)**

#### **A. `gemini-proxy/index.ts`** (Proxy para Gemini API)

**Localização**: `/supabase/functions/gemini-proxy/index.ts`

**Função**: Protege a API key do Gemini, fazendo proxy das requisições do frontend.

**Código completo disponível em**: `supabase/functions/gemini-proxy/index.ts` (159 linhas)

**Pontos de Segurança**:
- ✅ CORS configurado (`Access-Control-Allow-Origin: *`)
- ✅ Validação de método (apenas POST)
- ✅ Validação de tamanho de prompt (max 50.000 chars)
- ✅ API key armazenada em `Deno.env` (Supabase Secrets)
- ✅ Logging de ações (action, latency, model)
- ⚠️ CORS permite qualquer origem (`*`) - considerar restringir em produção

**Possíveis Vulnerabilidades**:
1. **CORS aberto**: Qualquer site pode chamar a Edge Function
2. **Rate limiting**: Não há controle de taxa de requisições por IP/usuário
3. **Abuse**: Usuário malicioso pode fazer spam de requisições

---

#### **B. `groq-proxy/index.ts`** (Proxy para Groq API)

**Localização**: `/supabase/functions/groq-proxy/index.ts`

**Função**: Proxy para API do Groq (LLaMA 3.3 70B / 3.1 8B).

**Código completo disponível em**: `supabase/functions/groq-proxy/index.ts` (186 linhas)

**Pontos de Segurança**:
- ✅ CORS configurado
- ✅ Validação de método (apenas POST)
- ✅ Validação de tamanho de prompt (max 30.000 chars)
- ✅ Fallback entre modelos (70B → 8B)
- ✅ API key em `Deno.env`
- ⚠️ CORS aberto (`*`)

**Possíveis Vulnerabilidades**:
1. **CORS aberto**: Mesma vulnerabilidade do gemini-proxy
2. **Rate limiting**: Não implementado
3. **Token tracking**: Não há controle de consumo por usuário

---

#### **C. `validate-turnstile/index.ts`** (Validação CAPTCHA)

**Localização**: `/supabase/functions/validate-turnstile/index.ts`

**Função**: Valida tokens do Cloudflare Turnstile server-side.

**Código completo disponível em**: `supabase/functions/validate-turnstile/index.ts` (126 linhas)

**Pontos de Segurança**:
- ✅ Validação server-side (não pode ser burlada no frontend)
- ✅ Secret key em `Deno.env`
- ✅ IP do cliente incluído na validação (`x-forwarded-for`)
- ⚠️ Fallback permissivo: Se secret não configurado, **permite acesso** (linha 56)

**Possíveis Vulnerabilidades**:
1. **Fallback permissivo**: Em ambiente mal configurado, CAPTCHA é ignorado
2. **Recomendação**: Mudar para `success: false` se secret não estiver configurado

---

### 3. **Serviços Frontend**

#### **A. `supabaseClient.ts`** (Cliente Supabase)

**Localização**: `/services/supabaseClient.ts`

**Função**: Cliente Supabase, funções de CRUD, autenticação, storage.

**Código completo**: 1.227 linhas

**Pontos de Segurança**:
- ✅ RLS (Row Level Security) mencionado em comentários
- ✅ Filtros por `coach_id` em todas as queries
- ✅ Validação de `supabase` antes de operações
- ✅ Upload de fotos com validação de bucket
- ⚠️ Logs de erro podem expor informações sensíveis (console.error)

**Possíveis Vulnerabilidades**:
1. **Logs excessivos**: `console.error` pode expor dados sensíveis em produção
2. **RLS**: Depende de políticas no Supabase estarem corretas
3. **Validação de entrada**: Não há validação de tipos/schemas antes de insert/update

---

#### **B. `geminiService.ts`** (Serviço de IA)

**Localização**: `/services/geminiService.ts`

**Função**: Chamadas para Edge Function `gemini-proxy`, geração de treinos com IA.

**Código completo**: 856 linhas

**Pontos de Segurança**:
- ✅ API key **não** está no frontend (usa Edge Function)
- ✅ Fallback local se API falhar
- ✅ Logging de ações de IA (`logAIAction`)
- ✅ Validação de JSON retornado pela IA
- ⚠️ Prompts podem conter dados sensíveis do cliente

**Possíveis Vulnerabilidades**:
1. **Dados sensíveis em prompts**: Nome, lesões, preferências vão para a API
2. **Logging**: Logs de IA podem conter PII (Personally Identifiable Information)
3. **Validação de resposta**: IA pode retornar JSON malicioso (XSS via nomes de exercícios)

---

### 4. **Componentes de Autenticação**

#### **A. `LoginView.tsx`**

**Localização**: `/views/LoginView.tsx`

**Função**: Tela de login/registro com CAPTCHA.

**Pontos de Segurança**:
- ✅ CAPTCHA obrigatório no registro (Cloudflare Turnstile)
- ✅ Validação server-side do CAPTCHA
- ✅ Mensagens de erro genéricas (não expõem se email existe)
- ⚠️ Rate limiting: Não há proteção contra brute force

**Possíveis Vulnerabilidades**:
1. **Brute force**: Não há limite de tentativas de login
2. **Enumeração de usuários**: Mensagens de erro podem revelar se email existe
3. **CAPTCHA apenas no registro**: Login não tem CAPTCHA (vulnerável a bots)

---

### 5. **Tipos e Permissões**

#### **A. `types.ts`**

**Localização**: `/types.ts`

**Função**: Definições de tipos TypeScript, funções de autorização.

**Código completo**: 419 linhas

**Pontos de Segurança**:
- ✅ Funções de autorização: `isAdmin()`, `isStudent()`, `isCoach()`
- ✅ Emails de admin hardcoded (fallback)
- ⚠️ Autorização baseada em `user_metadata` (pode ser manipulado?)

**Possíveis Vulnerabilidades**:
1. **user_metadata**: Se Supabase permitir usuário editar seu próprio metadata, pode escalar privilégios
2. **Emails hardcoded**: Lista de admins está no código (considerar mover para DB)
3. **Validação client-side**: Autorização no frontend pode ser burlada (deve ter RLS no backend)

---

### 6. **App Principal**

#### **A. `App.tsx`**

**Localização**: `/App.tsx`

**Função**: Componente raiz, roteamento, autenticação.

**Código completo**: 489 linhas

**Pontos de Segurança**:
- ✅ Verificação de admin antes de renderizar views de admin (linha 395)
- ✅ Listener de auth state (logout automático se sessão expirar)
- ✅ Lazy loading de views (reduz bundle inicial)
- ⚠️ Modo demo permite acesso sem autenticação

**Possíveis Vulnerabilidades**:
1. **Modo demo**: Usuário pode acessar dashboard sem login (linha 227-238)
2. **Autorização client-side**: Verificação de admin é no frontend (pode ser burlada)
3. **RLS crítico**: Backend **deve** ter RLS para proteger dados

---

## ✅ Checklist de Segurança Atual

### Implementado:
- [x] API keys protegidas via Edge Functions
- [x] CAPTCHA no registro (Cloudflare Turnstile)
- [x] HTTPS obrigatório
- [x] Autenticação via Supabase Auth (JWT)
- [x] RLS mencionado (precisa validar no Supabase)
- [x] CORS configurado nas Edge Functions
- [x] Validação de tamanho de prompts
- [x] Logging de ações de IA
- [x] Service Worker para PWA

### Não Implementado:
- [ ] Rate limiting nas Edge Functions
- [ ] Rate limiting no login (proteção brute force)
- [ ] CAPTCHA no login (apenas no registro)
- [ ] Validação de schemas (Zod) antes de DB operations
- [ ] Sanitização de dados retornados pela IA
- [ ] Logs de auditoria (quem fez o quê, quando)
- [ ] Monitoramento de uso de API (custos)
- [ ] Restrição de CORS (atualmente `*`)
- [ ] Proteção contra CSRF
- [ ] Content Security Policy (CSP)

---

## 🚨 Áreas de Risco Identificadas

### 1. **CRÍTICO: CORS Aberto nas Edge Functions**

**Risco**: Qualquer site pode chamar as Edge Functions e consumir as APIs de IA.

**Impacto**: 
- Custos elevados de API (abuse)
- DDoS nas Edge Functions
- Consumo não autorizado de quota

**Solução**:
```typescript
// Em vez de:
"Access-Control-Allow-Origin": "*"

// Use:
const allowedOrigins = [
  "https://seu-dominio.com",
  "https://seu-dominio.vercel.app",
  "http://localhost:5173" // apenas em dev
];

const origin = req.headers.get("origin");
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "",
  // ...
};
```

---

### 2. **ALTO: Falta de Rate Limiting**

**Risco**: Usuário malicioso pode fazer spam de requisições.

**Impacto**:
- Custos elevados de API
- Degradação de performance
- Bloqueio de conta por quota excedida

**Solução**: Implementar rate limiting com Upstash Redis ou Supabase Edge Functions Rate Limiter.

Exemplo:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 req/min
});

const identifier = req.headers.get("x-forwarded-for") || "anonymous";
const { success } = await ratelimit.limit(identifier);

if (!success) {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded" }),
    { status: 429 }
  );
}
```

---

### 3. **ALTO: Dados Sensíveis em Prompts de IA**

**Risco**: Prompts contêm nome, lesões, preferências do cliente.

**Impacto**:
- Violação de privacidade (LGPD/GDPR)
- Dados armazenados em logs da API de IA
- Possível vazamento se logs forem comprometidos

**Solução**:
1. Anonimizar dados em prompts (usar IDs em vez de nomes)
2. Adicionar disclaimer no termo de uso
3. Implementar opt-out de IA para clientes sensíveis

---

### 4. **MÉDIO: Validação de Resposta da IA**

**Risco**: IA pode retornar JSON com XSS (ex: nome de exercício com `<script>`).

**Impacto**:
- XSS (Cross-Site Scripting)
- Injeção de código malicioso

**Solução**: Sanitizar todos os dados retornados pela IA antes de renderizar.

```typescript
import DOMPurify from 'dompurify';

const sanitizedName = DOMPurify.sanitize(exercise.name);
```

---

### 5. **MÉDIO: Logs Excessivos em Produção**

**Risco**: `console.error` pode expor dados sensíveis em produção.

**Impacto**:
- Vazamento de informações
- Logs acessíveis via DevTools

**Solução**: Usar logger condicional.

```typescript
const logger = {
  error: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    } else {
      // Enviar para serviço de logging (Sentry, LogRocket)
    }
  }
};
```

---

### 6. **MÉDIO: Autorização Client-Side**

**Risco**: Verificação de admin/coach/student é no frontend.

**Impacto**:
- Usuário pode burlar verificação via DevTools
- Acesso não autorizado a views de admin

**Solução**: 
1. **RLS no Supabase** (crítico!)
2. Verificação de role em **todas** as Edge Functions
3. Nunca confiar em dados do frontend

---

### 7. **BAIXO: Modo Demo Sem Autenticação**

**Risco**: Modo demo permite acesso sem login.

**Impacto**:
- Dados demo podem ser modificados
- Confusão entre dados reais e demo

**Solução**: 
1. Criar banco de dados separado para demo
2. Resetar dados demo periodicamente
3. Adicionar watermark "MODO DEMO" em todas as telas

---

## 🛡️ Recomendações de Segurança

### Prioridade CRÍTICA:

1. **Restringir CORS nas Edge Functions**
   - Permitir apenas domínios autorizados
   - Implementar validação de origin

2. **Implementar Rate Limiting**
   - Limitar requisições por IP/usuário
   - Proteger Edge Functions de abuse

3. **Validar RLS no Supabase**
   - Verificar políticas de todas as tabelas
   - Testar acesso não autorizado

### Prioridade ALTA:

4. **Adicionar CAPTCHA no Login**
   - Proteger contra brute force
   - Usar Turnstile também no login

5. **Sanitizar Dados da IA**
   - Validar JSON retornado
   - Remover caracteres perigosos

6. **Implementar Logging de Auditoria**
   - Registrar ações críticas (delete, update)
   - Rastrear quem fez o quê

### Prioridade MÉDIA:

7. **Validação de Schemas com Zod**
   - Validar dados antes de insert/update
   - Prevenir injeção de dados inválidos

8. **Monitoramento de Custos de API**
   - Alertas se quota exceder X%
   - Dashboard de consumo por usuário

9. **Content Security Policy (CSP)**
   - Prevenir XSS
   - Restringir scripts externos

### Prioridade BAIXA:

10. **Melhorar Modo Demo**
    - Banco separado
    - Reset automático

---

## 🐛 Bugs Conhecidos

### 1. **Turnstile Fallback Permissivo**

**Arquivo**: `supabase/functions/validate-turnstile/index.ts` (linha 56)

**Problema**: Se `TURNSTILE_SECRET_KEY` não estiver configurado, a validação **permite** acesso.

**Impacto**: Em ambiente mal configurado, CAPTCHA é ignorado.

**Solução**:
```typescript
// Linha 56 - ANTES:
return new Response(
  JSON.stringify({ success: true, warning: "Validation skipped" }),
  { status: 200 }
);

// DEPOIS:
return new Response(
  JSON.stringify({ success: false, error: "CAPTCHA not configured" }),
  { status: 500 }
);
```

---

### 2. **Logs de Erro Expõem Dados Sensíveis**

**Arquivo**: `services/supabaseClient.ts` (múltiplas linhas)

**Problema**: `console.error` loga detalhes de erro que podem conter dados sensíveis.

**Impacto**: Informações vazadas em logs do navegador.

**Solução**: Usar logger condicional (ver seção 5 de Áreas de Risco).

---

### 3. **Validação de JSON da IA Pode Falhar**

**Arquivo**: `services/geminiService.ts` (linha 268)

**Problema**: `JSON.parse(cleanText)` pode lançar exceção se IA retornar JSON inválido.

**Impacto**: App quebra, usuário vê erro.

**Solução**: Já implementado (try/catch + fallback local), mas pode melhorar validação com Zod.

---

## 📊 Próximos Passos

### Imediato (Esta Semana):
1. ✅ Revisar e restringir CORS nas Edge Functions
2. ✅ Implementar rate limiting básico
3. ✅ Validar RLS no Supabase (todas as tabelas)
4. ✅ Corrigir fallback do Turnstile

### Curto Prazo (Este Mês):
5. ✅ Adicionar CAPTCHA no login
6. ✅ Implementar sanitização de dados da IA
7. ✅ Adicionar logging de auditoria
8. ✅ Implementar validação de schemas com Zod

### Médio Prazo (Próximos 3 Meses):
9. ✅ Implementar CSP (Content Security Policy)
10. ✅ Adicionar monitoramento de custos de API
11. ✅ Melhorar modo demo (banco separado)
12. ✅ Implementar testes de segurança automatizados

---

## 📝 Notas Finais

### Pontos Fortes:
- ✅ API keys protegidas (não expostas no frontend)
- ✅ Arquitetura bem estruturada (Edge Functions)
- ✅ CAPTCHA implementado (registro)
- ✅ TypeScript (type safety)

### Pontos Fracos:
- ⚠️ CORS aberto (risco de abuse)
- ⚠️ Falta de rate limiting
- ⚠️ Autorização client-side (depende de RLS)
- ⚠️ Logs excessivos em produção

### Recomendação Geral:
O projeto tem uma **base de segurança sólida**, mas precisa de **melhorias críticas** em:
1. Rate limiting
2. CORS restrito
3. Validação de RLS

**Priorize** as recomendações de **Prioridade CRÍTICA** antes de lançar em produção.

---

## 📞 Contato

Para dúvidas ou sugestões sobre este documento:
- **Email**: digital.ai.pr@gmail.com
- **Projeto**: Apex Premium PT Assistant

---

**Última atualização**: 2026-02-15 14:23 BRT
