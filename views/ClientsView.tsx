import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, AlertTriangle, Pause, CheckCircle, ChevronRight, User } from 'lucide-react';
import { Client } from '../types';
import { getClients, createClient, DBClient, uploadAvatar } from '../services/supabaseClient';
import { mockClients } from '../mocks/demoData';
import AddClientModal from '../components/AddClientModal';
import { ClientCardSkeleton } from '../components/Skeleton';
import PageHeader from '../components/PageHeader';

interface ClientsViewProps {
    user: any;
    onBack: () => void;
    onSelectClient: (client: Client) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ user, onBack, onSelectClient }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'at-risk' | 'paused'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch clients from Supabase
    const fetchClients = async () => {
        setLoading(true);
        if (user?.isDemo || user?.id === 'demo-user-id') {
            setClients(mockClients);
            setLoading(false);
            return;
        }

        if (!user?.id) {
            setLoading(false);
            return;
        }
        try {
            const data = await getClients(user.id);
            // Map DBClient to Client type
            const mappedClients: Client[] = data.map(dbClient => ({
                id: dbClient.id,
                name: dbClient.name,
                avatar: dbClient.avatar_url || undefined,
                goal: dbClient.goal,
                level: dbClient.level as any,
                age: dbClient.age,  // ✅ Incluído
                weight: dbClient.weight,  // ✅ Incluído
                height: dbClient.height,  // ✅ Incluído
                adherence: dbClient.adherence || 0,
                lastTraining: 'Hoje', // Placeholder for now
                status: dbClient.status as any,
                startDate: dbClient.created_at, // Map created_at to startDate
                email: dbClient.email,
                phone: dbClient.phone,
                observations: dbClient.observations,
                injuries: dbClient.injuries,  // ✅ Incluído
                preferences: dbClient.preferences,  // ✅ Incluído
                missedClasses: [],
                assessments: [],
                paymentStatus: 'paid', // Default
                // Financial fields
                monthly_fee: dbClient.monthly_fee,
                payment_day: dbClient.payment_day,
                payment_type: dbClient.payment_type,
                session_price: dbClient.session_price,
            }));
            setClients(mappedClients);
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [user?.id]);

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
                    console.error('Error uploading avatar:', e);
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

            await fetchClients(); // Refresh list
            showToast('Aluno criado com sucesso!', 'success');
        } catch (error) {
            console.error('Error creating client:', error);
            showToast('Erro ao criar aluno. Tente novamente.', 'error');
            throw error;
        }
    };

    // Filter clients
    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        atRisk: clients.filter(c => c.status === 'at-risk').length,
        paused: clients.filter(c => c.status === 'paused').length,
    };

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
            className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20 pb-12"
            style={{ background: 'var(--bg-void)' }}
        >
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down w-max max-w-[90%]">
                    <div
                        className="px-6 py-3 rounded-full flex items-center gap-3"
                        style={{
                            background: toast.type === 'error' ? 'rgba(255,51,102,0.12)' : 'rgba(59, 130, 246,0.1)',
                            border: `1px solid ${toast.type === 'error' ? 'rgba(255,51,102,0.2)' : 'rgba(59, 130, 246,0.15)'}`,
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        <div className="size-3 rounded-full" style={{ background: toast.type === 'error' ? '#FF3366' : '#3B82F6' }} />
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
                        className="size-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
                        style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)', boxShadow: '0 4px 16px rgba(30, 58, 138,0.35)' }}
                    >
                        <Plus size={18} color="white" />
                    </button>
                }
            />

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="px-5 grid grid-cols-4 gap-2 mb-5">
                {[
                    { tab: 'all', label: 'Total', value: stats.total, icon: Users, color: '#3B82F6', activeBg: 'rgba(59, 130, 246,0.1)', activeBorder: 'rgba(59, 130, 246,0.25)' },
                    { tab: 'active', label: 'Ativos', value: stats.active, icon: CheckCircle, color: '#00FF88', activeBg: 'rgba(0,255,136,0.1)', activeBorder: 'rgba(0,255,136,0.25)' },
                    { tab: 'at-risk', label: 'Alerta', value: stats.atRisk, icon: AlertTriangle, color: '#FFB800', activeBg: 'rgba(255,184,0,0.1)', activeBorder: 'rgba(255,184,0,0.25)' },
                    { tab: 'paused', label: 'Pausa', value: stats.paused, icon: Pause, color: '#3D5A80', activeBg: 'rgba(61,90,128,0.15)', activeBorder: 'rgba(61,90,128,0.3)' },
                ].map(({ tab, label, value, icon: Icon, color, activeBg, activeBorder }) => {
                    const isActive = statusFilter === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab as any)}
                            className="rounded-2xl p-3 text-center transition-all"
                            style={isActive
                                ? { background: activeBg, border: `1px solid ${activeBorder}` }
                                : { background: 'rgba(59, 130, 246,0.03)', border: '1px solid rgba(59, 130, 246,0.06)' }
                            }
                        >
                            <Icon size={15} className="mx-auto mb-1" style={{ color: isActive ? color : '#3D5A80' }} />
                            <p className="text-base font-black" style={{ color: isActive ? color : '#7A9FCC' }}>{value}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#3D5A80' }}>{label}</p>
                        </button>
                    );
                })}
            </motion.div>

            {/* Search */}
            <motion.div variants={itemVariants} className="px-5 mb-5">
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#3D5A80' }} />
                    <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-11 pr-5 rounded-2xl text-sm font-bold text-white placeholder:text-[#3D5A80] outline-none"
                        style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.1)' }}
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
                ) : filteredClients.length > 0 ? (
                    <AnimatePresence>
                        {filteredClients.map((client, index) => (
                            <motion.button
                                key={client.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => onSelectClient(client)}
                                className="w-full rounded-2xl p-4 flex items-center gap-3.5 active:scale-[0.99] transition-all group text-left"
                                style={{ background: 'rgba(59, 130, 246,0.03)', border: '1px solid rgba(59, 130, 246,0.06)' }}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    {client.avatar ? (
                                        <div
                                            className="size-13 rounded-2xl bg-cover bg-center"
                                            style={{ width: 52, height: 52, backgroundImage: `url(${client.avatar})`, border: '1.5px solid rgba(59, 130, 246,0.1)' }}
                                        />
                                    ) : (
                                        <div
                                            className="flex items-center justify-center"
                                            style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(59, 130, 246,0.07)', border: '1px solid rgba(59, 130, 246,0.1)' }}
                                        >
                                            <User size={20} style={{ color: '#3D5A80' }} />
                                        </div>
                                    )}
                                    <StatusBadge status={client.status} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-black text-white text-sm tracking-tight truncate">{client.name}</h4>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0" style={{ background: 'rgba(59, 130, 246,0.07)', color: '#3D5A80' }}>{client.level}</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-wider truncate mb-1.5" style={{ color: '#3B82F6', opacity: 0.7 }}>{client.goal}</p>
                                    {/* Progress */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(59, 130, 246,0.06)', maxWidth: 80 }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${client.adherence}%`,
                                                    background: client.adherence < 50 ? '#FFB800' : 'linear-gradient(90deg,#0099FF,#00FF88)',
                                                }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black" style={{ color: client.adherence < 50 ? '#FFB800' : '#00FF88' }}>{client.adherence}%</span>
                                    </div>
                                </div>

                                <ChevronRight size={13} style={{ color: '#3D5A80', flexShrink: 0 }} />
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

                            {!searchTerm && clients.length === 0 && (
                                <button
                                    onClick={async () => {
                                        if (user?.id === 'demo-user-id' || user.isDemo) {
                                            // Demo user already has mock clients, so this shouldn't be needed/visible, 
                                            // but if they somehow get here with empty list:
                                            setClients(mockClients);
                                            return;
                                        }
                                        if (!user?.id) {
                                            showToast('Faça login para usar este recurso', 'error');
                                            return;
                                        }
                                        setLoading(true);
                                        try {
                                            const { seedDatabase } = await import('../services/seedDatabase');
                                            const count = await seedDatabase(user.id);
                                            showToast(`${count} alunos gerados com sucesso!`);
                                            await fetchClients();
                                        } catch (error) {
                                            console.error(error);
                                            showToast('Erro ao gerar dados', 'error');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    className="px-6 py-3 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl border border-white/5 hover:bg-slate-700 hover:text-white transition-all w-full max-w-[200px]"
                                >
                                    🪄 Gerar Alunos Demo
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>

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
