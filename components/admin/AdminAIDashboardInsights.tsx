import React from 'react';
import { motion } from 'framer-motion';
import { getAIMetrics } from '../../services/loggingService';

type AdminAIMetrics = Awaited<ReturnType<typeof getAIMetrics>>;

interface AdminAIDashboardInsightsProps {
    metrics?: AdminAIMetrics;
    formatNumber: (value: number) => string;
    formatUserLabel: (value?: string | null) => string;
}

export function AdminAIDashboardInsights({
    metrics,
    formatNumber,
    formatUserLabel
}: AdminAIDashboardInsightsProps) {
    return (
        <>
            {metrics?.productMetrics && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.37 }}
                    className="glass-card rounded-2xl p-4 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Métricas de Produto ({metrics.productMetrics.windowDays} dias)</span>
                        <span className="text-xs text-slate-400">{metrics.productMetrics.tta?.samples || 0} amostras TTA</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <p className="text-xl font-black text-cyan-300">
                                {metrics.productMetrics.tta?.avgSeconds || 0}s
                            </p>
                            <p className="text-[10px] text-slate-500">TTA médio</p>
                        </div>
                        <div>
                            <p className="text-xl font-black text-cyan-100">
                                p50 {metrics.productMetrics.tta?.p50Seconds || 0}s
                            </p>
                            <p className="text-[10px] text-slate-500">TTA mediano</p>
                        </div>
                        <div>
                            <p className={`text-xl font-black ${(metrics.productMetrics.workoutCompletionRate || 0) >= 60 ? 'text-emerald-400' : (metrics.productMetrics.workoutCompletionRate || 0) >= 40 ? 'text-amber-300' : 'text-red-400'}`}>
                                {metrics.productMetrics.workoutCompletionRate || 0}%
                            </p>
                            <p className="text-[10px] text-slate-500">Conclusão de treino</p>
                        </div>
                        <div>
                            <p className={`text-xl font-black ${(metrics.productMetrics.localFallbackRate || 0) <= 25 ? 'text-emerald-400' : (metrics.productMetrics.localFallbackRate || 0) <= 45 ? 'text-amber-300' : 'text-red-400'}`}>
                                {metrics.productMetrics.localFallbackRate || 0}%
                            </p>
                            <p className="text-[10px] text-slate-500">Fallback local IA</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg border border-white/5 p-2 bg-white/[0.02]">
                            <p className="text-slate-400">Conversão geração</p>
                            <p className="font-black text-white">{metrics.productMetrics.generationConversionRate || 0}%</p>
                        </div>
                        <div className="rounded-lg border border-white/5 p-2 bg-white/[0.02]">
                            <p className="text-slate-400">Conversão salvar treino</p>
                            <p className="font-black text-white">{metrics.productMetrics.saveConversionRate || 0}%</p>
                        </div>
                    </div>
                </motion.div>
            )}

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

            {metrics?.progressionPrecision && metrics.progressionPrecision.total > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.39 }}
                    className="glass-card rounded-2xl p-4 border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Precisão Progressão IA (7 dias)</span>
                        <span className="text-xs text-slate-400">{metrics.progressionPrecision.total} amostras</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                            <p className="text-xl font-black text-blue-300">{metrics.progressionPrecision.avgScore || 0}</p>
                            <p className="text-[10px] text-slate-500">score médio</p>
                        </div>
                        <div>
                            <p className="text-xl font-black text-emerald-400">{metrics.progressionPrecision.hitRate || 0}%</p>
                            <p className="text-[10px] text-slate-500">meta atingida</p>
                        </div>
                        <div>
                            <p className="text-xl font-black text-white">{metrics.progressionPrecision.avgConfidence || 0}</p>
                            <p className="text-[10px] text-slate-500">confiança</p>
                        </div>
                    </div>
                    {metrics.progressionPrecision.bySegment && Object.keys(metrics.progressionPrecision.bySegment).length > 0 && (
                        <div className="space-y-2">
                            {Object.entries(metrics.progressionPrecision.bySegment)
                                .sort(([, a], [, b]) => ((b as any).total || 0) - ((a as any).total || 0))
                                .map(([segment, data]) => {
                                    const typedData = data as { avgScore: number; hitRate: number; total: number };
                                    return (
                                        <div key={segment} className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400">{segment.replace(/_/g, ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-blue-300 font-bold">score {typedData.avgScore}</span>
                                                <span className={`font-bold ${typedData.hitRate >= 70 ? 'text-emerald-400' : typedData.hitRate >= 40 ? 'text-amber-300' : 'text-red-400'}`}>
                                                    {typedData.hitRate}%
                                                </span>
                                                <span className="text-slate-500">({typedData.total})</span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </motion.div>
            )}

            {metrics?.usageByUser && metrics.usageByUser.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.395 }}
                    className="glass-card rounded-2xl p-4 border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Consumo IA por usuário (30 dias)</span>
                        <span className="text-xs text-slate-400">{metrics.usageByUser.length} usuários</span>
                    </div>
                    <div className="space-y-2">
                        {metrics.usageByUser.map((row) => (
                            <div key={row.user_id || 'anonymous'} className="flex items-center justify-between text-xs border border-white/5 rounded-lg px-3 py-2">
                                <span className="text-slate-300 font-mono">{formatUserLabel(row.user_id)}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-blue-300 font-bold">{formatNumber(row.total_tokens || 0)} tok</span>
                                    <span className="text-slate-400">{row.total_requests || 0} req</span>
                                    <span className={`${(row.success_rate || 0) >= 70 ? 'text-emerald-400' : (row.success_rate || 0) >= 40 ? 'text-amber-300' : 'text-red-400'} font-bold`}>
                                        {Math.round(row.success_rate || 0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </>
    );
}
