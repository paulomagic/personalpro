import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Sparkles, TrendingUp } from 'lucide-react';
import type { Client } from '../../types';

interface ProgressAnalysis {
    summary: string;
    improvements: string[];
    concerns: string[];
    recommendations: string[];
}

interface ClientProfileEvolutionTabProps {
    client: Client;
    chartMode: 'weight' | 'fat';
    setChartMode: (mode: 'weight' | 'fat') => void;
    progressAnalysis: ProgressAnalysis | null;
    loadingAnalysis: boolean;
    handleAnalyzeProgress: () => void;
    onOpenGalleryModal: () => void;
    onStartAssessment: () => void;
}

const ClientProfileEvolutionTab: React.FC<ClientProfileEvolutionTabProps> = ({
    client,
    chartMode,
    setChartMode,
    progressAnalysis,
    loadingAnalysis,
    handleAnalyzeProgress,
    onOpenGalleryModal,
    onStartAssessment
}) => {
    return (
        <motion.div
            key="evolution"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            {!progressAnalysis && client.assessments && client.assessments.length > 0 && (
                <div className="rounded-2xl p-5 bg-[rgba(59,130,246,0.04)] border border-[rgba(59,130,246,0.1)]">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-[#3B82F6]" />
                        <h3 className="font-black text-white tracking-tight">Análise de IA</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                        Clique para gerar uma análise personalizada do progresso de {client.name} com base nas avaliações.
                    </p>
                    <button
                        onClick={handleAnalyzeProgress}
                        disabled={loadingAnalysis}
                        className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--btn-primary-border)] shadow-[var(--btn-primary-shadow)] ${loadingAnalysis ? 'opacity-50' : 'opacity-100'}`}
                    >
                        {loadingAnalysis ? (
                            <>
                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analisando...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Analisar Progresso com IA
                            </>
                        )}
                    </button>
                </div>
            )}

            {progressAnalysis && (
                <div className="rounded-2xl p-5 bg-[rgba(59,130,246,0.04)] border border-[rgba(59,130,246,0.1)]">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-[#3B82F6]" />
                        <h3 className="font-black text-white tracking-tight">Análise de IA</h3>
                        <span className="px-2 py-0.5 text-[9px] font-black text-white rounded-full uppercase bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)]">Gemini</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-4">{progressAnalysis.summary}</p>

                    {progressAnalysis.improvements.length > 0 && (
                        <div className="mb-3">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">✅ Melhorias</p>
                            <ul className="space-y-1">
                                {progressAnalysis.improvements.map((item, index) => (
                                    <li key={index} className="text-xs text-slate-400 pl-3 border-l-2 border-emerald-500/30">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {progressAnalysis.concerns.length > 0 && (
                        <div className="mb-3">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">⚠️ Atenção</p>
                            <ul className="space-y-1">
                                {progressAnalysis.concerns.map((item, index) => (
                                    <li key={index} className="text-xs text-slate-400 pl-3 border-l-2 border-blue-500/30">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {progressAnalysis.recommendations.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">💡 Recomendações</p>
                            <ul className="space-y-1">
                                {progressAnalysis.recommendations.map((item, index) => (
                                    <li key={index} className="text-xs text-slate-400 pl-3 border-l-2 border-blue-500/30">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {loadingAnalysis && (
                <div className="rounded-2xl p-5 animate-pulse bg-[rgba(59,130,246,0.04)] border border-[rgba(59,130,246,0.1)]">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="animate-spin text-[#3B82F6]" />
                        <p className="text-sm text-slate-400">Analisando progresso com IA...</p>
                    </div>
                </div>
            )}

            <div className="glass-card rounded-[24px] p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-white tracking-tight">
                        Evolução de {chartMode === 'weight' ? 'Peso' : 'Gordura'}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setChartMode('weight')}
                            className={`px-3 py-1 text-[10px] font-black rounded-full uppercase transition-all ${chartMode === 'weight'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                }`}
                        >
                            Peso
                        </button>
                        <button
                            onClick={() => setChartMode('fat')}
                            className={`px-3 py-1 text-[10px] font-black rounded-full uppercase transition-all ${chartMode === 'fat'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                }`}
                        >
                            Gordura
                        </button>
                    </div>
                </div>

                {client.assessments && client.assessments.length > 0 ? (
                    <>
                        <div className="h-40 flex items-end justify-between gap-2">
                            {(() => {
                                const sortedAssessments = [...client.assessments]
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .slice(-7);
                                const values = sortedAssessments.map((assessment) =>
                                    chartMode === 'weight' ? (assessment.weight || 0) : (assessment.bodyFat || 0)
                                );
                                const minValue = Math.min(...values.filter((value) => value > 0)) * 0.9;
                                const maxValue = Math.max(...values) * 1.1;
                                const range = maxValue - minValue || 1;

                                return sortedAssessments.map((assessment, index) => {
                                    const value = chartMode === 'weight' ? (assessment.weight || 0) : (assessment.bodyFat || 0);
                                    const heightPercent = value > 0 ? ((value - minValue) / range) * 100 : 0;

                                    return (
                                        <div key={index} className="flex-1 group relative flex flex-col items-center">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(heightPercent, 5)}%` }}
                                                transition={{ delay: index * 0.1 }}
                                                className={`w-full rounded-t-lg cursor-pointer ${chartMode === 'weight'
                                                    ? 'bg-gradient-to-t from-blue-600/20 to-blue-500/80 group-hover:to-blue-400'
                                                    : 'bg-gradient-to-t from-amber-600/20 to-amber-500/80 group-hover:to-amber-400'
                                                    }`}
                                            />
                                            <div className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {value > 0 ? (
                                                    chartMode === 'weight' ? `${value} kg` : `${value}%`
                                                ) : 'N/A'}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        <div className="flex justify-between mt-4 px-1">
                            {[...client.assessments]
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .slice(-7)
                                .map((assessment, index) => (
                                    <span key={index} className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                        {new Date(assessment.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                    </span>
                                ))}
                        </div>
                    </>
                ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center">
                        <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <TrendingUp size={24} className="text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Nenhuma avaliação registrada</p>
                        <p className="text-slate-600 text-xs mt-1">Adicione avaliações para ver a evolução</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="font-black text-white tracking-tight">Galeria de Evolução</h3>
                    <button
                        onClick={onOpenGalleryModal}
                        className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                    >Ver Todas</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {client.assessments.slice(0, 3).map((assessment, index) => (
                        <div key={index} className="min-w-[120px] aspect-[3/4] rounded-2xl overflow-hidden relative glass-card p-1">
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                                <Camera size={24} className="text-slate-600" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-3">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                    {new Date(assessment.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={onStartAssessment}
                        className="min-w-[120px] aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group hover:border-blue-500/50 transition-all"
                    >
                        <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Camera size={20} className="text-blue-400" />
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nova Foto</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ClientProfileEvolutionTab;
