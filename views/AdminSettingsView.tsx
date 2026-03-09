import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Settings,
    Shield,
    Bell,
    Database,
    Brain,
    Activity,
    TimerReset,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { createScopedLogger } from '../services/appLogger';
import { getAIMetrics, getSystemMetrics } from '../services/loggingService';
import { CURRENT_PRIVACY_POLICY_VERSION } from '../services/privacyService';
import {
    completeAdminDeletePrivacyRequest,
    listAdminPrivacyRequests,
    type AdminPrivacyRequestSummary
} from '../services/adminPrivacyRequestsService';

interface AdminSettingsViewProps {
    onBack: () => void;
}

interface AdminSettingsMetrics {
    aiMetrics: Awaited<ReturnType<typeof getAIMetrics>> | null;
    systemMetrics: Awaited<ReturnType<typeof getSystemMetrics>> | null;
}

const adminSettingsLogger = createScopedLogger('AdminSettingsView');

function formatDateTime(value?: string | null): string {
    if (!value) return 'sem registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'inválido';
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function privacyRequestLabel(request: AdminPrivacyRequestSummary): string {
    if (request.request_type === 'delete') return 'Exclusão';
    if (request.request_type === 'export') return 'Exportação';
    if (request.request_type === 'rectify') return 'Retificação';
    return 'Acesso';
}

function privacyStatusTone(status: AdminPrivacyRequestSummary['status']): string {
    if (status === 'completed') return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20';
    if (status === 'cancelled') return 'bg-slate-700/60 text-slate-200 border-white/10';
    if (status === 'rejected') return 'bg-rose-500/15 text-rose-200 border-rose-500/20';
    if (status === 'in_review') return 'bg-amber-500/15 text-amber-100 border-amber-500/20';
    return 'bg-blue-500/15 text-blue-100 border-blue-500/20';
}

const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onBack }) => {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<AdminSettingsMetrics>({
        aiMetrics: null,
        systemMetrics: null
    });
    const [privacyFeedback, setPrivacyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchMetrics = async () => {
            setLoading(true);
            try {
                const [aiMetrics, systemMetrics] = await Promise.all([
                    getAIMetrics(),
                    getSystemMetrics()
                ]);

                if (!cancelled) {
                    setMetrics({ aiMetrics, systemMetrics });
                }
            } catch (error) {
                adminSettingsLogger.error('Error loading admin settings metrics', error);
                if (!cancelled) {
                    setMetrics({ aiMetrics: null, systemMetrics: null });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void fetchMetrics();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!privacyFeedback) return;
        const timeout = window.setTimeout(() => setPrivacyFeedback(null), 3200);
        return () => window.clearTimeout(timeout);
    }, [privacyFeedback]);

    const privacyRequestsQuery = useQuery({
        queryKey: ['admin-privacy-requests'],
        queryFn: () => listAdminPrivacyRequests(12),
        staleTime: 30_000
    });

    const completeDeleteMutation = useMutation({
        mutationFn: (requestId: string) => completeAdminDeletePrivacyRequest(requestId),
        onSuccess: async () => {
            setPrivacyFeedback({ type: 'success', message: 'Exclusão LGPD concluída com sucesso.' });
            await queryClient.invalidateQueries({ queryKey: ['admin-privacy-requests'] });
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Falha ao concluir exclusão LGPD.';
            setPrivacyFeedback({ type: 'error', message });
            adminSettingsLogger.error('Error completing admin privacy delete request', error);
        }
    });

    const aiMetrics = metrics.aiMetrics;
    const systemMetrics = metrics.systemMetrics;
    const providerHealth = aiMetrics?.providerHealth;
    const privacyRequests = privacyRequestsQuery.data?.requests || [];
    const openDeleteRequests = privacyRequestsQuery.data?.openDeleteRequests || 0;
    const providerHealthTone = providerHealth?.status === 'critical'
        ? 'text-rose-300 bg-rose-500/10 border-rose-500/20'
        : providerHealth?.status === 'warning'
            ? 'text-amber-200 bg-amber-500/10 border-amber-500/20'
            : 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20';

    const topCards = useMemo(() => ([
        {
            label: 'Sucesso IA',
            value: loading ? '...' : `${aiMetrics?.successRate || 0}%`,
            tone: 'text-emerald-300',
            icon: CheckCircle2
        },
        {
            label: 'Latência Média',
            value: loading ? '...' : `${aiMetrics?.avgLatency || 0} ms`,
            tone: 'text-blue-300',
            icon: TimerReset
        },
        {
            label: 'Atividade Hoje',
            value: loading ? '...' : String(systemMetrics?.activityToday || 0),
            tone: 'text-cyan-300',
            icon: Activity
        },
        {
            label: 'Clientes Ativos no BD',
            value: loading ? '...' : String(systemMetrics?.totalClients || 0),
            tone: 'text-violet-300',
            icon: Database
        }
    ]), [aiMetrics?.avgLatency, aiMetrics?.successRate, loading, systemMetrics?.activityToday, systemMetrics?.totalClients]);

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        aria-label="Voltar para área admin"
                        className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Settings size={20} className="text-slate-300" />
                            Configurações Operacionais
                        </h1>
                        <p className="text-xs text-slate-500">Status real de IA, auditoria e base de dados</p>
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-6">
                {privacyFeedback && (
                    <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        privacyFeedback.type === 'success'
                            ? 'bg-emerald-500/12 border-emerald-500/20 text-emerald-200'
                            : 'bg-rose-500/12 border-rose-500/20 text-rose-200'
                    }`}>
                        {privacyFeedback.message}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {topCards.map((card, index) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card rounded-2xl p-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <card.icon size={16} className={card.tone} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.label}</span>
                            </div>
                            <p className={`text-2xl font-black ${card.tone}`}>{card.value}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Brain size={20} className="text-purple-300" />
                        </div>
                        <div>
                            <h2 className="font-bold">Operação de IA</h2>
                            <p className="text-xs text-slate-500">Métricas atuais, sem placeholder</p>
                        </div>
                    </div>

                    <div className={`rounded-2xl border px-4 py-3 ${providerHealthTone}`}>
                        <p className="text-xs font-black uppercase tracking-widest">Saúde do provider</p>
                        <p className="mt-1 text-sm font-semibold">
                            {loading ? 'Carregando...' : (providerHealth?.reason || 'Sem dados recentes.')}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Requisições hoje</span>
                            <span className="text-sm font-semibold text-white">{loading ? '...' : aiMetrics?.todayLogs || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Tokens hoje</span>
                            <span className="text-sm font-semibold text-white">{loading ? '...' : (aiMetrics?.todayTokens || 0).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Fallback local</span>
                            <span className="text-sm font-semibold text-white">{loading ? '...' : `${aiMetrics?.productMetrics?.localFallbackRate || 0}%`}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-slate-400">Último sucesso Groq</span>
                            <span className="text-xs text-slate-200 text-right max-w-[50%]">{loading ? '...' : formatDateTime(providerHealth?.lastGroqSuccessAt)}</span>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="glass-card rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Database size={20} className="text-emerald-300" />
                        </div>
                        <div>
                            <h2 className="font-bold">Banco e Auditoria</h2>
                            <p className="text-xs text-slate-500">Contadores reais do ambiente</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Clientes cadastrados</span>
                            <span className="text-sm font-semibold text-white">{loading ? '...' : systemMetrics?.totalClients || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Treinos salvos</span>
                            <span className="text-sm font-semibold text-white">{loading ? '...' : systemMetrics?.totalWorkouts || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Eventos de atividade hoje</span>
                            <span className="text-sm font-semibold text-white">{loading ? '...' : systemMetrics?.activityToday || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-slate-400">Logs de IA acumulados</span>
                            <span className="text-sm font-semibold text-white">{loading ? '...' : aiMetrics?.totalLogs || 0}</span>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Shield size={20} className="text-blue-300" />
                        </div>
                        <div>
                            <h2 className="font-bold">Governança Operacional</h2>
                            <p className="text-xs text-slate-500">Controles e política vigente</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Política de privacidade</span>
                            <span className="text-sm font-semibold text-white">v{CURRENT_PRIVACY_POLICY_VERSION}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Feedback IA coletado</span>
                            <span className="text-sm font-semibold text-white">{loading ? '...' : aiMetrics?.aiFeedback?.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Precisão de progressão</span>
                            <span className="text-sm font-semibold text-white">{loading ? '...' : `${aiMetrics?.progressionPrecision?.avgScore || 0}/100`}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-slate-400">Alertas operacionais</span>
                            <span className={`inline-flex items-center gap-2 text-xs font-semibold ${
                                providerHealth?.status === 'critical'
                                    ? 'text-rose-300'
                                    : providerHealth?.status === 'warning'
                                        ? 'text-amber-200'
                                        : 'text-emerald-300'
                            }`}>
                                {providerHealth?.status === 'critical' ? <AlertTriangle size={14} /> : <Bell size={14} />}
                                {loading ? 'Carregando...' : providerHealth?.status === 'critical' ? 'Ação imediata' : providerHealth?.status === 'warning' ? 'Monitorar' : 'Estável'}
                            </span>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="glass-card rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                                <Shield size={20} className="text-teal-200" />
                            </div>
                            <div>
                                <h2 className="font-bold">Solicitações LGPD</h2>
                                <p className="text-xs text-slate-500">Fila administrativa real</p>
                            </div>
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                            {privacyRequestsQuery.isLoading ? '...' : `${openDeleteRequests} exclusão(ões) abertas`}
                        </span>
                    </div>

                    {privacyRequestsQuery.isLoading ? (
                        <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-5 text-sm text-slate-400">
                            Carregando solicitações LGPD...
                        </div>
                    ) : privacyRequests.length === 0 ? (
                        <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-5 text-sm text-slate-400">
                            Nenhuma solicitação recente encontrada.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {privacyRequests.map((request) => (
                                <div key={request.id} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-bold text-white">{privacyRequestLabel(request)}</p>
                                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${privacyStatusTone(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-300 truncate">
                                                {request.requester_name || 'Usuário sem nome'}{request.requester_email ? ` · ${request.requester_email}` : ''}
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                Criada em {formatDateTime(request.created_at)}
                                            </p>
                                            {request.notes && (
                                                <p className="mt-2 text-xs text-slate-400">{request.notes}</p>
                                            )}
                                        </div>

                                        {request.request_type === 'delete' && (request.status === 'open' || request.status === 'in_review') && (
                                            <button
                                                type="button"
                                                onClick={() => completeDeleteMutation.mutate(request.id)}
                                                disabled={completeDeleteMutation.isPending}
                                                className="shrink-0 rounded-xl bg-rose-500/15 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-rose-100 border border-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Concluir exclusão
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.section>
            </main>
        </div>
    );
};

export default AdminSettingsView;
