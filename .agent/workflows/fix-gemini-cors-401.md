---
description: Como resolver erros 401/CORS na Edge Function do Gemini
---

# Problema: Erro 401 (Unauthorized) ou CORS ao chamar a Edge Function `gemini-proxy`

## Sintomas
- Console mostra: `401 (Unauthorized)` ao chamar `/functions/v1/gemini-proxy`
- Console mostra: `blocked by CORS policy: Request header field apikey is not allowed`
- Treinos não são gerados pela IA, apenas o fallback local funciona

## Causa Raiz
O Supabase Edge Function tem duas camadas de segurança que podem conflitar:

1. **JWT Verification (Gateway)**: Por padrão, o Supabase exige um token JWT válido para acessar Edge Functions. O problema é que requisições de "preflight" (OPTIONS) do navegador não enviam tokens, causando bloqueio.

2. **CORS Headers (Código)**: O navegador envia headers como `apikey` e `x-client-info` que precisam ser explicitamente permitidos no código da função.

## Solução

### Passo 1: Verificar os CORS Headers no código
Abra `supabase/functions/gemini-proxy/index.ts` e confirme que os headers permitidos incluem `apikey`:

```typescript
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};
```

### Passo 2: Deploy com `--no-verify-jwt`
// turbo
```bash
supabase functions deploy gemini-proxy --no-verify-jwt
```

O flag `--no-verify-jwt` desliga a verificação automática do gateway, deixando seu código gerenciar a autenticação.

### Passo 3: Limpar cache do navegador
Se o erro persistir após o deploy, pode ser cache. Opções:
1. Hard refresh: `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)
2. Abrir DevTools > Application > Storage > Clear site data
3. Incrementar a versão do cache no `public/sw.js`:
   ```javascript
   const CACHE_NAME = 'personalpro-v6'; // Incrementar número
   ```

## Verificando se Funcionou
No console do navegador, você deve ver:
- `✅ Gemini succeeded via gemini-2.5-flash`
- Ou na UI: "Treino gerado por Gemini 2.5 Flash"

## Comandos Úteis

// turbo
```bash
# Ver secrets configurados
supabase secrets list
```

// turbo
```bash
# Ver logs da função em tempo real
supabase functions logs gemini-proxy --tail
```

// turbo
```bash
# Testar função diretamente
curl -X POST "https://yuohwenofctcxdgqgtoo.supabase.co/functions/v1/gemini-proxy" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Diga OK", "action": "test"}'
```

## Checklist Rápido
- [ ] Headers CORS incluem `apikey` e `x-client-info`?
- [ ] Deploy foi feito com `--no-verify-jwt`?
- [ ] Cache do navegador foi limpo?
- [ ] Secrets `GEMINI_API_KEY_PRIMARY` e `GEMINI_API_KEY_FALLBACK` estão configurados?
