---
description: Corrigir tela branca e erros de cache do Vite
---

# Tela Branca / Erros de Cache

Quando aparecer tela branca com erros no console que não correspondem ao código atual:

// turbo-all

1. Parar o servidor de desenvolvimento
```bash
pkill -f "vite" || true
```

2. Limpar cache do Vite e reiniciar
```bash
rm -rf node_modules/.vite && npm run dev
```

3. No browser, fazer hard refresh: **Cmd+Shift+R** (Mac) ou **Ctrl+Shift+R** (Windows/Linux)

**Causa comum**: O Vite cacheia módulos compilados em `node_modules/.vite`. Às vezes o cache fica desatualizado e serve código antigo.
