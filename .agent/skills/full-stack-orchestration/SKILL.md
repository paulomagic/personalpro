---
name: full-stack-orchestration
description: Orquestração end-to-end de features. Coordena mudanças através do frontend, backend e banco de dados para entregar uma funcionalidade completa de forma coesa.
---

# Full-Stack Orchestration Skill

## Quando usar esta habilidade
- Para implementar uma "Vertical Slice" (fatia vertical) de funcionalidade.
- Quando uma tarefa envolve mudanças no DB, API e UI simultaneamente.
- Para garantir que o contrato entre Frontend e Backend seja respeitado durante a implementação.
- Para planejar a ordem de execução de uma feature complexa.

## Fluxo de Trabalho Integrado

### 1. Planejamento (Contrato de Interface)
- Defina o JSON de resposta da API *antes* de codificar.
- O Frontend e Backend devem concordar com os tipos (TypeScript Interfaces/Zod Schemas).

### 2. Ordem de Execução (Bottom-Up)
1.  **Database**: Crie migration e modele a entidade.
2.  **Backend Core**: Implemente Use Case / Service e Testes Unitários.
3.  **API Layer**: Exponha o endpoint e teste com Insomnia/Postman/Curl.
4.  **Frontend State**: Crie as queries/mutations (React Query/SWR) e tipagem.
5.  **Frontend UI**: Crie o componente visual e conecte ao estado.

### 3. Técnicas de Coordenação
- **Feature Flags**: Se a feature for grande, use flags para "esconder" o frontend enquanto o backend não está pronto em prod.
- **Mocking**: O Frontend pode começar usando mocks (MSW) baseados no contrato enquanto o Backend é construído.

## Checklist de Entrega
- [ ] A migration rodou com sucesso?
- [ ] O endpoint retorna os dados no formato esperado pelo Frontend?
- [ ] O Frontend trata estados de `loading` e `error` da API?
- [ ] O Frontend valida os inputs antes de enviar para o Backend?
- [ ] Teste de ponta a ponta (manual ou automático) realizado?
