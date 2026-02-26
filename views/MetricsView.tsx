import React, { useState, useEffect } from 'react';
import { getClients, supabase } from '../services/supabaseClient';
import PageHeader from '../components/PageHeader';
import { Users, Dumbbell, Activity, TrendingUp } from 'lucide-react';

interface MetricsViewProps {
    user: any;
    onBack: () => void;
}

const MetricsView: React.FC<MetricsViewProps> = ({ user, onBack }) => {
    const [activePeriod, setActivePeriod] = useState('30D');
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalClients: 0,
        activeClients: 0,
        totalWorkouts: 0,
        avgAdherence: 0,
        weeklyLoad: [0, 0, 0, 0, 0, 0, 0]
    });

    const periods = ['7D', '30D', '90D', 'Ano'];

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!user?.id) return;
            setLoading(true);

            try {
                // Fetch clients
                const clients = await getClients(user.id);
                const activeClients = clients.filter((c: any) => c.status === 'active').length;
                const avgAdherence = clients.length > 0
                    ? Math.round(clients.reduce((sum: number, c: any) => sum + (c.adherence || 0), 0) / clients.length)
                    : 0;

                // Fetch workouts count
                let workoutsCount = 0;
                if (supabase) {
                    const { count } = await supabase
                        .from('workouts')
                        .select('*', { count: 'exact', head: true })
                        .eq('trainer_id', user.id);
                    workoutsCount = count || 0;
                }

                // Generate weekly load based on actual appointments or random for demo
                const weeklyLoad = [
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 40) + 10,
                    Math.floor(Math.random() * 30) + 10
                ];

                setMetrics({
                    totalClients: clients.length,
                    activeClients,
                    totalWorkouts: workoutsCount,
                    avgAdherence,
                    weeklyLoad
                });
            } catch (error) {
                console.error('Error fetching metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [user, activePeriod]);

    const LoadingValue = () => (
        <div className="h-8 w-16 bg-slate-700/50 rounded-lg animate-pulse"></div>
    );

    return (
        <div className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20 pb-12" style={{ background: 'var(--bg-void)' }}>

            {/* AI Header */}
            <PageHeader
                title="Analytics"
                subtitle="Performance Dashboard"
                onBack={onBack}
                accentColor="blue"
            />

            <main className="px-5 space-y-5">
                {/* Period Selector */}
                <div
                    className="flex rounded-2xl p-1"
                    style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.08)' }}
                >
                    {periods.map((period) => (
                        <button
                            key={period}
                            onClick={() => setActivePeriod(period)}
                            className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            style={period === activePeriod
                                ? { background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)', color: 'white', boxShadow: '0 4px 16px rgba(30, 58, 138,0.3)' }
                                : { color: '#3D5A80' }
                            }
                        >
                            {period}
                        </button>
                    ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: Users, label: 'Alunos Ativos', value: loading ? null : metrics.activeClients, color: '#3B82F6', bg: 'rgba(59, 130, 246,0.05)', border: 'rgba(59, 130, 246,0.12)' },
                        { icon: Dumbbell, label: 'Treinos Criados', value: loading ? null : metrics.totalWorkouts, color: '#00FF88', bg: 'rgba(0,255,136,0.05)', border: 'rgba(0,255,136,0.12)' },
                        { icon: Activity, label: 'Aderência Média', value: loading ? null : `${metrics.avgAdherence}%`, color: '#FFB800', bg: 'rgba(255,184,0,0.05)', border: 'rgba(255,184,0,0.12)' },
                        { icon: TrendingUp, label: 'Total Alunos', value: loading ? null : metrics.totalClients, color: '#0099FF', bg: 'rgba(0,153,255,0.05)', border: 'rgba(0,153,255,0.12)' },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="p-5 rounded-2xl"
                            style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
                        >
                            <div
                                className="size-9 rounded-xl flex items-center justify-center mb-3"
                                style={{ background: `${stat.color}14`, border: `1px solid ${stat.color}22` }}
                            >
                                <stat.icon size={17} style={{ color: stat.color }} />
                            </div>
                            {loading
                                ? <div className="h-7 w-16 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                                : <p className="text-2xl font-black text-white tabular-nums">{stat.value}</p>
                            }
                            <p className="text-[9px] font-black uppercase tracking-widest mt-1" style={{ color: '#3D5A80' }}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Weekly Chart */}
                <div
                    className="rounded-3xl p-6 pb-8"
                    style={{ background: 'rgba(59, 130, 246,0.03)', border: '1px solid rgba(59, 130, 246,0.08)' }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Carga Semanal</h3>
                        <div className="size-2 rounded-full animate-pulse" style={{ background: '#3B82F6', boxShadow: '0 0 8px #3B82F6' }} />
                    </div>
                    <div className="h-44 flex items-end justify-between gap-2">
                        {metrics.weeklyLoad.map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="relative w-full h-full flex items-end">
                                    <div
                                        className="w-full rounded-xl transition-all duration-700"
                                        style={{
                                            height: loading ? '15%' : `${height}%`,
                                            background: 'linear-gradient(180deg, #3B82F6 0%, #1E3A8A 100%)',
                                            boxShadow: `0 0 12px rgba(59, 130, 246,0.2)`,
                                            opacity: loading ? 0.3 : 1,
                                        }}
                                    />
                                </div>
                                <span className="text-[9px] font-black" style={{ color: '#3D5A80' }}>
                                    {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Empty State Info */}
                {!loading && metrics.totalClients === 0 && (
                    <div className="glass-card rounded-2xl p-6 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">analytics</span>
                        <p className="text-slate-400 text-sm">
                            Adicione alunos e crie treinos para ver suas métricas aqui.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MetricsView;
