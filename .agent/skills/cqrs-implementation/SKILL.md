---
name: cqrs-implementation
description: Implement CQRS with separate read/write models and eventual consistency patterns.
---

# CQRS Implementation Skill

## Quando usar esta habilidade
- Quando a leitura é muito mais frequente/complexa que a escrita.
- Quando a escala de leitura exige bancos diferentes da escrita (ex: Write no Postgres, Read no ElasticSearch).
- Em conjunto com Event Sourcing.

## Command Query Responsibility Segregation

### 1. Command Side (Write Model)
- **Foco**: Comportamento, Regras de Negócio, Consistência.
- **Input**: Commands (`CreateOrder`).
- **Ação**: Valida e altera o estado (ou gera evento).
- **Retorno**: Sucesso/Falha (void ou ID). NUNCA retorna dados complexos de DTO.

### 2. Query Side (Read Model)
- **Foco**: Performance de Leitura, UI.
- **Input**: Queries (`GetOrderByUser`).
- **Ação**: Apenas lê do banco desnormalizado (View).
- **Retorno**: DTO pronto para a tela.

## Sincronização (Projections)
Como o dado vai do Command para a Query?
1.  **Síncrono**: O Command grava nas duas tabelas na mesma transação. (Mais simples, menos escalável).
2.  **Assíncrono (Eventual Consistency)**:
    - Command grava Evento -> Message Bus -> Worker (Projector) -> Atualiza Banco de Leitura.
    - O usuário pode ver dados "velhos" por alguns milissegundos.

## Exemplo de Arquitetura
- **Write DB**: Postgres (3NF, transacional).
- **Read DB**: MongoDB ou Redis (JSON pronto para API).
- **Sync**: Worker consome fila `OrderEvents` e atualiza o MongoDB.

## Checklist
- [ ] A consistência eventual é aceitável para o negócio?
- [ ] O modelo de leitura é otimizado para a query específica da tela? (Table per View).
- [ ] Existe mecanismo de "Replay" para regenerar o Read Model se ele mudar?
