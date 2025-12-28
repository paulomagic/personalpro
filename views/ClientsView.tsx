import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Filter, Users, AlertTriangle, Pause, CheckCircle } from 'lucide-react';
import { Client } from '../types';
import { getClients, createClient, DBClient } from '../services/supabaseClient';
import AddClientModal from '../components/AddClientModal';

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

    // Fetch clients from Supabase
    const fetchClients = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await getClients(user.id);
            // Map DBClient to Client type
            const mappedClients: Client[] = data.map(dbClient => ({
                id: dbClient.id,
                name: dbClient.name,
                avatar: dbClient.avatar_url || '',
                goal: dbClient.goal,
                level: dbClient.level as any,
                adherence: dbClient.adherence || 0,
                lastTraining: 'Hoje', // Placeholder for now
                status: dbClient.status as any,
                email: dbClient.email,
                phone: dbClient.phone,
                observations: dbClient.observations,
                missedClasses: [],
                assessments: [],
                paymentStatus: 'paid' // Default
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
        if (!user?.id) return;

        try {
            const clientToCreate: any = {
                coach_id: user.id,
                name: newClientData.name,
                email: newClientData.email,
                phone: newClientData.phone,
                goal: 'Hipertrofia', // Default for now if missing
                level: 'Iniciante',  // Default
                status: 'active',
                adherence: 0,
                ...newClientData
            };

            // Remove non-DB fields and map camelCase to snake_case
            if (newClientData.birthDate) {
                clientToCreate.birth_date = newClientData.birthDate;
                delete clientToCreate.birthDate;
            }

            delete clientToCreate.missedClasses;
            delete clientToCreate.assessments;
            delete clientToCreate.lastTraining;
            delete clientToCreate.avatar; // types uses avatar, db uses avatar_url
            delete clientToCreate.totalClasses;
            delete clientToCreate.completedClasses;
            delete clientToCreate.paymentStatus; // separate table usually, or keep if column exists (not in current schema)

            // Fix: ensure paymentStatus is not sent if column doesn't exist (it doesn't in schema provided to user)
            // But types.ts has it. Schema has payments table. 
            // We should probably rely on default or separate insert. For now delete it to avoid error.
            if ('paymentStatus' in clientToCreate) delete clientToCreate.paymentStatus;

            await createClient(clientToCreate);
            await fetchClients(); // Refresh list
            setShowAddModal(false);
        } catch (error) {
            console.error('Error creating client:', error);
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
            'at-risk': { color: 'bg-amber-500', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]', icon: AlertTriangle },
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
            className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pb-12"
        >
            {/* Header */}
            <motion.header variants={itemVariants} className="px-6 pt-14 pb-6 flex items-center gap-4">
                <button onClick={onBack} className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-white">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-white tracking-tight">Alunos</h1>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Base de Elite • {stats.total} protocolos</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-glow active:scale-95 transition-all"
                >
                    <Plus size={24} />
                </button>
            </motion.header>

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="px-6 grid grid-cols-4 gap-2 mb-6">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`glass-card rounded-2xl p-3 text-center transition-all ${statusFilter === 'all' ? 'border-blue-500/50 bg-blue-500/10' : ''}`}
                >
                    <Users size={16} className="mx-auto mb-1 text-slate-400" />
                    <p className="text-lg font-black text-white">{stats.total}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                </button>
                <button
                    onClick={() => setStatusFilter('active')}
                    className={`glass-card rounded-2xl p-3 text-center transition-all ${statusFilter === 'active' ? 'border-emerald-500/50 bg-emerald-500/10' : ''}`}
                >
                    <CheckCircle size={16} className="mx-auto mb-1 text-emerald-400" />
                    <p className="text-lg font-black text-emerald-400">{stats.active}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ativos</p>
                </button>
                <button
                    onClick={() => setStatusFilter('at-risk')}
                    className={`glass-card rounded-2xl p-3 text-center transition-all ${statusFilter === 'at-risk' ? 'border-amber-500/50 bg-amber-500/10' : ''}`}
                >
                    <AlertTriangle size={16} className="mx-auto mb-1 text-amber-400" />
                    <p className="text-lg font-black text-amber-400">{stats.atRisk}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Alerta</p>
                </button>
                <button
                    onClick={() => setStatusFilter('paused')}
                    className={`glass-card rounded-2xl p-3 text-center transition-all ${statusFilter === 'paused' ? 'border-slate-500/50 bg-slate-500/10' : ''}`}
                >
                    <Pause size={16} className="mx-auto mb-1 text-slate-400" />
                    <p className="text-lg font-black text-slate-300">{stats.paused}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pausados</p>
                </button>
            </motion.div>

            {/* Search */}
            <motion.div variants={itemVariants} className="px-6 mb-6">
                <div className="relative group">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar Aluno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 rounded-2xl glass-card bg-white/5 border-white/5 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-bold text-sm"
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
                            statusFilter === 'at-risk' ? 'bg-amber-500/20 text-amber-400' :
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
            <motion.div variants={itemVariants} className="px-6 space-y-3">
                {loading ? (
                    <div className="py-12 text-center text-slate-500 animate-pulse font-bold text-xs uppercase tracking-widest">
                        Carregando Base de Dados...
                    </div>
                ) : filteredClients.length > 0 ? (
                    <AnimatePresence>
                        {filteredClients.map((client, index) => (
                            <motion.button
                                key={client.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelectClient(client)}
                                className="w-full glass-card rounded-[24px] p-4 flex items-center gap-4 active:scale-[0.99] transition-all group text-left hover:border-blue-500/30"
                            >
                                <div className="relative">
                                    {client.avatar ? (
                                        <div
                                            className="size-14 rounded-2xl bg-cover bg-center border-2 border-white/10 group-hover:border-blue-500/30 transition-colors shadow-xl"
                                            style={{ backgroundImage: `url(${client.avatar})` }}
                                        />
                                    ) : (
                                        <div className="size-14 rounded-2xl bg-slate-800 flex items-center justify-center border-2 border-white/5">
                                            <span className="material-symbols-outlined text-slate-600">person</span>
                                        </div>
                                    )}
                                    <span className="absolute -bottom-1 -right-1">
                                        <StatusBadge status={client.status} />
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-white text-sm tracking-tight">{client.name}</h4>
                                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest">{client.level}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{client.goal}</p>
                                        {client.paymentStatus === 'overdue' && (
                                            <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                                                Pagamento Atrasado
                                            </span>
                                        )}
                                        {client.suspensionReason && (
                                            <span className="text-[8px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded font-bold">
                                                {client.suspensionReason === 'travel' ? 'Viagem' : client.suspensionReason === 'sick' ? 'Doença' : 'Pausado'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden max-w-[100px]">
                                            <div
                                                className={`h-full ${client.adherence < 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                style={{ width: `${client.adherence}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-bold">{client.adherence}%</span>
                                        <span className="text-slate-600">•</span>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                                            {client.lastTraining}
                                        </p>
                                    </div>
                                    {client.observations && (
                                        <p className="text-[9px] text-slate-600 mt-1 truncate max-w-[200px]">
                                            📝 {client.observations}
                                        </p>
                                    )}
                                </div>

                                <span className="material-symbols-outlined text-slate-700 group-hover:text-blue-500 transition-colors">chevron_right</span>
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
                                        if (!user?.id) return;
                                        setLoading(true);
                                        try {
                                            const { seedDatabase } = await import('../services/seedDatabase');
                                            const count = await seedDatabase(user.id);
                                            alert(`${count} alunos demonstrativos gerados com sucesso!`);
                                            await fetchClients();
                                        } catch (error) {
                                            console.error(error);
                                            alert('Erro ao gerar dados.');
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
