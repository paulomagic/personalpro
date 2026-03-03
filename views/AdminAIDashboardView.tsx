import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Brain,
    Coins,
    BarChart2,
    TrendingUp,
    Zap,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Calendar,
    Clock
} from 'lucide-react';
import { getAIMetrics } from '../services/loggingService';

interface AdminAIDashboardViewProps {
    onBack: () => void;
}

const AdminAIDashboardView: React.FC<AdminAIDashboardViewProps> = ({ onBack }) => {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        setLoading(true);
        const data = await getAIMetrics();
        setMetrics(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const formatNumber = (num: number) => {
        return num.toLocaleString('pt-BR');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Brain size={22} className="text-purple-400" />
                                Dashboard de IA
                            </h1>
                            <p className="text-xs text-slate-500">Métricas detalhadas de uso</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchMetrics}
                        className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <main className="px-6 py-6 space-y-6">
                {/* Hero Stats - Today */}
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

                {/* Tokens do Dia */}
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

                {/* Tokens Acumulados (Total) */}
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

                {/* Quick Stats */}
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

                {metrics?.aiFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.38 }}
                        className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Feedback IA (7 dias)</span>
                            <span className="text-xs text-slate-400">{metrics.aiFeedback.total} avaliações</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <p className="text-xl font-black text-emerald-400">{metrics.aiFeedback.positive || 0}</p>
                                <p className="text-[10px] text-slate-500">positivo</p>
                            </div>
                            <div>
                                <p className="text-xl font-black text-red-400">{metrics.aiFeedback.negative || 0}</p>
                                <p className="text-[10px] text-slate-500">negativo</p>
                            </div>
                            <div>
                                <p className="text-xl font-black text-white">{metrics.aiFeedback.approvalRate || 0}%</p>
                                <p className="text-[10px] text-slate-500">aprovação</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Uso por Modelo */}
                {metrics?.byModel && Object.keys(metrics.byModel).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart2 size={16} className="text-blue-400" />
                            <span className="text-sm font-black text-white">Uso por Modelo (7 dias)</span>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(metrics.byModel).map(([model, count]: [string, any]) => (
                                <div key={model} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 truncate max-w-[150px]">{model}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 bg-blue-500/30 rounded-full w-24">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (count / metrics.totalLogs) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-white w-10 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Tokens por Função */}
                {metrics?.tokensByAction && Object.keys(metrics.tokensByAction).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle size={16} className="text-emerald-400" />
                            <span className="text-sm font-black text-white">Tokens por Função</span>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(metrics.tokensByAction)
                                .sort(([, a]: any, [, b]: any) => b - a)
                                .map(([action, count]: [string, any]) => (
                                    <div key={action} className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 capitalize">{action.replace(/_/g, ' ')}</span>
                                        <span className="font-mono text-emerald-400 font-bold">{formatNumber(count)}</span>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {/* Uso por Tipo de Ação */}
                {metrics?.byAction && Object.keys(metrics.byAction).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Brain size={16} className="text-purple-400" />
                            <span className="text-sm font-black text-white">Requisições por Tipo (7 dias)</span>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(metrics.byAction)
                                .sort(([, a]: any, [, b]: any) => b - a)
                                .map(([action, count]: [string, any]) => (
                                    <div key={action} className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 capitalize">{action.replace(/_/g, ' ')}</span>
                                        <span className="font-mono text-purple-400 font-bold">{count}</span>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {/* Taxa de Sucesso por Ação */}
                {metrics?.successRateByAction && Object.keys(metrics.successRateByAction).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle size={16} className="text-emerald-400" />
                            <span className="text-sm font-black text-white">Taxa de Sucesso por Ação</span>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(metrics.successRateByAction)
                                .sort(([, a]: any, [, b]: any) => b - a)
                                .map(([action, rate]: [string, any]) => (
                                    <div key={action} className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400 capitalize">{action.replace(/_/g, ' ')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 bg-slate-700 rounded-full w-20">
                                                <div
                                                    className={`h-full rounded-full transition-all ${rate >= 70 ? 'bg-emerald-500' : rate >= 40 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                    style={{ width: `${rate}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold w-10 text-right ${rate >= 70 ? 'text-emerald-400' : rate >= 40 ? 'text-blue-400' : 'text-red-400'}`}>
                                                {rate}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {/* Latência Média por Ação */}
                {metrics?.avgLatencyByAction && Object.keys(metrics.avgLatencyByAction).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={16} className="text-blue-400" />
                            <span className="text-sm font-black text-white">Latência Média por Ação</span>
                            {metrics.avgLatency > 0 && (
                                <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-auto">
                                    Média geral: {formatNumber(metrics.avgLatency)}ms
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {Object.entries(metrics.avgLatencyByAction)
                                .sort(([, a]: any, [, b]: any) => b - a)
                                .map(([action, ms]: [string, any]) => (
                                    <div key={action} className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 capitalize">{action.replace(/_/g, ' ')}</span>
                                        <span className={`font-mono font-bold ${ms > 5000 ? 'text-red-400' : ms > 2000 ? 'text-blue-400' : 'text-blue-400'}`}>
                                            {formatNumber(ms)}ms
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {/* Erros Recentes */}
                {metrics?.recentErrors && metrics.recentErrors.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65 }}
                        className="glass-card rounded-2xl p-4 border border-red-500/20"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={16} className="text-red-400" />
                            <span className="text-sm font-black text-white">Erros Recentes</span>
                            <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                últimos 10
                            </span>
                        </div>
                        <div className="space-y-3">
                            {metrics.recentErrors.map((err: any, idx: number) => (
                                <div key={idx} className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-red-400 capitalize">
                                            {err.action_type?.replace(/_/g, ' ') || 'Desconhecido'}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {new Date(err.created_at).toLocaleString('pt-BR', {
                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 line-clamp-2">
                                        {err.error_message || 'Sem mensagem de erro'}
                                    </p>
                                    <span className="text-[10px] text-slate-600 mt-1 block">
                                        {err.model_used}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Histórico Diário (7 dias) */}
                {metrics?.requestsByDay && Object.keys(metrics.requestsByDay).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar size={16} className="text-purple-400" />
                            <span className="text-sm font-black text-white">Histórico Diário (7 dias)</span>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(metrics.requestsByDay)
                                .sort(([a], [b]) => b.localeCompare(a))
                                .map(([day, data]: [string, any]) => {
                                    const successRate = data.total > 0 ? Math.round((data.success / data.total) * 100) : 0;
                                    const dateStr = new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                                    return (
                                        <div key={day} className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 capitalize w-24">{dateStr}</span>
                                            <div className="flex-1 mx-3">
                                                <div className="h-2 bg-slate-700 rounded-full">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, (data.total / 20) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-28 justify-end">
                                                <span className="font-mono text-white font-bold">{data.total}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${successRate >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {successRate}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default AdminAIDashboardView;
