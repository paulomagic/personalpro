import type { GenerationMetrics } from '../../hooks/useMonitoringMetrics';

export interface MonitoringAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action: string;
}

export function deriveMonitoringAlerts(metrics: GenerationMetrics): MonitoringAlert[] {
  const alerts: MonitoringAlert[] = [];

  if (metrics.provider_health?.status === 'critical') {
    alerts.push({
      severity: 'critical',
      title: 'Provedor IA instável',
      description: metrics.provider_health.reason,
      action: 'Revisar provider, fallback e logs recentes do fluxo de treino.'
    });
  } else if (metrics.provider_health?.status === 'warning') {
    alerts.push({
      severity: 'warning',
      title: 'Saúde do provedor requer atenção',
      description: metrics.provider_health.reason,
      action: 'Monitorar o volume de sucesso do provider nas próximas horas.'
    });
  }

  if (metrics.success_rate < 85) {
    alerts.push({
      severity: 'critical',
      title: 'Taxa de sucesso abaixo do aceitável',
      description: `A taxa atual está em ${metrics.success_rate.toFixed(1)}%.`,
      action: 'Investigar erros recentes, schemas inválidos e indisponibilidade de provider.'
    });
  } else if (metrics.success_rate < 95) {
    alerts.push({
      severity: 'warning',
      title: 'Taxa de sucesso abaixo da meta',
      description: `A taxa atual está em ${metrics.success_rate.toFixed(1)}%.`,
      action: 'Acompanhar falhas e evitar regressão antes de ampliar o uso.'
    });
  }

  if (metrics.avg_generation_time_ms >= 15000) {
    alerts.push({
      severity: 'critical',
      title: 'Latência de geração crítica',
      description: `Tempo médio em ${Math.round(metrics.avg_generation_time_ms / 1000)}s.`,
      action: 'Revisar latência do provider, fila e fallback do motor de treino.'
    });
  } else if (metrics.avg_generation_time_ms >= 8000) {
    alerts.push({
      severity: 'warning',
      title: 'Latência de geração elevada',
      description: `Tempo médio em ${Math.round(metrics.avg_generation_time_ms / 1000)}s.`,
      action: 'Monitorar lentidão e validar se o tempo ainda está aceitável para o usuário.'
    });
  }

  if (metrics.rate_limit_errors >= 6) {
    alerts.push({
      severity: 'critical',
      title: 'Rate limit em nível crítico',
      description: `${metrics.rate_limit_errors} erros de limite no período selecionado.`,
      action: 'Reduzir concorrência, revisar bursts e priorizar fallback seguro.'
    });
  } else if (metrics.rate_limit_errors >= 3) {
    alerts.push({
      severity: 'warning',
      title: 'Rate limit recorrente',
      description: `${metrics.rate_limit_errors} erros de limite no período selecionado.`,
      action: 'Observar tendência e ajustar cadência se a pressão aumentar.'
    });
  }

  if (metrics.fallback_usage_percent >= 25) {
    alerts.push({
      severity: 'critical',
      title: 'Fallback usado em excesso',
      description: `O fallback foi usado em ${metrics.fallback_usage_percent.toFixed(1)}% das gerações.`,
      action: 'Verificar degradação do provider principal e qualidade do fluxo principal.'
    });
  } else if (metrics.fallback_usage_percent >= 10) {
    alerts.push({
      severity: 'warning',
      title: 'Fallback acima do ideal',
      description: `O fallback foi usado em ${metrics.fallback_usage_percent.toFixed(1)}% das gerações.`,
      action: 'Acompanhar se o aumento é pontual ou tendência operacional.'
    });
  }

  if (metrics.validation_errors >= 10) {
    alerts.push({
      severity: 'warning',
      title: 'Volume alto de erros de validação',
      description: `${metrics.validation_errors} respostas inválidas no período.`,
      action: 'Revisar contratos de schema, prompts e tratamento de respostas inválidas.'
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      severity: 'info',
      title: 'Operação estável',
      description: 'Nenhum alerta crítico ou de atenção foi detectado no período selecionado.',
      action: 'Manter monitoramento e acompanhar o painel de forma rotineira.'
    });
  }

  return alerts;
}
