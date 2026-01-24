---
name: git-pr-workflows
description: Padroniza fluxos de trabalho Git, cria descrições de Pull Request ricas e automatiza tarefas de versionamento. Use para criar PRs, commits padronizados e gerenciar branches.
---

# Git & PR Workflows Skill

## Quando usar esta habilidade
- Para criar Pull Requests (PRs) com descrições detalhadas.
- Para escrever mensagens de commit seguindo Conventional Commits.
- Para definir estratégias de branch (Git Flow, Trunk Based).
- Para revisar PRs antes de submeter.

## Fluxo de Trabalho

### 1. Preparação (Branching)
- Use nomes de branch descritivos:
    - `feat/nome-da-feature`
    - `fix/nome-do-bug`
    - `docs/atualizacao-docs`
    - `chore/tarefa-manutencao`
    - `refactor/melhoria-codigo`

### 2. Commits (Conventional Commits)
- Formato: `<tipo>(<escopo>): <descrição>`
- Tipos comuns: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`.
- Exemplo: `feat(auth): adiciona login social com google`

### 3. Criação de Pull Requests
- **Título**: Claro e conciso, seguindo o padrão de commit.
- **Descrição**:
    - **O que foi feito?**: Resumo das mudanças.
    - **Por que foi feito?**: Contexto e motivação.
    - **Como testar?**: Passos para validar as mudanças.
    - **Screenshots/GIFs**: Para mudanças visuais.
    - **Checklist**: Testes, linting, docs.

## Template de Pull Request

```markdown
## Descrição
[Resumo das mudanças]

## Tipo de Mudança
- [ ] Nova funcionalidade
- [ ] Correção de bug
- [ ] Documentação
- [ ] Refatoração

## Como Testar
1. Passo 1
2. Passo 2

## Screenshots (se aplicável)
[Imagens]

## Checklist
- [ ] Testes passaram
- [ ] Linter passou
- [ ] Documentação atualizada
```

## Comandos Úteis
- `git status` - Ver estado atual.
- `git diff --staged` - Revisar mudanças antes do commit.
- `git log --oneline --graph` - Visualizar histórico.
- `git push -u origin HEAD` - Enviar branch atual.
