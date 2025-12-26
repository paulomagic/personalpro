
import React from 'react';

interface MetricsViewProps {
    onBack: () => void;
}

const MetricsView: React.FC<MetricsViewProps> = ({ onBack }) => {
    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-8">
            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 z-30">
                <button onClick={onBack} className="size-10 rounded-full bg-slate-50 flex items-center justify-center active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-slate-900">Métricas</h1>
            </header>

            <main className="p-6 space-y-6">
                {/* Period Selector */}
                <div className="flex gap-2">
                    {['7D', '30D', '90D', 'Ano'].map((period, i) => (
                        <button
                            key={period}
                            className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${i === 1 ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-100'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[24px] p-6 text-white">
                    <p className="text-emerald-100 text-sm font-medium mb-1">Receita Mensal</p>
                    <h2 className="text-4xl font-bold mb-2">R$ 12.450</h2>
                    <div className="flex items-center gap-1 text-emerald-100">
                        <span className="material-symbols-outlined text-lg">trending_up</span>
                        <span className="text-sm font-medium">+12% vs mês anterior</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-[20px] p-5 border border-slate-100">
                        <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-blue-600">groups</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">15</p>
                        <p className="text-xs text-slate-400">Alunos Ativos</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-5 border border-slate-100">
                        <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-emerald-600">fitness_center</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">156</p>
                        <p className="text-xs text-slate-400">Treinos no Mês</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-5 border border-slate-100">
                        <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-amber-600">speed</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">78%</p>
                        <p className="text-xs text-slate-400">Taxa de Aderência</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-5 border border-slate-100">
                        <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-purple-600">star</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">4.9</p>
                        <p className="text-xs text-slate-400">Avaliação Média</p>
                    </div>
                </div>

                {/* Chart Placeholder */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4">Treinos por Semana</h3>
                    <div className="h-40 flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-blue-500 rounded-t-lg transition-all"
                                    style={{ height: `${height}%` }}
                                />
                                <span className="text-[10px] text-slate-400 font-medium">
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
