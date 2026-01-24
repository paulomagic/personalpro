---
name: deployment-validation
description: Pre-deployment checks and validation. Checks automatizados pré-deploy (Smoke tests, Health checks, Database validation).
---

# Deployment Validation Skill

## Quando usar esta habilidade
- No passo final do pipeline de CI, antes de trocar o tráfego (Switch).
- Para "Smoke Tests" (Testes de fumaça) em produção.
- Para verificar se a infraestrutura (BD, Redis) está acessível.

## Tipos de Validação

### 1. Pre-Flight Checks
Validam se o artefato (Docker Image/Binário) está íntegro.
- Checksums conferem?
- Variáveis de ambiente obrigatórias estão definidas?
- Configurações sintaticamente corretas (Nginx config test)?

### 2. Database Migrations Check
Verifica se o banco está compatível com o código.
- Todas as migrations "Up" rodaram?
- Existem migrations pendentes?

### 3. Smoke Tests (Pós-Deploy, Pré-Tráfego)
Testes leves e rápidos rodando contra a nova instância *antes* dela receber usuários reais.
- O endpoint `/healthz` retorna 200 OK?
- O login (com usuário de teste) funciona?
- Uma leitura crítica (ex: carregar Home) funciona?

### 4. Canary Analysis (Avançado)
Comparar métricas da versão nova (canary) com a velha (baseline).
- Taxa de erro aumentou?
- Latência aumentou?
- Se sim -> Rollback automático.

## Exemplo de Script de Smoke Test (Shell/Curl)
```bash
#!/bin/bash
URL="https://staging.myapp.com"

# 1. Health Check
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" $URL/health)
if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Health Check Failed!"
  exit 1
fi

# 2. Login Check (Simplificado)
TOKEN=$(curl -s -X POST $URL/api/login -d '{"user":"test","pass":"123"}' | jq -r .token)
if [ "$TOKEN" == "null" ]; then
  echo "❌ Login Failed!"
  exit 1
fi

echo "✅ All Smoke Tests Passed!"
exit 0
```
