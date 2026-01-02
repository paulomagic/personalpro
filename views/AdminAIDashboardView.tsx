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
    Calendar
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
                    className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Coins size={16} className="text-amber-400" />
                        <span className="text-sm font-black text-white">Tokens Acumulados</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">~estimado</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-2xl font-black text-amber-400">
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
            </main>
        </div>
    );
};

export default AdminAIDashboardView;
