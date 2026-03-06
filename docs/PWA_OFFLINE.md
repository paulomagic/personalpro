# PWA / Offline

## Estado atual

O app possui Service Worker versionado, cache de assets, fallback de navegacao offline, filas persistentes via IndexedDB/localStorage e sincronizacao por `Background Sync`.

## Comportamento esperado

- O Service Worker faz cache de assets estaticos e da pagina offline.
- Navegacoes offline retornam a shell offline quando a rota nao estiver no cache.
- Filas de feedback e feedback de IA permanecem persistidas localmente e tentam sincronizar quando a conexao volta.
- APIs do Supabase, autenticacao, geracao de treino por IA e push remoto continuam exigindo conectividade.

## Como validar localmente

1. Rode `npm run build`.
2. Rode `npm run test:e2e`.
3. Abra o app online uma vez para registrar o Service Worker.
4. Fique offline e recarregue uma rota nao cacheada.
5. A tela offline deve aparecer com CTA para tentar novamente.
