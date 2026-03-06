<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1A0f6eeTWZnyXn6DKLRtGD7zRRelZRJ7C

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Fluxo de Desenvolvimento Oficial (CI/CD)

O diretório `main` possui proteção contra código quebrado. Qualquer nova implementação ou ajuste deve seguir o fluxo seguro abaixo:

**Branch -> PR -> CI verde -> Code Review -> Merge**

1. Crie uma branch a partir da `main`: `git checkout -b feature/nome-da-feature`
2. Faça os testes localmente (`npm run typecheck:all`, `npm run test:regression`) e suba os commits.
3. Abra um Pull Request para a branch `main`.
4. Aguarde a validação obrigatória do robô (**quality-gate**).
5. Aguarde a revisão de segurança e código (aprovada pelos Code Owners).
6. Faça o Merge.

## Auth Guard (Login/Registro sem CAPTCHA)

O projeto usa uma Edge Function `auth-guard` para limitar tentativas de login/registro no servidor.

### Secrets necessários (Supabase)

- `ALLOWED_ORIGINS=https://personalpro-omega.vercel.app`
- `SUPABASE_SERVICE_ROLE_KEY=<service_role_key>`
- `AUTH_RATE_LIMIT_MAX=8`
- `AUTH_RATE_LIMIT_WINDOW_MS=60000`
- `RATE_LIMIT_RETENTION_SECONDS=86400`

### Deploy

1. Aplicar migrations:
   `supabase db push`
2. Deploy da função:
   `supabase functions deploy auth-guard`

## E2E Smoke (Playwright)

Fluxos cobertos:
- Login em modo demonstração
- Abertura de aluno no dashboard e início de treino rápido
- Feedback de erro para token de convite inválido
- Fallback offline com Service Worker em build de produção

Execução local:

1. Rode os testes:
   `npm run test:e2e`

O script instala o Chromium automaticamente antes da suíte.

## Navegação e Histórico (Back Button)

O app agora sincroniza `View` interna com URL e histórico do navegador:

- Back/forward do navegador/celular funciona entre telas principais
- URLs são atualizadas com `pushState/replaceState` sem React Router
- Telas com contexto carregam query params:
  - `/clients/profile?client=<id>`
  - `/training/execution?workout=<id>`

Arquivos-chave:
- `services/navigation/historyNavigation.ts`
- `App.tsx`

## Performance de Boot

A carga de fontes foi simplificada para reduzir requisições externas:

- Mantidas apenas `Inter` + `Lexend`
- Removida família `Outfit` do `index.html`
- `font-display` do Tailwind alinhada para `Lexend`

## PWA / Offline

- Navegações offline agora usam `public/offline.html`
- Há banner de conectividade no app quando `navigator.onLine === false`
- Fluxo documentado em `docs/PWA_OFFLINE.md`
