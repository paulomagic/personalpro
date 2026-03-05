# Setup de Web Push

## Frontend
Defina no ambiente web:

```bash
VITE_VAPID_PUBLIC_KEY=sua-chave-publica-vapid
```

## Supabase Secrets
Defina os segredos para a edge function:

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

## Fluxo
1. usuário ativa push em Configurações
2. browser cria `PushSubscription`
3. app grava em `public.push_subscriptions`
4. botão "Enviar Push de Teste" chama `send-push`
5. edge function envia payload ao navegador via VAPID

## Observações
- a função envia para o usuário autenticado que acionou o teste
- inscrições `404/410` são desativadas automaticamente
- o service worker abre a URL recebida no payload
