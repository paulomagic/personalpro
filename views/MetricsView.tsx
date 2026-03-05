import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../services/supabase/domains/clientsDomain';
import { supabase } from '../services/supabaseCore';
import PageHeader from '../components/PageHeader';
import { Users, Dumbbell, Activity, TrendingUp } from 'lucide-react';

interface MetricsViewProps {
    user: any;
    onBack: () => void;
}

const MetricsView: React.FC<MetricsViewProps> = ({ user, onBack }) => {
    const [activePeriod, setActivePeriod] = useState('30D');

    const emptyMetrics = useMemo(() => ({
        totalClients: 0,
        activeClients: 0,
        totalWorkouts: 0,
        avgAdherence: 0,
        weeklyLoad: [0, 0, 0, 0, 0, 0, 0]
    }), []);

    const periods = ['7D', '30D', '90D', 'Ano'];

    const { data: metrics = emptyMetrics, isLoading: loading } = useQuery({
        queryKey: ['metrics', user?.id, activePeriod, user?.isDemo],
        enabled: Boolean(user?.id),
        staleTime: 60_000,
        queryFn: async () => {
            if (!user?.id) return emptyMetrics;

            try {
                const clients = await getClients(user.id);
                const activeClients = clients.filter((c: any) => c.status === 'active').length;
                const avgAdherence = clients.length > 0
                    ? Math.round(clients.reduce((sum: number, c: any) => sum + (c.adherence || 0), 0) / clients.length)
                    : 0;

                let workoutsCount = 0;
                if (supabase) {
                    const { count } = await supabase
                        .from('workouts')
                        .select('*', { count: 'exact', head: true })
                        .eq('trainer_id', user.id);
                    workoutsCount = count || 0;
                }

                // Lightweight synthetic weekly load until appointment-derived metric is introduced.
                const weeklyLoad = [
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 60) + 20,
                    Math.floor(Math.random() * 40) + 10,
                    Math.floor(Math.random() * 30) + 10
                ];

                return {
                    totalClients: clients.length,
                    activeClients,
                    totalWorkouts: workoutsCount,
                    avgAdherence,
                    weeklyLoad
                };
            } catch (error) {
                console.error('Error fetching metrics:', error);
                return emptyMetrics;
            } finally {
                // no-op
            }
        }
    });

    const LoadingValue = () => (
        <div className="h-8 w-16 bg-slate-700/50 rounded-lg animate-pulse"></div>
    );

    return (
        <div className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20 pb-12 bg-[var(--bg-void)]">

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
                    className="flex rounded-2xl p-1 bg-[rgba(59,130,246,0.04)] border border-[rgba(59,130,246,0.08)]"
                >
                    {periods.map((period) => (
                        <button
                            key={period}
                            onClick={() => setActivePeriod(period)}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === activePeriod
                                ? 'bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] text-white shadow-[0_4px_16px_rgba(30,58,138,0.3)]'
                                : 'text-[#3D5A80]'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: Users, label: 'Alunos Ativos', value: loading ? null : metrics.activeClients, cardClassName: 'bg-[rgba(59,130,246,0.05)] border-[rgba(59,130,246,0.12)]', chipClassName: 'bg-[#3B82F614] border-[#3B82F622]', iconClassName: 'text-[#3B82F6]' },
                        { icon: Dumbbell, label: 'Treinos Criados', value: loading ? null : metrics.totalWorkouts, cardClassName: 'bg-[rgba(0,255,136,0.05)] border-[rgba(0,255,136,0.12)]', chipClassName: 'bg-[#00FF8814] border-[#00FF8822]', iconClassName: 'text-[#00FF88]' },
                        { icon: Activity, label: 'Aderência Média', value: loading ? null : `${metrics.avgAdherence}%`, cardClassName: 'bg-[rgba(255,184,0,0.05)] border-[rgba(255,184,0,0.12)]', chipClassName: 'bg-[#FFB80014] border-[#FFB80022]', iconClassName: 'text-[#FFB800]' },
                        { icon: TrendingUp, label: 'Total Alunos', value: loading ? null : metrics.totalClients, cardClassName: 'bg-[rgba(0,153,255,0.05)] border-[rgba(0,153,255,0.12)]', chipClassName: 'bg-[#0099FF14] border-[#0099FF22]', iconClassName: 'text-[#0099FF]' },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className={`p-5 rounded-2xl border ${stat.cardClassName}`}
                        >
                            <div
                                className={`size-9 rounded-xl flex items-center justify-center mb-3 border ${stat.chipClassName}`}
                            >
                                <stat.icon size={17} className={stat.iconClassName} />
                            </div>
                            {loading
                                ? <div className="h-7 w-16 rounded-lg animate-pulse bg-[rgba(255,255,255,0.05)]" />
                                : <p className="text-2xl font-black text-white tabular-nums">{stat.value}</p>
                            }
                            <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-[#3D5A80]">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Weekly Chart */}
                <div
                    className="rounded-3xl p-6 pb-8 bg-[rgba(59,130,246,0.03)] border border-[rgba(59,130,246,0.08)]"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Carga Semanal</h3>
                        <div className="size-2 rounded-full animate-pulse bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]" />
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
                                <span className="text-[9px] font-black text-[#3D5A80]">
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
