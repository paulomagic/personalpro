---
name: planning
description: Use quando você tiver uma especificação ou requisitos para uma tarefa de múltiplas etapas, antes de tocar no código.
---

# Escrevendo Planos (Planning)

## Visão Geral

Escreva planos de implementação abrangentes assumindo que o engenheiro tem zero contexto da nossa base de código e gosto questionável. Documente tudo o que eles precisam saber: quais arquivos tocar para cada tarefa, código, testes, documentos que possam precisar verificar, como testar. Dê a eles o plano inteiro como tarefas pequenas ("bite-sized"). DRY. YAGNI. TDD. Commits frequentes.

Assuma que eles são desenvolvedores habilidosos, mas sabem quase nada sobre nosso conjunto de ferramentas ou domínio do problema. Assuma que eles não conhecem muito bem design de testes.

**Anuncie no início:** "Estou usando a skill de planning para criar o plano de implementação."

**Contexto:** Isso deve ser executado em um worktree dedicado (criado pela skill de brainstorming, se aplicável).

**Salvar planos em:** `docs/plans/YYYY-MM-DD-<nome-da-feature>.md`

## Granularidade de Tarefas Pequenas

**Cada passo é uma ação (2-5 minutos):**
- "Escrever o teste que falha" - passo
- "Rodar para garantir que falha" - passo
- "Implementar o código mínimo para fazer o teste passar" - passo
- "Rodar os testes e garantir que passam" - passo
- "Commitar" - passo

## Cabeçalho do Documento de Plano

**Todo plano DEVE começar com este cabeçalho:**

```markdown
# [Nome da Feature] Plano de Implementação

> **Para o Agente:** SUB-SKILL REQUERIDA: Use `executing-plans` (se disponível) para implementar este plano tarefa por tarefa.

**Objetivo:** [Uma frase descrevendo o que isso constrói]

**Arquitetura:** [2-3 frases sobre a abordagem]

**Tech Stack:** [Tecnologias/bibliotecas chave]

---
```

## Estrutura da Tarefa

```markdown
### Tarefa N: [Nome do Componente]

**Arquivos:**
- Criar: `caminho/exato/para/arquivo.py`
- Modificar: `caminho/exato/para/existente.py:123-145`
- Testar: `tests/caminho/exato/para/teste.py`

**Passo 1: Escrever o teste que falha**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Passo 2: Rodar teste para verificar que falha**

Rodar: `pytest tests/path/test.py::test_name -v`
Esperado: FALHA com "function not defined"

**Passo 3: Escrever implementação mínima**

```python
def function(input):
    return expected
```

**Passo 4: Rodar teste para verificar que passa**

Rodar: `pytest tests/path/test.py::test_name -v`
Esperado: PASSOU

**Passo 5: Commitar**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: adicionar funcionalidade específica"
```
```

## Lembre-se
- Caminhos de arquivo exatos sempre
- Código completo no plano (não "adicionar validação")
- Comandos exatos com saída esperada
- Referencie skills relevantes com sintaxe @ se disponível
- DRY, YAGNI, TDD, commits frequentes

## Handoff para Execução

Após salvar o plano, ofereça escolha de execução:

**"Plano completo e salvo em `docs/plans/<nome-do-arquivo>.md`. Opções de execução:**

**1. Subagent-Driven (esta sessão)** - Despacho novo subagente por tarefa, reviso entre tarefas, iteração rápida

**2. Sessão Paralela (separada)** - Abrir nova sessão com executing-plans, execução em lote com checkpoints

**Qual abordagem?"**
