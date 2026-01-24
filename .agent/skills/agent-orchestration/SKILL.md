---
name: agent-orchestration
description: Multi-agent system optimization. Projetar fluxos de trabalho onde múltiplos agentes especializados colaboram para resolver tarefas complexas.
---

# Agent Orchestration Skill

## Quando usar esta habilidade
- Quando uma tarefa é muito complexa para um único prompt/agente.
- Para simular interações (ex: Cliente vs Vendedor).
- Para criar pipelines autônomos (Pesquisador -> Escritor -> Revisor).

## Padrões de Orquestração

### 1. Sequential Handoffs (Cadeia)
- **Fluxo**: Agente A faz a tarefa, passa a saída para Agente B.
- **Uso**: Pipelines lineares (ex: Resumo de Notícias -> Tradução -> Postagem).

### 2. Supervisor / Router
- **Fluxo**: Um "Agente Chefe" analisa o pedido e decide qual sub-agente chamar.
- **Uso**: Chatbots generalistas que têm ferramentas de Code, Search e Math.

### 3. Hierarchical Teams
- **Fluxo**: Um Líder gerencia Workers. O Líder planeja, os Workers executam, o Líder revisa e agrega.
- **Uso**: Desenvolvimento de Software (PM > Dev + QA + Designer).

### 4. Joint Collaboration (Debate)
- **Fluxo**: Agentes compartilham um scratchpad e conversam entre si.
- **Uso**: Brainstorming criativo ou resolução de problemas complexos onde um critica o outro.

## Ferramentas
- **LangGraph**: Ótimo para definir grafos de estado complexos e ciclos.
- **CrewAI**: Abstração de alto nível para times de agentes.
- **Microsoft AutoGen**: Framework para conversação multi-agente.

## Dicas
- **Especialize**: Agentes pequenos e especialistas funcionam melhor que um generalista.
- **Defina "Tools"**: Dê ferramentas reais (API call, Search, Calculator) para os agentes agirem no mundo.
- **Human in the Loop**: Sempre tenha um ponto onde o humano pode aprovar ou corrigir antes de ações críticas.
