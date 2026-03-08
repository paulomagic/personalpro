# PWA / Offline

## Estado atual

O app possui PWA funcional com:

- service worker versionado em `public/sw.js`
- shell offline em `public/offline.html`
- banner de conectividade no app
- filas persistentes para alguns fluxos assíncronos
- smoke E2E cobrindo fallback offline

## O que funciona offline

- exibição da shell offline
- recuperação de navegação com CTA para tentar novamente
- persistência local de algumas filas específicas
- percepção clara de conectividade via banner

## O que não funciona offline

- autenticação Supabase
- leitura/gravação remota de banco
- geração de treino por IA
- operações administrativas server-side
- push remoto

## Comportamento esperado

- primeira visita online registra o service worker
- uma navegação offline para rota não cacheada retorna `offline.html`
- o usuário recebe contexto visual de que está sem conexão
- ao reconectar, o app pode ser recarregado e voltar ao fluxo normal

## Validação local

1. Rode:

```bash
npm run build
npm run test:e2e
```

2. Abra o app online uma vez.
3. Confirme registro do service worker.
4. Fique offline.
5. Navegue para uma rota como `/calendar`.
6. A shell offline deve aparecer com CTA de recuperação.

## Referências

- `public/sw.js`
- `public/offline.html`
- `components/ConnectivityBanner.tsx`
- `services/offline/queueStorage.ts`
- `e2e/smoke.spec.ts`
