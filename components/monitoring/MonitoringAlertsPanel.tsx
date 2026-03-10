import React from 'react';
import type { MonitoringAlert } from '../../services/monitoring/monitoringAlerts';

interface MonitoringAlertsPanelProps {
  alerts: MonitoringAlert[];
}

function getAlertStyles(severity: MonitoringAlert['severity']) {
  if (severity === 'critical') {
    return 'border-red-200 bg-red-50 text-red-900';
  }
  if (severity === 'warning') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-900';
  }
  return 'border-blue-200 bg-blue-50 text-blue-900';
}

function getAlertBadge(severity: MonitoringAlert['severity']) {
  if (severity === 'critical') return 'Crítico';
  if (severity === 'warning') return 'Atenção';
  return 'Informativo';
}

export function MonitoringAlertsPanel({ alerts }: MonitoringAlertsPanelProps) {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold">Alertas Operacionais</h3>
          <p className="text-sm text-gray-500">Falha, latência, fallback e saúde do provider.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {alerts.length} alerta{alerts.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Nenhum alerta ativo no momento. O painel segue acompanhando sucesso, latencia, fallback e saude do provider.
          </div>
        )}
        {alerts.map((alert) => (
          <div key={`${alert.severity}:${alert.title}`} className={`rounded-lg border p-4 ${getAlertStyles(alert.severity)}`}>
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-bold">{alert.title}</h4>
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                {getAlertBadge(alert.severity)}
              </span>
            </div>
            <p className="mt-2 text-sm opacity-90">{alert.description}</p>
            <p className="mt-2 text-xs font-medium opacity-80">Ação: {alert.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
