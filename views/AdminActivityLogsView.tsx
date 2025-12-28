import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, RefreshCw, User, FileText, Calendar, Dumbbell } from 'lucide-react';
import { getActivityLogs } from '../services/loggingService';

interface AdminActivityLogsViewProps {
    onBack: () => void;
}

const AdminActivityLogsView: React.FC<AdminActivityLogsViewProps> = ({ onBack }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 30;

    useEffect(() => {
        fetchLogs();
    }, [offset]);

    const fetchLogs = async () => {
        setLoading(true);
        const result = await getActivityLogs({ limit, offset });
        setLogs(result.logs);
        setTotal(result.total);
        setLoading(false);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionIcon = (action: string) => {
        if (action.includes('login') || action.includes('logout')) return User;
        if (action.includes('workout')) return Dumbbell;
        if (action.includes('client')) return User;
        if (action.includes('assessment')) return FileText;
        return Activity;
    };

    const getActionColor = (action: string) => {
        if (action.includes('login')) return 'emerald';
        if (action.includes('logout')) return 'slate';
        if (action.includes('create')) return 'blue';
        if (action.includes('update')) return 'amber';
        if (action.includes('delete')) return 'red';
        return 'purple';
    };

    const actionLabels: Record<string, string> = {
        login: 'Login',
        logout: 'Logout',
        create_workout: 'Criou Treino',
        save_workout: 'Salvou Treino',
        create_client: 'Adicionou Cliente',
        update_client: 'Editou Cliente',
        create_assessment: 'Nova Avaliação',
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
                                <Activity size={20} className="text-emerald-400" />
                                Logs de Atividade
                            </h1>
                            <p className="text-xs text-slate-500">{total} ações registradas</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Timeline */}
            <main className="px-6 py-4">
                {loading && logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Carregando...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Activity size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Nenhuma atividade registrada</p>
                        <p className="text-xs mt-1">As ações aparecerão aqui</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />

                        <div className="space-y-4">
                            {logs.map((log, idx) => {
                                const Icon = getActionIcon(log.action);
                                const color = getActionColor(log.action);

                                return (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="flex gap-4 relative"
                                    >
                                        {/* Icon */}
                                        <div className={`size-8 rounded-full bg-${color}-500/20 flex items-center justify-center z-10 flex-shrink-0`}>
                                            <Icon size={14} className={`text-${color}-400`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 glass-card rounded-xl p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-sm">{actionLabels[log.action] || log.action}</p>
                                                    {log.resource_type && (
                                                        <p className="text-xs text-slate-500">
                                                            {log.resource_type} {log.resource_id && `#${log.resource_id.substring(0, 8)}`}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </div>

                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-white/5">
                                                    <pre className="text-[10px] text-slate-400">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {total > limit && (
                    <div className="flex justify-center gap-2 pt-6">
                        <button
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0}
                            className="px-4 py-2 glass-card rounded-lg text-sm disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-500">
                            {offset + 1} - {Math.min(offset + limit, total)} de {total}
                        </span>
                        <button
                            onClick={() => setOffset(offset + limit)}
                            disabled={offset + limit >= total}
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

export default AdminActivityLogsView;
