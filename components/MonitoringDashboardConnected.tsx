/**
 * Monitoring Dashboard - Métricas de Produção (Conectado ao Supabase)
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

// ============ TYPES ============

interface GenerationMetrics {
    total_generations: number;
    success_rate: number;
    avg_generation_time_ms: number;
    rate_limit_errors: number;
    validation_errors: number;
    fallback_usage_count: number;
    fallback_usage_percent: number;
    last_updated: string;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'green' | 'yellow' | 'red' | 'blue';
}

// ============ METRIC CARD ============

function MetricCard({ title, value, subtitle, trend, color = 'blue' }: MetricCardProps) {
    const getColorClasses = () => {
        switch (color) {
            case 'green':
                return 'bg-green-50 border-green-200 text-green-900';
            case 'yellow':
                return 'bg-yellow-50 border-yellow-200 text-yellow-900';
            case 'red':
                return 'bg-red-50 border-red-200 text-red-900';
            default:
                return 'bg-blue-50 border-blue-200 text-blue-900';
        }
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        switch (trend) {
            case 'up':
                return <span className="text-green-600">↗️</span>;
            case 'down':
                return <span className="text-red-600">↘️</span>;
            default:
                return <span className="text-gray-600">→</span>;
        }
    };

    return (
        <div className={`border rounded-lg p-4 ${getColorClasses()}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-75">{title}</h3>
                {getTrendIcon()}
            </div>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
        </div>
    );
}

// ============ MONITORING DASHBOARD ============

export function MonitoringDashboardConnected() {
    const [metrics, setMetrics] = useState<GenerationMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

    // ============ FETCH METRICS ============

    useEffect(() => {
        fetchMetrics();
    }, [timeRange]);

    const fetchMetrics = async () => {
        setLoading(true);
        setError(null);

        try {
            // Convert time range to hours
            const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;

            // Call Supabase function to get aggregated metrics
            const { data, error: rpcError } = await supabase
                .rpc('get_ai_generation_metrics', { time_range_hours: hours });

            if (rpcError) {
                console.error('[Monitoring] RPC Error:', rpcError);
                setError('Erro ao buscar métricas. Verifique se a migration foi aplicada.');
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                const metricsData = data[0];
                setMetrics({
                    total_generations: Number(metricsData.total_generations) || 0,
                    success_rate: Number(metricsData.success_rate) || 0,
                    avg_generation_time_ms: Number(metricsData.avg_generation_time_ms) || 0,
                    rate_limit_errors: Number(metricsData.rate_limit_errors) || 0,
                    validation_errors: Number(metricsData.validation_errors) || 0,
                    fallback_usage_count: Number(metricsData.fallback_usage_count) || 0,
                    fallback_usage_percent: Number(metricsData.fallback_usage_percent) || 0,
                    last_updated: new Date().toISOString()
                });
            } else {
                // No data yet - show zeros
                setMetrics({
                    total_generations: 0,
                    success_rate: 0,
                    avg_generation_time_ms: 0,
                    rate_limit_errors: 0,
                    validation_errors: 0,
                    fallback_usage_count: 0,
                    fallback_usage_percent: 0,
                    last_updated: new Date().toISOString()
                });
            }
        } catch (error: any) {
            console.error('[Monitoring] Error fetching metrics:', error);
            setError(error.message || 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    // ============ HELPERS ============

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

    // ============ RENDER ============

    if (loading) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Monitoramento de Produção</h2>
                <div className="text-center py-12">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Carregando métricas...</p>
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
                    <p className="text-gray-600">Nenhum dado disponível</p>
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
                            {range === '24h' ? 'Últimas 24h' : range === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Success Rate */}
                <MetricCard
                    title="Taxa de Sucesso"
                    value={`${metrics.success_rate.toFixed(1)}%`}
                    subtitle={`${metrics.total_generations} gerações`}
                    trend={metrics.success_rate >= 95 ? 'up' : 'down'}
                    color={getSuccessRateColor(metrics.success_rate)}
                />

                {/* Avg Generation Time */}
                <MetricCard
                    title="Tempo Médio de Geração"
                    value={`${(metrics.avg_generation_time_ms / 1000).toFixed(1)}s`}
                    subtitle="Desde a solicitação até conclusão"
                    trend="neutral"
                    color="blue"
                />

                {/* Rate Limit Errors */}
                <MetricCard
                    title="Erros de Rate Limit"
                    value={metrics.rate_limit_errors}
                    subtitle="Groq API rate limiting"
                    trend={metrics.rate_limit_errors <= 2 ? 'up' : 'down'}
                    color={getRateLimitColor(metrics.rate_limit_errors)}
                />

                {/* Validation Errors */}
                <MetricCard
                    title="Erros de Validação"
                    value={metrics.validation_errors}
                    subtitle="Respostas inválidas da IA"
                    trend={metrics.validation_errors <= 5 ? 'up' : 'down'}
                    color={metrics.validation_errors <= 5 ? 'green' : 'yellow'}
                />

                {/* Fallback Usage */}
                <MetricCard
                    title="Uso de Fallback"
                    value={`${metrics.fallback_usage_percent.toFixed(1)}%`}
                    subtitle={`${metrics.fallback_usage_count} ocorrências`}
                    trend={metrics.fallback_usage_percent < 10 ? 'up' : 'down'}
                    color={metrics.fallback_usage_percent < 10 ? 'green' : 'yellow'}
                />

                {/* Total Generations */}
                <MetricCard
                    title="Total de Gerações"
                    value={metrics.total_generations}
                    subtitle={`Período: ${timeRange}`}
                    trend="neutral"
                    color="blue"
                />
            </div>

            {/* Status Summary */}
            <div className="bg-white border rounded-lg p-6">
                <h3 className="font-semibold mb-4">📊 Resumo do Status</h3>

                <div className="space-y-3">
                    {/* Success Rate Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Taxa de Sucesso</span>
                        <span className={`text-sm font-medium ${metrics.success_rate >= 95 ? 'text-green-600' :
                            metrics.success_rate >= 85 ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>
                            {metrics.success_rate >= 95 ? '✅ Excelente' :
                                metrics.success_rate >= 85 ? '⚠️ Atenção' :
                                    '❌ Crítico'}
                        </span>
                    </div>

                    {/* Rate Limiting Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Rate Limiting</span>
                        <span className={`text-sm font-medium ${metrics.rate_limit_errors <= 2 ? 'text-green-600' :
                            metrics.rate_limit_errors <= 5 ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>
                            {metrics.rate_limit_errors <= 2 ? '✅ Otimizado' :
                                metrics.rate_limit_errors <= 5 ? '⚠️ Verificar' :
                                    '❌ Ajustar limites'}
                        </span>
                    </div>

                    {/* Fallback Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Sistema de Fallback</span>
                        <span className={`text-sm font-medium ${metrics.fallback_usage_percent < 10 ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                            {metrics.fallback_usage_percent < 10 ? '✅ Saudável' : '⚠️ Uso elevado'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            <div className="text-center mt-6 text-sm text-gray-500">
                Última atualização: {new Date(metrics.last_updated).toLocaleString('pt-BR')}
            </div>
        </div>
    );
}
