import React, { useDeferredValue, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Search, UserPlus, Mail, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { AdminUsersInviteSheet } from '../components/admin/AdminUsersInviteSheet';
import { inviteCoachUser, listAdminUsers, type AdminManagedUser } from '../services/adminUsersService';
import { createScopedLogger } from '../services/appLogger';
import { getSafeAvatarUrl } from '../utils/validation';
import { sanitizeText, validateEmail } from '../utils/validation';

interface AdminUsersViewProps {
    onBack: () => void;
}

const adminUsersViewLogger = createScopedLogger('AdminUsersView');

function formatDateTime(value?: string | null): string {
    if (!value) return 'nunca';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'inválido';
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function statusLabel(status: AdminManagedUser['status']): string {
    if (status === 'active') return '● Ativo';
    if (status === 'invited') return '● Convite pendente';
    return '● Inativo';
}

const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onBack }) => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearch = useDeferredValue(searchQuery);
    const [showInviteSheet, setShowInviteSheet] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['admin-users', deferredSearch],
        queryFn: () => listAdminUsers(deferredSearch, {
            limit: 100
        }),
        staleTime: 30_000
    });

    const inviteMutation = useMutation({
        mutationFn: inviteCoachUser,
        onSuccess: async () => {
            setInviteName('');
            setInviteEmail('');
            setInviteError(null);
            setShowInviteSheet(false);
            setFeedbackMessage('Convite enviado com sucesso.');
            await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Falha ao enviar convite.';
            setInviteError(message);
            adminUsersViewLogger.error('Failed to invite coach from admin users view', error, {
                inviteEmail
            });
        }
    });

    const counts = data?.counts || {
        total: 0,
        admin: 0,
        coach: 0,
        student: 0,
        active: 0,
        invited: 0,
        inactive: 0
    };

    const users = data?.users || [];
    const loading = isLoading || isFetching;

    const summaryCards = useMemo(() => ([
        { label: 'Total', value: counts.total, tone: 'text-white' },
        { label: 'Admins', value: counts.admin, tone: 'text-blue-400' },
        { label: 'Coaches', value: counts.coach, tone: 'text-emerald-400' },
        { label: 'Alunos', value: counts.student, tone: 'text-purple-400' }
    ]), [counts.admin, counts.coach, counts.student, counts.total]);

    const handleInviteSubmit = () => {
        setInviteError(null);
        setFeedbackMessage(null);

        const normalizedName = sanitizeText(inviteName).trim();
        const normalizedEmail = inviteEmail.trim().toLowerCase();
        const emailValidation = validateEmail(normalizedEmail);

        if (!normalizedName) {
            setInviteError('Nome obrigatório.');
            return;
        }

        if (!emailValidation.valid) {
            setInviteError(emailValidation.error || 'Email inválido.');
            return;
        }

        inviteMutation.mutate({
            name: normalizedName,
            email: normalizedEmail
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            aria-label="Voltar para painel admin"
                            className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Users size={20} className="text-blue-400" />
                                Gestão de Usuários
                            </h1>
                            <p className="text-xs text-slate-500">{users.length} usuário(s) no resultado</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setInviteError(null);
                            setFeedbackMessage(null);
                            setShowInviteSheet(true);
                        }}
                        className="size-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
                        aria-label="Convidar coach"
                    >
                        <UserPlus size={18} />
                    </button>
                </div>
            </header>

            <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    {summaryCards.map((card, index) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card rounded-2xl p-4"
                        >
                            <p className={`text-2xl font-black ${card.tone}`}>{loading ? '...' : card.value}</p>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500">{card.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="glass-card rounded-xl flex items-center gap-3 px-4 py-3">
                    <Search size={18} className="text-slate-500" />
                    <label htmlFor="admin-users-search" className="sr-only">Buscar usuário</label>
                    <input
                        id="admin-users-search"
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-600"
                    />
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300"
                    >
                        Atualizar
                    </button>
                </div>

                {feedbackMessage && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300" role="status">
                        {feedbackMessage}
                    </div>
                )}

                <div className="glass-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{counts.active} ativos</span>
                        <span>{counts.invited} convites pendentes</span>
                        <span>{counts.inactive} inativos</span>
                    </div>
                </div>
            </div>

            <main className="px-6 pb-6 space-y-3">
                {loading && users.length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center text-slate-500">
                        Carregando usuários...
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Nenhum usuário encontrado</p>
                    </div>
                ) : (
                    users.map((user, idx) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="glass-card rounded-xl p-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="size-12 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                                    <img
                                        src={getSafeAvatarUrl(user.avatar_url, user.name)}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold truncate">{user.name}</h3>
                                        {user.role === 'admin' && (
                                            <span className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                                <Shield size={10} />
                                                Admin
                                            </span>
                                        )}
                                        {user.role === 'coach' && (
                                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                                Coach
                                            </span>
                                        )}
                                        {user.role === 'student' && (
                                            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                                                Aluno
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                        <Mail size={12} />
                                        <span className="truncate">{user.email}</span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                                        <span className={`px-2 py-0.5 rounded-full ${user.status === 'active'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : user.status === 'invited'
                                                ? 'bg-amber-500/20 text-amber-300'
                                                : 'bg-slate-700/70 text-slate-300'
                                            }`}>
                                            {statusLabel(user.status)}
                                        </span>
                                        <span className="flex items-center gap-1 text-slate-500">
                                            <Clock size={10} />
                                            Último login: {formatDateTime(user.last_login_at)}
                                        </span>
                                        {user.status === 'invited' && (
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <CheckCircle2 size={10} />
                                                Convite: {formatDateTime(user.invited_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </main>

            <AdminUsersInviteSheet
                isOpen={showInviteSheet}
                name={inviteName}
                email={inviteEmail}
                error={inviteError}
                submitting={inviteMutation.isPending}
                onClose={() => setShowInviteSheet(false)}
                onNameChange={setInviteName}
                onEmailChange={setInviteEmail}
                onSubmit={handleInviteSubmit}
            />
        </div>
    );
};

export default AdminUsersView;
