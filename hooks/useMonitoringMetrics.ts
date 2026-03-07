import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseCore';

export type MonitoringTimeRange = '24h' | '7d' | '30d';

export interface GenerationMetrics {
    total_generations: number;
    success_rate: number;
    avg_generation_time_ms: number;
    rate_limit_errors: number;
    validation_errors: number;
    fallback_usage_count: number;
    fallback_usage_percent: number;
    last_updated: string;
}

const EMPTY_METRICS: GenerationMetrics = {
    total_generations: 0,
    success_rate: 0,
    avg_generation_time_ms: 0,
    rate_limit_errors: 0,
    validation_errors: 0,
    fallback_usage_count: 0,
    fallback_usage_percent: 0,
    last_updated: new Date().toISOString()
};

function mapMetricsRow(row?: Record<string, unknown>): GenerationMetrics {
    if (!row) {
        return {
            ...EMPTY_METRICS,
            last_updated: new Date().toISOString()
        };
    }

    return {
        total_generations: Number(row.total_generations) || 0,
        success_rate: Number(row.success_rate) || 0,
        avg_generation_time_ms: Number(row.avg_generation_time_ms) || 0,
        rate_limit_errors: Number(row.rate_limit_errors) || 0,
        validation_errors: Number(row.validation_errors) || 0,
        fallback_usage_count: Number(row.fallback_usage_count) || 0,
        fallback_usage_percent: Number(row.fallback_usage_percent) || 0,
        last_updated: new Date().toISOString()
    };
}

function getTimeRangeHours(timeRange: MonitoringTimeRange): number {
    if (timeRange === '24h') return 24;
    if (timeRange === '7d') return 168;
    return 720;
}

export function useMonitoringMetrics(timeRange: MonitoringTimeRange) {
    const [metrics, setMetrics] = useState<GenerationMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('get_ai_generation_metrics', {
                    time_range_hours: getTimeRangeHours(timeRange)
                });

            if (rpcError) {
                console.error('[Monitoring] RPC Error:', rpcError);
                setError('Erro ao buscar métricas. Verifique se a migration foi aplicada.');
                setMetrics(null);
                return;
            }

            const firstRow = Array.isArray(data) ? data[0] : undefined;
            setMetrics(mapMetricsRow(firstRow));
        } catch (fetchError: any) {
            console.error('[Monitoring] Error fetching metrics:', fetchError);
            setError(fetchError.message || 'Erro desconhecido');
            setMetrics(null);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return {
        metrics,
        loading,
        error,
        fetchMetrics
    };
}
