import React from 'react';

interface MonitoringMetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'green' | 'yellow' | 'red' | 'blue';
}

function getColorClasses(color: MonitoringMetricCardProps['color']) {
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
}

function getTrendIcon(trend?: MonitoringMetricCardProps['trend']) {
    if (!trend) return null;
    if (trend === 'up') return <span className="text-green-600">↗️</span>;
    if (trend === 'down') return <span className="text-red-600">↘️</span>;
    return <span className="text-gray-600">→</span>;
}

export function MonitoringMetricCard({
    title,
    value,
    subtitle,
    trend,
    color = 'blue'
}: MonitoringMetricCardProps) {
    return (
        <div className={`border rounded-lg p-4 ${getColorClasses(color)}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-75">{title}</h3>
                {getTrendIcon(trend)}
            </div>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
        </div>
    );
}
