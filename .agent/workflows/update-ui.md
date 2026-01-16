---
description: Como atualizar UI e garantir que mudanças apareçam em produção
---

# Workflow: Atualizar Interface do Personal Pro

## ⚠️ CRÍTICO: Service Worker Cache

O Personal Pro é um PWA com Service Worker agressivo. Mudanças visuais NÃO aparecem em produção sem incrementar a versão do cache.

## Passo a Passo

### 1. Edite o código
- Faça as mudanças visuais necessárias
- Teste localmente em `localhost:5173`

### 2. **SEMPRE** Incremente a versão do Service Worker
```javascript
// public/sw.js (linhas 1-3)
const CACHE_NAME = 'personalpro-vX';        // v9 → v10
const STATIC_CACHE = 'personalpro-static-vX';
const DYNAMIC_CACHE = 'personalpro-dynamic-vX';
```

**Por quê?**
- Service Worker cacheia JS/CSS agressivamente
- Limpar cache do navegador NÃO resolve sozinho
- SW se re-registra e usa cache antigo se versão não muda
- Incrementar versão = SW deleta caches antigos automaticamente

### 3. Commit e Push
```bash
git add .
git commit -m "feat: [descrição] + incrementa SW para vX"
git push origin main
```

### 4. Aguarde deploy
- Vercel demora ~2-3 minutos
- Verifique em https://vercel.com/dashboard que deploy terminou

### 5. Recarregue em produção
- **CTRL + SHIFT + R** (hard reload)
- Ou limpe cache: `chrome://settings/clearBrowserData`

## Troubleshooting

### Mudanças não aparecem?
1. Verifique que incrementou versão do SW ✓
2. Aguarde 3-5min (CDN do Vercel propagar)
3. F12 → Application → Service Workers → Unregister
4. F12 → Application → Storage → Clear site data
5. CTRL + SHIFT + R

### Como saber qual versão está ativa?
```
F12 → Console
Procure por: [SW] Activating...
Deve mostrar a nova versão
```

## Regra de Ouro

**TODA mudança visual = Incrementar Service Worker**

Não tem exceção. Mesmo pequenas mudanças de cor, padding, fontes.
