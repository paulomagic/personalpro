/**
 * Monitoring Dashboard - Métricas de Produção (Conectado ao Supabase)
 */

import React, { useState } from 'react';
import { MonitoringMetricCard } from './monitoring/MonitoringMetricCard';
import { MonitoringAlertsPanel } from './monitoring/MonitoringAlertsPanel';
import { MonitoringStatusSummary } from './monitoring/MonitoringStatusSummary';
import { useMonitoringMetrics, type MonitoringTimeRange } from '../hooks/useMonitoringMetrics';

const TIME_RANGE_LABELS: Record<MonitoringTimeRange, string> = {
    '24h': 'Últimas 24h',
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias'
};

export function MonitoringDashboardConnected() {
    const [timeRange, setTimeRange] = useState<MonitoringTimeRange>('24h');
    const { metrics, alerts, loading, error, fetchMetrics } = useMonitoringMetrics(timeRange);

    const getSuccessRateColor = (rate: number): 'green' | 'yellow' | 'red' => {
        if (rate >= 95) return 'green';
        if (rate >= 85) return 'yellow';
        return 'red';
    };

    const getRateLimitColor = (errors: number): 'green' | 'yellow' | 'red' => {
        if (errors <= 2) return 'green';
        if (errors <= 5) return 'yellow';
        return 'red';
    };

    const getProviderHealthColor = (status?: 'ok' | 'warning' | 'critical'): 'green' | 'yellow' | 'red' | 'blue' => {
        if (status === 'ok') return 'green';
        if (status === 'warning') return 'yellow';
        if (status === 'critical') return 'red';
        return 'blue';
    };

    // ============ RENDER ============

    if (loading) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Monitoramento de Produção</h2>
                <div className="text-center py-12">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Carregando leitura operacional...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Monitoramento de Produção</h2>
                <div className="text-center py-12">
                    <p className="text-red-600">❌ {error}</p>
                    <p className="mt-2 text-sm text-gray-500">O painel nao conseguiu ler os indicadores atuais. Tente atualizar para buscar a leitura mais recente.</p>
                    <button
                        onClick={fetchMetrics}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Monitoramento de Produção</h2>
                <div className="text-center py-12">
                    <p className="text-gray-600">Ainda nao ha dados suficientes para exibir o painel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Monitoramento de Produção</h2>

                {/* Time Range Selector */}
                <div className="flex gap-2">
                    {(['24h', '7d', '30d'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${timeRange === range
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {TIME_RANGE_LABELS[range]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <MonitoringMetricCard
                    title="Taxa de Sucesso"
                    value={`${metrics.success_rate.toFixed(1)}%`}
                    subtitle={`${metrics.total_generations} gerações`}
                    trend={metrics.success_rate >= 95 ? 'up' : 'down'}
                    color={getSuccessRateColor(metrics.success_rate)}
                />

                <MonitoringMetricCard
                    title="Tempo Médio de Geração"
                    value={`${(metrics.avg_generation_time_ms / 1000).toFixed(1)}s`}
                    subtitle="Desde a solicitação até conclusão"
                    trend="neutral"
                    color="blue"
                />

                <MonitoringMetricCard
                    title="Erros de Rate Limit"
                    value={metrics.rate_limit_errors}
                    subtitle="Groq API rate limiting"
                    trend={metrics.rate_limit_errors <= 2 ? 'up' : 'down'}
                    color={getRateLimitColor(metrics.rate_limit_errors)}
                />

                <MonitoringMetricCard
                    title="Erros de Validação"
                    value={metrics.validation_errors}
                    subtitle="Respostas inválidas da IA"
                    trend={metrics.validation_errors <= 5 ? 'up' : 'down'}
                    color={metrics.validation_errors <= 5 ? 'green' : 'yellow'}
                />

                <MonitoringMetricCard
                    title="Uso de Fallback"
                    value={`${metrics.fallback_usage_percent.toFixed(1)}%`}
                    subtitle={`${metrics.fallback_usage_count} ocorrências`}
                    trend={metrics.fallback_usage_percent < 10 ? 'up' : 'down'}
                    color={metrics.fallback_usage_percent < 10 ? 'green' : 'yellow'}
                />

                <MonitoringMetricCard
                    title="Total de Gerações"
                    value={metrics.total_generations}
                    subtitle={`Período: ${timeRange}`}
                    trend="neutral"
                    color="blue"
                />

                {metrics.provider_health && (
                    <MonitoringMetricCard
                        title="Saúde do Provedor IA"
                        value={String(metrics.provider_health.status).toUpperCase()}
                        subtitle={metrics.provider_health.reason}
                        trend={metrics.provider_health.status === 'ok' ? 'up' : 'down'}
                        color={getProviderHealthColor(metrics.provider_health.status)}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 mb-6">
                <MonitoringStatusSummary metrics={metrics} />
                <MonitoringAlertsPanel alerts={alerts} />
            </div>

            {metrics.provider_health && (
                <div className="bg-white border rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Provedor IA</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">Treinos IA (24h)</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.provider_health.workout_actions_24h}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">Sucesso Groq (24h)</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.provider_health.groq_success_24h}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">Último sucesso Groq</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                {metrics.provider_health.last_groq_success_at
                                    ? new Date(metrics.provider_health.last_groq_success_at).toLocaleString('pt-BR')
                                    : 'Sem sucesso registrado'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Last Updated */}
            <div className="text-center mt-6 text-sm text-gray-500">
                Última atualização: {new Date(metrics.last_updated).toLocaleString('pt-BR')}
            </div>
        </div>
    );
}
