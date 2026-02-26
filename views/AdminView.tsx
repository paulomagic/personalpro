import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BarChart2,
    Users,
    Brain,
    Activity,
    Settings,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Coins
} from 'lucide-react';
import { getAIMetrics, getSystemMetrics } from '../services/loggingService';

interface AdminViewProps {
    onBack: () => void;
    onNavigate: (view: 'users' | 'ai-logs' | 'ai-dashboard' | 'activity-logs' | 'settings') => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onBack, onNavigate }) => {
    const [aiMetrics, setAIMetrics] = useState<any>(null);
    const [systemMetrics, setSystemMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            const [ai, system] = await Promise.all([
                getAIMetrics(),
                getSystemMetrics()
            ]);
            setAIMetrics(ai);
            setSystemMetrics(system);
            setLoading(false);
        };
        fetchMetrics();
    }, []);

    // Color style mappings for Tailwind JIT (dynamic classes don't work)
    const colorStyles = {
        blue: {
            bg: 'bg-blue-500/10',
            bgHover: 'hover:bg-blue-500/10 group-hover:bg-blue-500/20',
            border: 'hover:border-blue-500/20',
            text: 'text-blue-400'
        },
        purple: {
            bg: 'bg-purple-500/10',
            bgHover: 'hover:bg-purple-500/10 group-hover:bg-purple-500/20',
            border: 'hover:border-purple-500/20',
            text: 'text-purple-400'
        },
        emerald: {
            bg: 'bg-emerald-500/10',
            bgHover: 'hover:bg-emerald-500/10 group-hover:bg-emerald-500/20',
            border: 'hover:border-emerald-500/20',
            text: 'text-emerald-400'
        },
        slate: {
            bg: 'bg-slate-500/10',
            bgHover: 'hover:bg-slate-500/10 group-hover:bg-slate-500/20',
            border: 'hover:border-slate-500/20',
            text: 'text-slate-400'
        }
    };

    const menuItems = [
        { id: 'users', label: 'Gestão de Usuários', icon: Users, color: 'blue' as const, description: 'Adicionar, editar e gerenciar personal trainers' },
        { id: 'ai-dashboard', label: 'Dashboard de IA', icon: BarChart2, color: 'purple' as const, description: 'Métricas detalhadas de uso de IA' },
        { id: 'ai-logs', label: 'Logs de IA', icon: Brain, color: 'purple' as const, description: 'Histórico completo de gerações com IA' },
        { id: 'activity-logs', label: 'Logs de Atividade', icon: Activity, color: 'emerald' as const, description: 'Todas as ações realizadas no sistema' },
        { id: 'settings', label: 'Configurações', icon: Settings, color: 'slate' as const, description: 'Preferências e limites do sistema' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">Área Admin</h1>
                        <p className="text-xs text-slate-500">Gestão e Monitoramento do Sistema</p>
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-6">
                {/* KPIs Cards */}
                <div className="grid grid-cols-2 gap-4">
                    {/* AI Usage Today */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Brain size={16} className="text-purple-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IA Hoje</span>
                        </div>
                        <p className="text-2xl font-black text-white">
                            {loading ? '...' : aiMetrics?.todayLogs || 0}
                        </p>
                        <p className="text-[10px] text-slate-500">requisições</p>
                    </motion.div>

                    {/* Success Rate */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={16} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa Sucesso</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-400">
                            {loading ? '...' : `${aiMetrics?.successRate || 0}%`}
                        </p>
                        <p className="text-[10px] text-slate-500">últimos 7 dias</p>
                    </motion.div>

                    {/* Total Workouts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={16} className="text-blue-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Treinos</span>
                        </div>
                        <p className="text-2xl font-black text-white">
                            {loading ? '...' : systemMetrics?.totalWorkouts || 0}
                        </p>
                        <p className="text-[10px] text-slate-500">total salvos</p>
                    </motion.div>

                    {/* Errors Today */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={16} className="text-blue-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Erros Hoje</span>
                        </div>
                        <p className="text-2xl font-black text-blue-400">
                            {loading ? '...' : aiMetrics?.errorsToday || 0}
                        </p>
                        <p className="text-[10px] text-slate-500">falhas de IA</p>
                    </motion.div>
                </div>

                {/* Model Usage */}
                {aiMetrics?.byModel && Object.keys(aiMetrics.byModel).length > 0 && (
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
                            {Object.entries(aiMetrics.byModel).map(([model, count]: [string, any]) => (
                                <div key={model} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">{model}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 bg-blue-500/30 rounded-full w-20">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${Math.min(100, (count / aiMetrics.totalLogs) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-white w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Token Usage */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="glass-card rounded-2xl p-4 border border-blue-500/20 bg-blue-500/5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Coins size={16} className="text-blue-400" />
                        <span className="text-sm font-black text-white">Tokens Consumidos</span>
                        <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">~estimado</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-lg font-black text-blue-400">
                                {loading ? '...' : (aiMetrics?.totalTokens || 0).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-[10px] text-slate-500">Total</p>
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-300">
                                {loading ? '...' : (aiMetrics?.totalTokensInput || 0).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-[10px] text-slate-500">Entrada</p>
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-300">
                                {loading ? '...' : (aiMetrics?.totalTokensOutput || 0).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-[10px] text-slate-500">Saída</p>
                        </div>
                    </div>
                </motion.div>

                {/* Token Breakdown */}
                {aiMetrics?.tokensByAction && Object.keys(aiMetrics.tokensByAction).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.48 }}
                        className="glass-card rounded-2xl p-4 mt-2"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detalhamento por Função</span>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(aiMetrics.tokensByAction).map(([action, count]: [string, any]) => (
                                <div key={action} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 capitalize">{action.replace(/_/g, ' ')}</span>
                                    <span className="font-mono text-slate-300">{(count as number).toLocaleString('pt-BR')}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Navigation Menu */}
                <div className="space-y-3">
                    <h2 className="text-sm font-black text-white">Módulos</h2>
                    {menuItems.map((item, idx) => {
                        const styles = colorStyles[item.color];
                        return (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                                onClick={() => onNavigate(item.id as any)}
                                className={`w-full glass-card rounded-2xl p-4 flex items-center gap-4 ${styles.bgHover} border border-transparent ${styles.border} transition-all text-left group`}
                            >
                                <div className={`size-12 rounded-xl ${styles.bg} flex items-center justify-center ${styles.bgHover} transition-colors`}>
                                    <item.icon size={24} className={styles.text} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-white">{item.label}</p>
                                    <p className="text-xs text-slate-500">{item.description}</p>
                                </div>
                                <ArrowLeft size={16} className="text-slate-600 rotate-180" />
                            </motion.button>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default AdminView;
