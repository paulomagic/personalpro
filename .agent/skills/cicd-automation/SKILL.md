---
name: cicd-automation
description: Configuração de pipelines CI/CD. Automatiza testes, linting, build e deploy em plataformas como GitHub Actions, GitLab CI e Jenkins.
---

# CI/CD Automation Skill

## Quando usar esta habilidade
- Para configurar integração contínua (CI) em um novo projeto.
- Para automatizar o deploy para staging/produção (CD).
- Para configurar verificações automáticas de Pull Requests (testes, lint).
- Para criar releases automáticos.

## Fluxo de Trabalho

### 1. Definição de Estágios (Stages)
1.  **Lint**: Verificação estática (ESLint, Ruff, ShellCheck).
2.  **Test**: Testes unitários e de integração.
3.  **Build**: Compilação ou criação de imagens Docker.
4.  **Deploy**: Deploy para ambiente de destino.

### 2. Escolha da Ferramenta
- **GitHub Actions**: Padrão para projetos no GitHub. Arquivos em `.github/workflows/`.
- **GitLab CI**: Arquivo `.gitlab-ci.yml`.

### 3. Exemplo Template (GitHub Actions)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      # Add deploy steps here
```

## Melhores Práticas
- **Fail Fast**: Rode os jobs mais rápidos (lint) primeiro.
- **Cache**: Use cache para dependências (npm, pip, maven) para acelerar o build.
- **Secrets**: NUNCA commite chaves. Use as variáveis de ambiente do CI.
- **Matriz de Testes**: Teste em múltiplas versões de linguagem/OS se for uma biblioteca.
- **Artifacts**: Salve relatórios de teste ou binários compilados se necessário.
