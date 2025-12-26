
import React from 'react';

interface MetricsViewProps {
    onBack: () => void;
}

const MetricsView: React.FC<MetricsViewProps> = ({ onBack }) => {
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
                    {['7D', '30D', '90D', 'Ano'].map((period, i) => (
                        <button
                            key={period}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 1 ? 'bg-blue-600 text-white shadow-glow' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                {/* Revenue Card Hero */}
                <div className="glass-card rounded-[40px] p-8 text-center shadow-glow relative overflow-hidden group animate-slide-up stagger-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Faturamento Bruto</p>
                    <h2 className="text-5xl font-black text-white leading-none tracking-tighter mb-4 tabular-nums">
                        R$ 12.450
                    </h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">+12% vs anterior</span>
                    </div>
                </div>

                {/* Stats Grid Matrix */}
                <div className="grid grid-cols-2 gap-4 animate-slide-up stagger-2">
                    <div className="glass-card rounded-[32px] p-6 border-l-2 border-blue-500">
                        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
                            <span className="material-symbols-outlined text-xl">groups</span>
                        </div>
                        <p className="text-2xl font-black text-white tabular-nums">15</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Alunos Ativos</p>
                    </div>
                    <div className="glass-card rounded-[32px] p-6 border-l-2 border-emerald-500">
                        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400">
                            <span className="material-symbols-outlined text-xl">fitness_center</span>
                        </div>
                        <p className="text-2xl font-black text-white tabular-nums">156</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Treinos/Mês</p>
                    </div>
                    <div className="glass-card rounded-[32px] p-6 border-l-2 border-amber-500">
                        <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-amber-400">
                            <span className="material-symbols-outlined text-xl">speed</span>
                        </div>
                        <p className="text-2xl font-black text-white tabular-nums">78%</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Aderência</p>
                    </div>
                    <div className="glass-card rounded-[32px] p-6 border-l-2 border-purple-500">
                        <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                            <span className="material-symbols-outlined text-xl">star</span>
                        </div>
                        <p className="text-2xl font-black text-white tabular-nums">4.9</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rating VIP</p>
                    </div>
                </div>

                {/* Performance Chart Capsule */}
                <div className="glass-card rounded-[40px] p-8 animate-slide-up stagger-3 pb-12">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black text-white tracking-tight uppercase tracking-widest">Carga de Trabalho</h3>
                        <div className="size-2 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>
                    <div className="h-44 flex items-end justify-between gap-3">
                        {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="relative w-full h-full flex items-end">
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-2xl transition-all duration-700 hover:shadow-glow group-hover:scale-x-110"
                                        style={{ height: `${height}%` }}
                                    />
                                </div>
                                <span className="text-[9px] text-slate-600 font-black">
                                    {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MetricsView;
