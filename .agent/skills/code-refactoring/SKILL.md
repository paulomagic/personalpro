---
name: code-refactoring
description: Limpeza de código e gestão de dívida técnica. Identifica code smells, aplica princípios SOLID e melhora a legibilidade e manutenibilidade sem alterar o comportamento externo.
---

# Code Refactoring Skill

## Quando usar esta habilidade
- Quando o código estiver difícil de ler ou entender.
- Quando houver duplicação de código.
- Para aplicar princípios SOLID e Clean Code.
- Antes de adicionar novas funcionalidades grandes em código legado.
- Para reduzir complexidade ciclomática.

## Fluxo de Trabalho

### 1. Preparação
- **Garanta que há testes!** Nunca refatore sem uma rede de segurança.
- Se não houver testes, crie "Characterization Tests" (testes de snapshot) para garantir que o comportamento atual seja preservado.

### 2. Identificação de "Code Smells"
- **Métodos Longos**: Funções com mais de 20-30 linhas.
- **Classes Grandes**: "God Classes" que fazem de tudo.
- **Duplicação**: O mesmo código em vários lugares (DRY).
- **Parâmetros Excessivos**: Funções com muitos argumentos.
- **Nomes Ruins**: Variáveis `x`, `temp`, `data` sem contexto.

### 3. Técnicas de Refatoração
- **Extract Method**: Mover bloco de código para uma nova função com nome descritivo.
- **Rename Variable/Method**: Dar nomes que revelem a intenção.
- **Extract Class**: Mover responsabilidades para uma nova classe.
- **Inline Method/Variable**: Oposto de extract, para simplificar indireções desnecessárias.
- **Replace Conditional with Polymorphism**: Usar subclasses/interfaces em vez de `if/else` ou `switch`.

### 4. Ciclo de Refatoração (Red-Green-Refactor)
1. Rode os testes (Green).
2. Faça uma refatoração pequena.
3. Rode os testes novamente (Green).
4. Commite.
5. Repita.

## Princípios Guia
- **SOLID**:
    - Single Responsibility
    - Open/Closed
    - Liskov Substitution
    - Interface Segregation
    - Dependency Inversion
- **Boy Scout Rule**: Deixe o código mais limpo do que você o encontrou.
- **YAGNI** (You Aren't Gonna Need It): Não refatore para generalidades especulativas.
