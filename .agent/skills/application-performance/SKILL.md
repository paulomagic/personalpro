---
name: application-performance
description: Application profiling and optimization. Identifies bottlenecks in code, database queries, and memory usage to ensure high-performance applications.
---

# Application Performance Skill

## Quando usar esta habilidade
- Quando a aplicação estiver lenta ("lag").
- Para reduzir custos de infraestrutura (otimização de recursos).
- Para preparar a aplicação para picos de tráfego (Scaling).
- Para investigar memory leaks.

## Metodologia de Otimização

### 1. Mensurar (Don't Guess!)
- Antes de otimizar, você DEVE ter uma métrica base.
- Use Profilers:
    - **Python**: `cProfile`, `py-spy`.
    - **Node.js**: `clinic.js`, Node Inspector, V8 profiler.
    - **Go**: `pprof`.
    - **Databases**: `EXPLAIN ANALYZE` (SQL).

### 2. O Princípio de Pareto (80/20)
- 80% da lentidão geralmente vem de 20% do código.
- Foque nos "Hot Paths" (caminhos críticos de execução frequente).

### 3. Áreas Comuns de Gargalo
- **I/O (Banco de Dados/Rede)**: O vilão #1. Queries N+1, falta de índices, chamadas HTTP síncronas em loop.
- **CPU Bound**: Processamento pesado (criptografia, compressão, loops grandes).
- **Memory Bound**: Garbage collection excessivo, memory leaks.

## Técnicas de Otimização

### Banco de Dados
- **Índices**: Adicione índices nas colunas de filtro.
- **Select Fields**: Selecione apenas colunas necessárias (`SELECT *` é ruim).
- **Batching**: Insira/Atualize em lotes, não um por um.
- **Caching**: Use Redis/Memcached para dados de leitura frequente e escrita rara.

### Código
- **Algoritmos**: Troque O(n^2) por O(n log n) ou O(n).
- **Assincronismo**: Não bloqueie a thread principal (Event Loop ou GIL).
- **Pool de Conexões**: Reutilize conexões de DB e HTTP.

### Frontend (Web Vitals)
- **LCP (Largest Contentful Paint)**: Otimize imagens e carregamento de fontes.
- **CLS (Cumulative Layout Shift)**: Defina tamanhos fixos para mídia.
- **Bundle Size**: Tree-shaking, code splitting.

## Checklist de Performance
- [ ] A query SQL lenta foi analisada com `EXPLAIN`?
- [ ] O endpoint tem cache (HTTP ou App-level)?
- [ ] Existem loops fazendo chamadas de I/O? (O famoso problema N+1).
- [ ] O "Time To First Byte" (TTFB) está aceitável?
