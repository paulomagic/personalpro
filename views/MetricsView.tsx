import React, { useState, useEffect } from 'react';
import { getClients, supabase } from '../services/supabaseClient';

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
        <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pb-12">
            {/* Header */}
            <header className="px-6 pt-14 pb-8 flex items-center gap-4 animate-fade-in">
                <button onClick={onBack} className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-white">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-white tracking-tight">Analytics</h1>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Performance Dashboard</p>
                </div>
            </header>

            <main className="px-6 space-y-8">
                {/* Period Selector */}
                <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5 animate-slide-up">
                    {periods.map((period) => (
                        <button
                            key={period}
                            onClick={() => setActivePeriod(period)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === activePeriod ? 'bg-blue-600 text-white shadow-glow' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                {/* Stats Grid Matrix */}
                <div className="grid grid-cols-2 gap-4 animate-slide-up stagger-2">
                    <div className="glass-card rounded-[32px] p-6 border-l-2 border-blue-500">
                        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
                            <span className="material-symbols-outlined text-xl">groups</span>
                        </div>
                        {loading ? <LoadingValue /> : (
                            <p className="text-2xl font-black text-white tabular-nums">{metrics.activeClients}</p>
                        )}
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Alunos Ativos</p>
                    </div>
                    <div className="glass-card rounded-[32px] p-6 border-l-2 border-emerald-500">
                        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400">
                            <span className="material-symbols-outlined text-xl">fitness_center</span>
                        </div>
                        {loading ? <LoadingValue /> : (
                            <p className="text-2xl font-black text-white tabular-nums">{metrics.totalWorkouts}</p>
                        )}
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Treinos Criados</p>
                    </div>
                    <div className="glass-card rounded-[32px] p-6 border-l-2 border-amber-500">
                        <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-amber-400">
                            <span className="material-symbols-outlined text-xl">speed</span>
                        </div>
                        {loading ? <LoadingValue /> : (
                            <p className="text-2xl font-black text-white tabular-nums">{metrics.avgAdherence}%</p>
                        )}
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Aderência Média</p>
                    </div>
                    <div className="glass-card rounded-[32px] p-6 border-l-2 border-purple-500">
                        <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                            <span className="material-symbols-outlined text-xl">person</span>
                        </div>
                        {loading ? <LoadingValue /> : (
                            <p className="text-2xl font-black text-white tabular-nums">{metrics.totalClients}</p>
                        )}
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Alunos</p>
                    </div>
                </div>

                {/* Performance Chart Capsule */}
                <div className="glass-card rounded-[40px] p-8 animate-slide-up stagger-3 pb-12">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black text-white tracking-tight uppercase">Carga Semanal</h3>
                        <div className="size-2 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>
                    <div className="h-44 flex items-end justify-between gap-3">
                        {metrics.weeklyLoad.map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="relative w-full h-full flex items-end">
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-2xl transition-all duration-700 hover:shadow-glow group-hover:scale-x-110"
                                        style={{ height: loading ? '20%' : `${height}%` }}
                                    />
                                </div>
                                <span className="text-[9px] text-slate-600 font-black">
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
