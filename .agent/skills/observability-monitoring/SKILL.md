---
name: observability-monitoring
description: Monitoramento, logging, rastreamento distribuído e SLOs. Implementa observabilidade completa para entender o comportamento do sistema em produção.
---

# Observability & Monitoring Skill

## Quando usar esta habilidade
- Para instrumentar uma aplicação (adicionar logs e métricas).
- Para configurar dashboards (Grafana, Datadog).
- Para definir alertas e SLOs.
- Para debugar problemas de performance ou erros em produção.

## Os 3 Pilares da Observabilidade

### 1. Logs (Eventos Discretos)
- **O que**: Registro detalhado de eventos específicos.
- **Estrutura**: Use JSON logs estruturados (JSON) em vez de texto puro para facilitar busca.
- **Exemplo**: `{"level": "error", "user_id": 123, "msg": "Payment failed", "trace_id": "abc-123"}`
- **Ferramentas**: ELK Stack, Splunk, CloudWatch Logs.

### 2. Metrics (Dados Agregados)
- **O que**: Números agregados ao longo do tempo. Mostram *tendências*.
- **Tipos**:
    - **Counters**: Só sobe (ex: `http_requests_total`).
    - **Gauges**: Oscila (ex: `memory_usage_bytes`, `active_connections`).
    - **Histograms**: Distribuição (ex: `request_duration_seconds` - p95, p99).
- **Ferramentas**: Prometheus, Datadog Metrics.

### 3. Tracing (Contexto da Requisição)
- **O que**: Rastreia o caminho de uma requisição por vários microsserviços.
- **Conceito**: Use um `Trace ID` único propagado nos headers HTTP.
- **Ferramentas**: Jaeger, Zipkin, OpenTelemetry.

## Padrões de Ouro (Golden Signals - Google SRE)
Para cada serviço, monitore:
1.  **Latência**: Tempo para servir uma requisição.
2.  **Tráfego**: Demanda no sistema (ex: req/sec).
3.  **Erros**: Taxa de falha (ex: status 500).
4.  **Saturação**: Quão "cheio" está o serviço (ex: CPU, memória).

## Alertas
- **Sintoma vs Causa**: Alerte sobre sintomas ("O site está lento para o usuário"), investigue causas ("CPU alta").
- **Fadiga de Alerta**: Se tudo é urgente, nada é urgente. Configure alertas apenas para o que requer ação humana imediata.
