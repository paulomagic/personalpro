---
name: deployment-strategies
description: Padrões de deployment e automação de rollback. Implementa estratégias de implantação seguras para minimizar downtime e mitigar riscos.
---

# Deployment Strategies Skill

## Quando usar esta habilidade
- Para planejar o lançamento de uma nova versão.
- Para configurar pipelines de Continuous Deployment (CD).
- Para minimizar o impacto de bugs em produção.
- Para realizar testes A/B ou Canary releases.

## Estratégias Principais

### 1. Rolling Deployment (Padrão Kubernetes)
- **Como funciona**: Substitui as instâncias da versão antiga pela nova gradualmente (ex: 20% de cada vez).
- **Vantagens**: Sem downtime, requer menos recursos extras.
- **Desvantagens**: Deployment e rollback podem ser lentos; duas versões coexistem temporariamente.

### 2. Blue-Green Deployment
- **Como funciona**:
    - **Blue**: Ambiente atual (Vivo).
    - **Green**: Novo ambiente com a nova versão (Cópia exata).
    - **Switch**: O tráfego é trocado instantaneamente do Blue para o Green (via Load Balancer) após testes.
- **Vantagens**: Rollback instantâneo (basta destrocar), teste real em ambiente de prod (antes do switch).
- **Desvantagens**: Custa o dobro de recursos (infra duplicada).

### 3. Canary Deployment
- **Como funciona**: Libera a nova versão para um subconjunto pequeno de usuários (ex: 5% ou funcionários internos).
- **Vantagens**: Risco mínimo; se houver erro, afeta pouca gente.
- **Desvantagens**: Complexidade de roteamento e observabilidade (necessário distinguir logs da v1 e v2).

## Fluxo de Rollback
- **Automático**: Defina métricas de saúde (Health Checks, Error Rate). Se passarem do limite durante o deploy, o sistema reverte sozinho.
- **Manual**: Tenha um botão de "Pânico" no dashboard de CD.

## Feature Toggles vs Deployment
- Deployment ≠ Release.
- Você pode fazer o *deploy* do código (instalar no servidor), mas só fazer o *release* da feature (ligar a Feature Flag) depois. Isso separa o risco técnico do risco de negócio.
