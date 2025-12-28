import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Filter, RefreshCw, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getAILogs, AILogFilters } from '../services/loggingService';

interface AdminAILogsViewProps {
    onBack: () => void;
}

const AdminAILogsView: React.FC<AdminAILogsViewProps> = ({ onBack }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filters, setFilters] = useState<AILogFilters>({
        limit: 20,
        offset: 0
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        const result = await getAILogs(filters);
        setLogs(result.logs);
        setTotal(result.total);
        setLoading(false);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const actionLabels: Record<string, string> = {
        generate_workout: 'Gerar Treino',
        refine: 'Refinar Treino',
        regenerate_exercise: 'Regenerar Exercício',
        insight: 'Insight de Aluno',
        message_template: 'Template de Mensagem',
        analyze_progress: 'Analisar Progresso'
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Brain size={20} className="text-purple-400" />
                                Logs de IA
                            </h1>
                            <p className="text-xs text-slate-500">{total} registros</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`size-10 rounded-full glass-card flex items-center justify-center transition-colors ${showFilters ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/10'}`}
                        >
                            <Filter size={18} />
                        </button>
                        <button
                            onClick={fetchLogs}
                            className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-white/5"
                    >
                        <div className="px-6 py-4 space-y-3">
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    value={filters.actionType || ''}
                                    onChange={(e) => setFilters({ ...filters, actionType: e.target.value || undefined, offset: 0 })}
                                    className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Todos os tipos</option>
                                    <option value="generate_workout">Gerar Treino</option>
                                    <option value="refine">Refinar</option>
                                    <option value="regenerate_exercise">Regenerar Exercício</option>
                                    <option value="insight">Insight</option>
                                    <option value="analyze_progress">Analisar Progresso</option>
                                </select>
                                <select
                                    value={filters.success === undefined ? '' : String(filters.success)}
                                    onChange={(e) => setFilters({ ...filters, success: e.target.value === '' ? undefined : e.target.value === 'true', offset: 0 })}
                                    className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Todos</option>
                                    <option value="true">✓ Sucesso</option>
                                    <option value="false">✗ Erro</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logs List */}
            <main className="px-6 py-4 space-y-3">
                {loading && logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Carregando...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Nenhum log encontrado</div>
                ) : (
                    logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-xl overflow-hidden"
                        >
                            {/* Log Header */}
                            <button
                                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`size-8 rounded-lg flex items-center justify-center ${log.success ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                        {log.success ? <CheckCircle size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{actionLabels[log.action_type] || log.action_type}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{formatDate(log.created_at)}</span>
                                            <span>•</span>
                                            <span className="text-purple-400">{log.model_used}</span>
                                            {log.latency_ms && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {log.latency_ms}ms
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {expandedId === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {expandedId === log.id && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden border-t border-white/5"
                                    >
                                        <div className="p-4 space-y-4 bg-slate-900/50">
                                            {/* Prompt */}
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Prompt</p>
                                                <pre className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-lg overflow-x-auto max-h-40 whitespace-pre-wrap">
                                                    {log.prompt || 'N/A'}
                                                </pre>
                                            </div>

                                            {/* Response */}
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resposta</p>
                                                <pre className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-lg overflow-x-auto max-h-40 whitespace-pre-wrap">
                                                    {log.response || log.error_message || 'N/A'}
                                                </pre>
                                            </div>

                                            {/* Metadata */}
                                            {log.metadata && (
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Metadata</p>
                                                    <pre className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-lg overflow-x-auto">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Stats */}
                                            <div className="flex gap-4 text-xs">
                                                {log.tokens_input && (
                                                    <div>
                                                        <span className="text-slate-500">Tokens In:</span>
                                                        <span className="ml-1 text-white font-bold">{log.tokens_input}</span>
                                                    </div>
                                                )}
                                                {log.tokens_output && (
                                                    <div>
                                                        <span className="text-slate-500">Tokens Out:</span>
                                                        <span className="ml-1 text-white font-bold">{log.tokens_output}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}

                {/* Pagination */}
                {total > (filters.limit || 20) && (
                    <div className="flex justify-center gap-2 pt-4">
                        <button
                            onClick={() => setFilters({ ...filters, offset: Math.max(0, (filters.offset || 0) - (filters.limit || 20)) })}
                            disabled={!filters.offset}
                            className="px-4 py-2 glass-card rounded-lg text-sm disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setFilters({ ...filters, offset: (filters.offset || 0) + (filters.limit || 20) })}
                            disabled={(filters.offset || 0) + (filters.limit || 20) >= total}
                            className="px-4 py-2 glass-card rounded-lg text-sm disabled:opacity-50"
                        >
                            Próximo
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminAILogsView;
