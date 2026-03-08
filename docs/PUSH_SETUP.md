# Setup de Web Push

## Pré-requisitos

- migration `20260305_create_push_subscriptions.sql`
- edge function `send-push`
- service worker ativo

## Frontend

Defina no ambiente web:

```bash
VITE_VAPID_PUBLIC_KEY=sua-chave-publica-vapid
```

## Supabase Secrets

```bash
supabase secrets set WEB_PUSH_VAPID_PUBLIC_KEY=sua-chave-publica-vapid
supabase secrets set WEB_PUSH_VAPID_PRIVATE_KEY=sua-chave-privada-vapid
supabase secrets set WEB_PUSH_SUBJECT=mailto:seu-email@dominio.com
```

## Deploy

```bash
supabase db push
supabase functions deploy send-push
```

## Fluxo atual

1. usuário ativa push em Configurações
2. o browser cria `PushSubscription`
3. a inscrição é gravada em `public.push_subscriptions`
4. o teste de push chama `send-push`
5. a função envia payload via VAPID
6. o service worker abre a URL recebida no payload

## Observações

- respostas `404` e `410` desativam inscrições inválidas
- push depende de contexto HTTPS e permissão explícita do navegador
- o setup só deve ser considerado pronto depois de validar inscrição, teste e abertura do link pelo service worker
