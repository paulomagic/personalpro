---
name: framework-migration
description: Planejamento de upgrades de frameworks legados. Estratégias para migrar de AngularJS para React, Python 2 para 3, Java 8 para 17, etc.
---

# Framework Migration Skill

## Quando usar esta habilidade
- Para modernizar uma base de código legada (Legacy Modernization).
- Para sair de um framework EOL (End of Life).
- Para migrar de Monolito para Microsserviços (ou volta).

## Estratégias de Migração

### 1. Strangler Fig Pattern (A Figueira Estranguladora)
- **Como funciona**: Crie a nova aplicação ao lado da antiga. Redirecione rotas específicas para a nova à medida que são refeitas. Eventualmente, a antiga morre.
- **Ideal para**: Backend, Monolitos Web.
- **Requer**: Um Load Balancer ou API Gateway na frente.

### 2. Micro-Frontends (Para Web)
- **Como funciona**: A página principal carrega componentes de diferentes frameworks (ex: Header em React, Sidebar em Angularjs).
- **Pro**: Permite times independentes.
- **Contra**: Complexidade de build e performance.

### 3. Big Bang (Reescrita Total)
- **Como funciona**: Congela o desenvolvimento, reescreve tudo do zero, lança de uma vez.
- **Risco**: **EXTREMO**. Geralmente falha. Evite se possível.
- **Quando usar**: Se o sistema for muito pequeno ou o código antigo for irrecuperável.

### 4. Parallel Run
- **Como funciona**: O sistema antigo e o novo rodam juntos processando os mesmos dados. Compara-se a saída (Shadowing).
- **Ideal para**: Sistemas financeiros, cálculos críticos.

## Checklist de Planejamento de Migração
- [ ] Mapear todas as funcionalidades do sistema atual.
- [ ] Congelar novas features "nice to have" no sistema legado.
- [ ] Criar testes de integração (End-to-End) no sistema atual para garantir paridade.
- [ ] Decidir a estratégia (provavelmente Strangler Fig).
- [ ] Migrar a primeira rota simples (Proof of Concept).
