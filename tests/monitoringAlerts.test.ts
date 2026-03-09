import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { deriveMonitoringAlerts } from '../services/monitoring/monitoringAlerts';
import type { GenerationMetrics } from '../hooks/useMonitoringMetrics';

function createMetrics(overrides: Partial<GenerationMetrics> = {}): GenerationMetrics {
  return {
    total_generations: 24,
    success_rate: 98,
    avg_generation_time_ms: 3200,
    rate_limit_errors: 0,
    validation_errors: 0,
    fallback_usage_count: 1,
    fallback_usage_percent: 4,
    last_updated: new Date().toISOString(),
    ...overrides
  };
}

test('deriveMonitoringAlerts returns stable info alert for healthy operation', () => {
  const alerts = deriveMonitoringAlerts(createMetrics());
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].severity, 'info');
  assert.match(alerts[0].title, /Operação estável/i);
});

test('deriveMonitoringAlerts escalates provider outage and degraded success rate', () => {
  const alerts = deriveMonitoringAlerts(createMetrics({
    success_rate: 82,
    provider_health: {
      status: 'critical',
      reason: 'Treinos IA ativos sem sucesso no Groq nas últimas 24h.',
      workout_actions_24h: 32,
      groq_success_24h: 0,
      last_groq_success_at: null
    }
  }));

  assert.equal(alerts.some((alert) => alert.severity === 'critical' && /Provedor IA instável/i.test(alert.title)), true);
  assert.equal(alerts.some((alert) => alert.severity === 'critical' && /Taxa de sucesso/i.test(alert.title)), true);
});

test('deriveMonitoringAlerts warns on elevated latency and fallback usage', () => {
  const alerts = deriveMonitoringAlerts(createMetrics({
    avg_generation_time_ms: 9000,
    fallback_usage_percent: 14,
    fallback_usage_count: 7
  }));

  assert.equal(alerts.some((alert) => alert.severity === 'warning' && /Latência/i.test(alert.title)), true);
  assert.equal(alerts.some((alert) => alert.severity === 'warning' && /Fallback/i.test(alert.title)), true);
});
