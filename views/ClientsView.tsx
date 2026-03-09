import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, AlertTriangle, Pause, CheckCircle, ChevronRight, User } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Client } from '../types';
import {
    getClientsPage,
    getClientCounts,
    createClient,
    DBClient,
    type ClientCountsResult
} from '../services/supabase/domains/clientsDomain';
import { uploadAvatar } from '../services/supabase/domains/storageDomain';
import AddClientModal from '../components/AddClientModal';
import { ClientCardSkeleton } from '../components/Skeleton';
import PageHeader from '../components/PageHeader';
import { createScopedLogger } from '../services/appLogger';

const clientsViewLogger = createScopedLogger('ClientsView');

const loadDemoClients = async () => {
    const { mockClients } = await import('../mocks/demoData');
    return mockClients;
};

interface ClientsViewProps {
    user: any;
    onBack: () => void;
    onSelectClient: (client: Client) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ user, onBack, onSelectClient }) => {
    const PAGE_SIZE = 24;
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'at-risk' | 'paused'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [page, setPage] = useState(0);
    const deferredSearchTerm = useDeferredValue(searchTerm);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const mapDbClients = (data: DBClient[]): Client[] => data.map(dbClient => ({
        id: dbClient.id,
        name: dbClient.name,
        avatar: dbClient.avatar_url || undefined,
        goal: dbClient.goal,
        level: dbClient.level as any,
        age: dbClient.age,
        weight: dbClient.weight,
        height: dbClient.height,
        adherence: dbClient.adherence || 0,
        lastTraining: 'Hoje',
        status: dbClient.status as any,
        startDate: dbClient.created_at,
        email: dbClient.email,
        phone: dbClient.phone,
        observations: dbClient.observations,
        injuries: dbClient.injuries,
        preferences: dbClient.preferences,
        missedClasses: [],
        assessments: [],
        paymentStatus: 'paid',
        monthly_fee: dbClient.monthly_fee,
        payment_day: dbClient.payment_day,
        payment_type: dbClient.payment_type,
        session_price: dbClient.session_price,
    }));

    useEffect(() => {
        setPage(0);
    }, [deferredSearchTerm, statusFilter]);

    const {
        data: clientsPage,
        isLoading: loading,
        isFetching,
        refetch: refetchClients
    } = useQuery<{ items: Client[]; total: number }>({
        queryKey: ['clients', user?.id, user?.isDemo, deferredSearchTerm, statusFilter, page],
        enabled: Boolean(user?.id || user?.isDemo),
        queryFn: async () => {
            if (user?.isDemo || user?.id === 'demo-user-id') {
                const demoClients = await loadDemoClients();
                const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
                const filtered = demoClients.filter((client) => {
                    const matchesSearch = !normalizedSearch || client.name.toLowerCase().includes(normalizedSearch);
                    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
                    return matchesSearch && matchesStatus;
                });

                return {
                    items: filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
                    total: filtered.length
                };
            }
            if (!user?.id) {
                return { items: [], total: 0 };
            }
            try {
                const result = await getClientsPage(user.id, {
                    limit: PAGE_SIZE,
                    offset: page * PAGE_SIZE,
                    search: deferredSearchTerm,
                    status: statusFilter === 'all' ? undefined : statusFilter,
                    includeSensitiveData: false
                });
                return {
                    items: mapDbClients(result.data),
                    total: result.total
                };
            } catch (error) {
                clientsViewLogger.error('Error loading paginated clients list', error, {
                    userId: user.id,
                    page,
                    search: deferredSearchTerm,
                    statusFilter
                });
                return { items: [], total: 0 };
            }
        }
    });

    const { data: statsData } = useQuery<ClientCountsResult>({
        queryKey: ['client-counts', user?.id, user?.isDemo],
        enabled: Boolean(user?.id || user?.isDemo),
        staleTime: 60_000,
        queryFn: async () => {
            if (user?.isDemo || user?.id === 'demo-user-id') {
                const demoClients = await loadDemoClients();
                return {
                    total: demoClients.length,
                    active: demoClients.filter((client) => client.status === 'active').length,
                    atRisk: demoClients.filter((client) => client.status === 'at-risk').length,
                    paused: demoClients.filter((client) => client.status === 'paused').length
                };
            }
            if (!user?.id) {
                return { total: 0, active: 0, atRisk: 0, paused: 0 };
            }
            return await getClientCounts(user.id);
        }
    });

    const clients = clientsPage?.items ?? [];
    const totalClients = clientsPage?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalClients / PAGE_SIZE));

    // Handle new client
    const handleAddClient = async (newClientData: Partial<Client>) => {
        if (!user?.id) {
            showToast('Usuário inválido para criar aluno', 'error');
            throw new Error('Missing user');
        }

        try {
            // Upload avatar first if exists
            let avatarUrl = newClientData.avatar;
            if ((newClientData as any).avatarFile) {
                try {
                    const uploadedUrl = await uploadAvatar((newClientData as any).avatarFile, user.id, 'new');
                    if (uploadedUrl) {
                        avatarUrl = uploadedUrl;
                    }
                } catch (e) {
                    clientsViewLogger.error('Error uploading avatar while creating client', e, { userId: user.id });
                    showToast('Não foi possível fazer upload da foto. Usando padrão.', 'error');
                }
            }

            const clientToCreate: any = {
                coach_id: user.id,
                name: newClientData.name,
                email: newClientData.email,
                phone: newClientData.phone,
                goal: 'Hipertrofia', // Default for now if missing
                level: 'Iniciante',  // Default
                status: 'active',
                adherence: 0,
                ...newClientData,
                avatar_url: avatarUrl // override avatar_url
            };

            // Remove non-DB fields and map camelCase to snake_case
            if (newClientData.birthDate) {
                clientToCreate.birth_date = newClientData.birthDate;
                delete clientToCreate.birthDate;
            }

            delete clientToCreate.missedClasses;
            delete clientToCreate.assessments;
            delete clientToCreate.startDate; // Database uses created_at
            delete clientToCreate.lastTraining;
            delete clientToCreate.avatar; // types uses avatar, db uses avatar_url
            delete clientToCreate.totalClasses;
            delete clientToCreate.completedClasses;
            delete clientToCreate.paymentStatus; // separate table usually, or keep if column exists (not in current schema)
            delete clientToCreate.id; // Supabase generates UUID automatically
            delete clientToCreate.avatarFile; // Remove file object

            // Fix: ensure paymentStatus is not sent if column doesn't exist (it doesn't in schema provided to user)
            // But types.ts has it. Schema has payments table. 
            // We should probably rely on default or separate insert. For now delete it to avoid error.
            if ('paymentStatus' in clientToCreate) delete clientToCreate.paymentStatus;

            const created = await createClient(clientToCreate);
            if (!created) {
                throw new Error('Create client failed');
            }

            await refetchClients();
            await queryClient.invalidateQueries({ queryKey: ['client-counts', user.id, user?.isDemo] });
            showToast('Aluno criado com sucesso!', 'success');
        } catch (error) {
            clientsViewLogger.error('Error creating client from view', error, { userId: user.id });
            showToast('Erro ao criar aluno. Tente novamente.', 'error');
            throw error;
        }
    };

    const stats = useMemo(() => ({
        total: statsData?.total ?? 0,
        active: statsData?.active ?? 0,
        atRisk: statsData?.atRisk ?? 0,
        paused: statsData?.paused ?? 0,
    }), [statsData]);

    // Status badge component
    const StatusBadge: React.FC<{ status: Client['status'] }> = ({ status }) => {
        const config = {
            'active': { color: 'bg-emerald-500', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]', icon: CheckCircle },
            'at-risk': { color: 'bg-blue-500', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]', icon: AlertTriangle },
            'paused': { color: 'bg-slate-500', glow: '', icon: Pause },
            'inactive': { color: 'bg-slate-400', glow: '', icon: null },
        };
        const { color, glow } = config[status] || config.inactive;

        return (
            <span className={`size-4 rounded-full border-2 border-slate-950 ${color} ${glow}`}></span>
        );
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20 pb-12 bg-[var(--bg-void)]"
        >
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down w-max max-w-[90%]">
                    <div
                        className={`px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-xl border ${toast.type === 'error'
                            ? 'bg-[rgba(255,51,102,0.12)] border-[rgba(255,51,102,0.2)]'
                            : 'bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.15)]'
                            }`}
                    >
                        <div className={`size-3 rounded-full ${toast.type === 'error' ? 'bg-[#FF3366]' : 'bg-[#3B82F6]'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* AI Header */}
            <PageHeader
                title="Alunos"
                subtitle={`Base de Elite • ${stats.total} protocolos`}
                onBack={onBack}
                accentColor="cyan"
                rightSlot={
                    <button
                        onClick={() => setShowAddModal(true)}
                        aria-label="Adicionar aluno"
                        className="size-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] shadow-[0_4px_16px_rgba(30,58,138,0.35)]"
                    >
                        <Plus size={18} color="white" />
                    </button>
                }
            />

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="px-5 grid grid-cols-4 gap-2 mb-5">
                {[
                    { tab: 'all', label: 'Total', value: stats.total, icon: Users, activeClassName: 'bg-[rgba(30,64,175,0.52)] border-[rgba(147,197,253,0.52)]', iconClassName: 'text-[#E0F2FE]', valueActiveClassName: 'text-white' },
                    { tab: 'active', label: 'Ativos', value: stats.active, icon: CheckCircle, activeClassName: 'bg-[rgba(5,150,105,0.42)] border-[rgba(110,231,183,0.5)]', iconClassName: 'text-[#D1FAE5]', valueActiveClassName: 'text-white' },
                    { tab: 'at-risk', label: 'Alerta', value: stats.atRisk, icon: AlertTriangle, activeClassName: 'bg-[rgba(180,83,9,0.46)] border-[rgba(252,211,77,0.52)]', iconClassName: 'text-[#FEF3C7]', valueActiveClassName: 'text-white' },
                    { tab: 'paused', label: 'Pausa', value: stats.paused, icon: Pause, activeClassName: 'bg-[rgba(71,85,105,0.32)] border-[rgba(148,163,184,0.4)]', iconClassName: 'text-[#E2E8F0]', valueActiveClassName: 'text-[#F8FAFC]' },
                ].map(({ tab, label, value, icon: Icon, activeClassName, iconClassName, valueActiveClassName }) => {
                    const isActive = statusFilter === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab as any)}
                            className={`rounded-2xl p-3 text-center transition-all border ${isActive
                                ? activeClassName
                                : 'bg-[rgba(15,23,42,0.92)] border-[rgba(148,163,184,0.28)]'
                                }`}
                        >
                            <Icon size={15} className={`mx-auto mb-1 ${isActive ? iconClassName : 'text-slate-300'}`} />
                            <p className={`text-base font-black ${isActive ? valueActiveClassName : 'text-white'}`}>{value}</p>
                            <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>{label}</p>
                        </button>
                    );
                })}
            </motion.div>

            {/* Search */}
            <motion.div variants={itemVariants} className="px-5 mb-5">
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A9C4E8]" />
                    <label htmlFor="clients-search" className="sr-only">Buscar aluno</label>
                    <input
                        id="clients-search"
                        type="text"
                        placeholder="Buscar aluno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-11 pr-5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-400 outline-none bg-[rgba(15,23,42,0.92)] border border-[rgba(148,163,184,0.24)]"
                    />
                </div>
            </motion.div>

            {/* Status Filter Pills (when filtering) */}
            {statusFilter !== 'all' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 mb-4"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Filtrado por:</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusFilter === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                            statusFilter === 'at-risk' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-slate-500/20 text-slate-400'
                            }`}>
                            {statusFilter === 'active' ? 'Ativos' : statusFilter === 'at-risk' ? 'Em Alerta' : 'Pausados'}
                        </span>
                        <button
                            onClick={() => setStatusFilter('all')}
                            className="text-xs text-slate-500 hover:text-white transition-colors"
                        >
                            Limpar
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Clients List */}
            <motion.div variants={itemVariants} className="px-5 space-y-2.5">
                {loading ? (
                    <div className="space-y-2.5">
                        <ClientCardSkeleton />
                        <ClientCardSkeleton />
                        <ClientCardSkeleton />
                        <ClientCardSkeleton />
                    </div>
                ) : clients.length > 0 ? (
                    <AnimatePresence>
                        {clients.map((client, index) => (
                            <motion.button
                                key={client.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => onSelectClient(client)}
                                className="w-full rounded-2xl p-4 flex items-center gap-3.5 active:scale-[0.99] transition-all group text-left bg-[rgba(15,23,42,0.92)] border border-[rgba(96,165,250,0.18)]"
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    {client.avatar ? (
                                        <img
                                            className="w-[52px] h-[52px] rounded-2xl object-cover border-[1.5px] border-[rgba(59,130,246,0.1)]"
                                            src={client.avatar}
                                            alt={client.name}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-[52px] h-[52px] rounded-2xl bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.1)]">
                                            <User size={20} className="text-[#A9C4E8]" />
                                        </div>
                                    )}
                                    <StatusBadge status={client.status} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-black text-white text-sm tracking-tight truncate">{client.name}</h4>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 bg-[rgba(30,64,175,0.32)] text-slate-100">{client.level}</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-wider truncate mb-1.5 text-slate-300">{client.goal}</p>
                                    {/* Progress */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 flex-1 rounded-full overflow-hidden bg-[rgba(59,130,246,0.06)] max-w-20">
                                            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="h-full w-full rounded-full">
                                                <defs>
                                                    <linearGradient id={`client-adherence-${client.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#0099FF" />
                                                        <stop offset="100%" stopColor="#00FF88" />
                                                    </linearGradient>
                                                </defs>
                                                <rect
                                                    x="0"
                                                    y="0"
                                                    width={client.adherence}
                                                    height="4"
                                                    rx="2"
                                                    fill={client.adherence < 50 ? '#FFB800' : `url(#client-adherence-${client.id})`}
                                                />
                                            </svg>
                                        </div>
                                        <span className={`text-[10px] font-black ${client.adherence < 50 ? 'text-amber-300' : 'text-emerald-300'}`}>{client.adherence}%</span>
                                    </div>
                                </div>

                                <ChevronRight size={13} className="shrink-0 text-[#A9C4E8]" />
                            </motion.button>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="py-12 text-center text-slate-600">
                        <div className="size-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <Users size={32} className="text-slate-600" />
                        </div>
                        <p className="font-bold text-sm mb-2">Nenhum aluno encontrado</p>
                        <p className="text-xs text-slate-500 mb-6">
                            {searchTerm ? 'Tente outra busca' : 'Comece adicionando seu primeiro protocolo de elite'}
                        </p>

                        <div className="flex flex-col gap-3 items-center">
                            {!searchTerm && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-6 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-glow active:scale-95 transition-all w-full max-w-[200px]"
                                >
                                    Adicionar Aluno
                                </button>
                            )}

                        </div>
                    </div>
                )}
            </motion.div>

            {!loading && totalClients > PAGE_SIZE && (
                <motion.div variants={itemVariants} className="px-5 mt-5">
                    <div className="rounded-2xl border border-[rgba(96,165,250,0.18)] bg-[rgba(15,23,42,0.92)] px-4 py-3 flex items-center justify-between gap-3">
                        <button
                            onClick={() => setPage((current) => Math.max(0, current - 1))}
                            disabled={page === 0 || isFetching}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed bg-[rgba(59,130,246,0.12)] text-white"
                        >
                            Anterior
                        </button>
                        <div className="text-center min-w-0">
                            <p className="text-xs font-black uppercase tracking-widest text-white">
                                Página {page + 1} de {totalPages}
                            </p>
                            <p className="text-[10px] font-bold text-slate-300">
                                {totalClients} alunos no total
                            </p>
                        </div>
                        <button
                            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                            disabled={page >= totalPages - 1 || isFetching}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed bg-[rgba(59,130,246,0.12)] text-white"
                        >
                            Próxima
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Add Client Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddClientModal
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onSave={handleAddClient}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ClientsView;
