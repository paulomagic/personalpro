# 🔐 Security Checklist - Apex Premium PT Assistant

Este arquivo contém o checklist de segurança para desenvolvimento de novas features.  
**Execute `npm audit` regularmente** para verificar vulnerabilidades em dependências.

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
- [ ] coach_id é usado para filtrar dados
- [ ] Tokens/sessões são verificados antes de operações sensíveis

### 3. Proteção de Dados
- [ ] Dados sensíveis NÃO são logados no console
- [ ] API keys estão em variáveis de ambiente (.env.local)
- [ ] Senhas nunca são armazenadas localmente
- [ ] Dados do usuário são sanitizados antes de exibição

### 4. Comunicação Segura
- [ ] Todas as requisições usam HTTPS
- [ ] URLs de redirecionamento são validadas
- [ ] window.open() usa URLs confiáveis

### 5. Database (Supabase)
- [ ] Nova tabela tem `ENABLE ROW LEVEL SECURITY`
- [ ] Policies criadas para SELECT, INSERT, UPDATE, DELETE
- [ ] coach_id referencia auth.users(id)
- [ ] Dados não são expostos sem filtro de coach_id

---

## 📋 Comandos de Segurança

```bash
# Verificar vulnerabilidades em dependências
npm audit

# Corrigir vulnerabilidades automaticamente (quando possível)
npm audit fix

# Ver detalhes de vulnerabilidades
npm audit --json

# Atualizar dependências
npm update
```

---

## 🔄 Rotina de Segurança Recomendada

| Frequência | Ação |
|------------|------|
| Semanal | `npm audit` |
| Mensal | `npm update` |
| Por feature | Verificar checklist acima |
| Por release | Code review de segurança |

---

## 🛡️ CAPTCHA Integration Guide

### Opções Recomendadas:

#### 1. **Cloudflare Turnstile** (Recomendado)
- ✅ Gratuito
- ✅ Privacy-friendly
- ✅ Fácil integração

```bash
npm install @marsidev/react-turnstile
```

```tsx
import { Turnstile } from '@marsidev/react-turnstile';

<Turnstile 
  siteKey="YOUR_SITE_KEY" 
  onSuccess={(token) => setCaptchaToken(token)}
/>
```

#### 2. **hCaptcha**
- ✅ Gratuito até 1M requests/mês
- ✅ Privacy-focused

```bash
npm install @hcaptcha/react-hcaptcha
```

#### 3. **Google reCAPTCHA v3**
- ⚠️ Requer criação de projeto no Google Cloud
- ✅ Score-based (invisible)

### Onde Implementar CAPTCHA:
1. Formulário de registro
2. Formulário de contato/suporte
3. Reset de senha

### Implementação Sugerida:
```tsx
// No LoginView.tsx
const [captchaToken, setCaptchaToken] = useState<string | null>(null);

const handleRegister = async () => {
  if (!captchaToken) {
    setError('Complete a verificação de segurança');
    return;
  }
  // ... resto do registro
};
```

---

## 📊 Último npm audit

**Data:** 2024-12-28  
**Resultado:** ✅ 0 vulnerabilities found

---

## 📝 Histórico de Auditorias

| Data | Vulnerabilidades | Ação |
|------|------------------|------|
| 2024-12-28 | 0 | ✅ Nenhuma ação necessária |

---

*Mantenha este arquivo atualizado ao adicionar novas features.*
