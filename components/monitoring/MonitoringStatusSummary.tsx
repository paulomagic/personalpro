import React from 'react';
import type { GenerationMetrics } from '../../hooks/useMonitoringMetrics';

interface MonitoringStatusSummaryProps {
    metrics: GenerationMetrics;
}

function getStatusTone(condition: boolean, warningCondition?: boolean) {
    if (condition) return 'text-green-600';
    if (warningCondition) return 'text-yellow-600';
    return 'text-red-600';
}

function getSuccessRateLabel(rate: number) {
    if (rate >= 95) return '✅ Excelente';
    if (rate >= 85) return '⚠️ Atenção';
    return '❌ Crítico';
}

function getRateLimitLabel(errors: number) {
    if (errors <= 2) return '✅ Otimizado';
    if (errors <= 5) return '⚠️ Verificar';
    return '❌ Ajustar limites';
}

function getProviderHealthLabel(status?: 'ok' | 'warning' | 'critical') {
    if (status === 'ok') return '✅ Estável';
    if (status === 'warning') return '⚠️ Atenção';
    if (status === 'critical') return '❌ Instável';
    return 'ℹ️ Sem leitura';
}

function getProviderHealthTone(status?: 'ok' | 'warning' | 'critical') {
    if (status === 'ok') return 'text-green-600';
    if (status === 'warning') return 'text-yellow-600';
    if (status === 'critical') return 'text-red-600';
    return 'text-gray-600';
}

export function MonitoringStatusSummary({ metrics }: MonitoringStatusSummaryProps) {
    return (
        <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-4">📊 Resumo do Status</h3>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Sucesso</span>
                    <span className={`text-sm font-medium ${getStatusTone(metrics.success_rate >= 95, metrics.success_rate >= 85)}`}>
                        {getSuccessRateLabel(metrics.success_rate)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm">Rate Limiting</span>
                    <span className={`text-sm font-medium ${getStatusTone(metrics.rate_limit_errors <= 2, metrics.rate_limit_errors <= 5)}`}>
                        {getRateLimitLabel(metrics.rate_limit_errors)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm">Sistema de Fallback</span>
                    <span className={`text-sm font-medium ${metrics.fallback_usage_percent < 10 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {metrics.fallback_usage_percent < 10 ? '✅ Saudável' : '⚠️ Uso elevado'}
                    </span>
                </div>

                {metrics.provider_health && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Saúde do Provedor IA</span>
                        <span className={`text-sm font-medium ${getProviderHealthTone(metrics.provider_health.status)}`}>
                            {getProviderHealthLabel(metrics.provider_health.status)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
