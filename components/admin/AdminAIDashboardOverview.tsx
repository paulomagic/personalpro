import React from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    Coins,
    TrendingUp,
    Zap
} from 'lucide-react';
import { getAIMetrics } from '../../services/loggingService';

type AdminAIMetrics = Awaited<ReturnType<typeof getAIMetrics>>;

interface AdminAIDashboardOverviewProps {
    metrics?: AdminAIMetrics;
    loading: boolean;
    formatNumber: (value: number) => string;
    formatDateTime: (value?: string | null) => string;
}

export function AdminAIDashboardOverview({
    metrics,
    loading,
    formatNumber,
    formatDateTime
}: AdminAIDashboardOverviewProps) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-5 border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={16} className="text-purple-400" />
                    <span className="text-sm font-black text-white">Hoje</span>
                    <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full ml-auto">
                        {new Date().toLocaleDateString('pt-BR')}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-3xl font-black text-purple-400">
                            {loading ? '...' : metrics?.todayLogs || 0}
                        </p>
                        <p className="text-xs text-slate-400">requisições</p>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-emerald-400">
                            {loading ? '...' : `${metrics?.successRate || 0}%`}
                        </p>
                        <p className="text-xs text-slate-400">taxa de sucesso</p>
                    </div>
                </div>
            </motion.div>

            {metrics?.providerHealth && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className={`rounded-2xl p-4 border ${metrics.providerHealth.status === 'critical'
                        ? 'bg-red-500/10 border-red-500/40'
                        : metrics.providerHealth.status === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-emerald-500/10 border-emerald-500/30'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {metrics.providerHealth.status === 'ok'
                            ? <CheckCircle size={18} className="text-emerald-400 mt-0.5" />
                            : <AlertTriangle size={18} className={metrics.providerHealth.status === 'critical' ? 'text-red-400 mt-0.5' : 'text-amber-300 mt-0.5'} />}
                        <div className="flex-1">
                            <p className={`text-sm font-black ${metrics.providerHealth.status === 'critical'
                                ? 'text-red-300'
                                : metrics.providerHealth.status === 'warning'
                                    ? 'text-amber-200'
                                    : 'text-emerald-300'
                                }`}>
                                Saúde do Provedor IA: {String(metrics.providerHealth.status).toUpperCase()}
                            </p>
                            <p className="text-xs text-slate-300 mt-1">{metrics.providerHealth.reason}</p>
                            <div className="mt-2 text-[11px] text-slate-400 grid grid-cols-2 gap-1">
                                <span>Treinos IA (24h): {metrics.providerHealth.workoutActions24h || 0}</span>
                                <span>Sucesso Groq (24h): {metrics.providerHealth.groqSuccess24h || 0}</span>
                                <span className="col-span-2">Último sucesso Groq: {formatDateTime(metrics.providerHealth.lastGroqSuccessAt)}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-5 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Zap size={16} className="text-cyan-400" />
                    <span className="text-sm font-black text-white">Tokens do Dia</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-2xl font-black text-cyan-400">
                            {loading ? '...' : formatNumber(metrics?.todayTokens || 0)}
                        </p>
                        <p className="text-[10px] text-slate-500">Total</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-300">
                            {loading ? '...' : formatNumber(metrics?.todayTokensInput || 0)}
                        </p>
                        <p className="text-[10px] text-slate-500">Entrada</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-300">
                            {loading ? '...' : formatNumber(metrics?.todayTokensOutput || 0)}
                        </p>
                        <p className="text-[10px] text-slate-500">Saída</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-gradient-to-br from-amber-500/10 to-transparent"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Coins size={16} className="text-blue-400" />
                    <span className="text-sm font-black text-white">Tokens Acumulados</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">~estimado</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-2xl font-black text-blue-400">
                            {loading ? '...' : formatNumber(metrics?.totalTokens || 0)}
                        </p>
                        <p className="text-[10px] text-slate-500">Total</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-300">
                            {loading ? '...' : formatNumber(metrics?.totalTokensInput || 0)}
                        </p>
                        <p className="text-[10px] text-slate-500">Entrada</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-300">
                            {loading ? '...' : formatNumber(metrics?.totalTokensOutput || 0)}
                        </p>
                        <p className="text-[10px] text-slate-500">Saída</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card rounded-2xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-blue-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Requisições</span>
                    </div>
                    <p className="text-2xl font-black text-white">
                        {loading ? '...' : formatNumber(metrics?.totalLogs || 0)}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass-card rounded-2xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Erros Hoje</span>
                    </div>
                    <p className="text-2xl font-black text-red-400">
                        {loading ? '...' : metrics?.errorsToday || 0}
                    </p>
                </motion.div>
            </div>
        </>
    );
}
