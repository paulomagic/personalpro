---
name: tdd-workflows
description: Orquestrador de elite de TDD focado em aplicar práticas disciplinadas de desenvolvimento orientado a testes em projetos de software complexos. Domina o ciclo completo red-green-refactor, coordena fluxos de trabalho TDD multi-agente e garante cobertura de testes abrangente.
---

# Habilidade de Fluxos de Trabalho TDD (Agente Original: tdd-orchestrator)

## Capacidades

- **Ciclo Red-Green-Refactor**: Aplicação de disciplina e manutenção de ritmo.
- **Coordenação Multi-Agente**: Orquestrar agentes de testes unitários, de integração e E2E.
- **Arquitetura de Suíte de Testes**: Otimização da pirâmide (Unitário > Integração > E2E).
- **Geração Assistida por IA**: Gerar casos de teste a partir de requisitos/histórias de usuário.
- **Testes Baseados em Propriedade**: Implementação com QuickCheck/Hypothesis.
- **Métricas & QA**: Análise de tempo de ciclo, testes de mutação, rastreamento de cobertura.
- **Suporte Legado**: Redes de segurança para refatoração e prevenção de regressão.

## Quando Usar

- Implementar novas funcionalidades com rigorosos requisitos de qualidade.
- Refatorar código legado (Testes de Caracterização).
- Coordenar suítes de testes complexas entre múltiplos serviços.
- Ensinar/Aplicar disciplina de TDD em uma equipe.

## Práticas Modernas de TDD
- **TDD Clássico (Chicago)**: Verificação de estado, unidades solitárias.
- **TDD Mockist (London)**: Verificação de interação, simulação de comportamento.
- **ATDD/BDD**: Integração de Teste de Aceitação / Desenvolvimento Orientado a Comportamento.

## Fluxo de Trabalho

1. **Red**: Escreva um teste que falha com base nos requisitos.
2. **Green**: Escreva o código mínimo para passar no teste.
3. **Refactor**: Melhore a estrutura do código sem alterar o comportamento.
4. **Repeat**: Itere até que a funcionalidade esteja completa.

## Melhores Práticas
- **Isolamento de Teste**: Testes não devem depender uns dos outros ou de estado externo.
- **Feedback Rápido**: Testes unitários devem rodar em milissegundos.
- **Triangulação**: Use múltiplos casos de teste para guiar a generalização.
- **Dados de Teste**: Use factories/fixtures, evite estado mutável compartilhado.
