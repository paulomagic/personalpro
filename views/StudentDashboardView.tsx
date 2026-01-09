import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Dumbbell,
    Calendar,
    TrendingUp,
    User,
    ChevronRight,
    Play,
    Target,
    Clock,
    Flame
} from 'lucide-react';
import { getClientCurrentWorkout, getClient, getUserProfile } from '../services/supabaseClient';
import { AppUser, Client, Workout } from '../types';

interface StudentDashboardViewProps {
    user: AppUser;
    onStartWorkout: (workout: Workout) => void;
    onNavigate: (view: string) => void;
    onLogout: () => void;
}

const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
    user,
    onStartWorkout,
    onNavigate,
    onLogout
}) => {
    const [loading, setLoading] = useState(true);
    const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
    const [clientData, setClientData] = useState<Client | null>(null);
    const [coachName, setCoachName] = useState('Seu Personal');

    const studentName = user?.user_metadata?.name || user?.user_metadata?.full_name || 'Aluno';

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Get user profile to find linked client
                console.log('[StudentDashboard] Loading data for user:', user.id);
                const profile = await getUserProfile(user.id);
                console.log('[StudentDashboard] User profile:', profile);

                if (profile?.client_id) {
                    console.log('[StudentDashboard] Found client_id:', profile.client_id);

                    // Get client data
                    const client = await getClient(profile.client_id);
                    console.log('[StudentDashboard] Client data:', client);
                    if (client) {
                        setClientData(client as any);
                    }

                    // Get current workout
                    const workout = await getClientCurrentWorkout(profile.client_id);
                    console.log('[StudentDashboard] Workout:', workout);
                    if (workout) {
                        setCurrentWorkout(workout);
                    }
                } else {
                    console.log('[StudentDashboard] No client_id in profile!');
                }

                // TODO: Get coach name from profile.coach_id
            } catch (error) {
                console.error('Error loading student data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            loadData();
        }
    }, [user]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen bg-slate-950 p-6 pb-32"
        >
            {/* Header */}
            <motion.header variants={itemVariants} className="flex justify-between items-start pt-4 mb-8">
                <div>
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">
                        {getGreeting()} 👋
                    </p>
                    <h1 className="text-2xl font-black text-white mt-1">
                        {studentName.split(' ')[0]}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Treinando com {coachName}
                    </p>
                </div>
                <button
                    onClick={() => onNavigate('student_profile')}
                    className="size-12 rounded-full bg-slate-800 flex items-center justify-center ring-2 ring-white/10 overflow-hidden"
                >
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={24} className="text-slate-400" />
                    )}
                </button>
            </motion.header>

            {/* Today's Workout Hero Card */}
            {currentWorkout && (
                <motion.div
                    variants={itemVariants}
                    className="card-blue p-6 relative overflow-hidden mb-6"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90 z-0" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Flame size={16} className="text-amber-400" />
                            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                                Treino do Dia
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">
                            {currentWorkout.title || 'Treino A'}
                        </h2>
                        <p className="text-sm text-blue-200/80 mb-4">
                            {currentWorkout.objective || 'Vamos treinar!'}
                        </p>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2 text-blue-200/80">
                                <Clock size={14} />
                                <span className="text-xs font-bold">{currentWorkout.duration || '45 min'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-200/80">
                                <Dumbbell size={14} />
                                <span className="text-xs font-bold">
                                    {Array.isArray(currentWorkout.splits) ?
                                        currentWorkout.splits.reduce((acc: number, split: any) => acc + (split.exercises?.length || 0), 0) :
                                        0
                                    } exercícios
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => onStartWorkout(currentWorkout)}
                            className="w-full py-4 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/10 text-white font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Play size={20} fill="currentColor" />
                            Iniciar Treino
                        </button>
                    </div>

                    {/* Decorative blurs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -mr-16 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 -mb-32" />
                </motion.div>
            )}

            {/* No Workout State - shown when no workout available */}
            {!currentWorkout && (
                <motion.div
                    variants={itemVariants}
                    className="card-dark p-6 text-center mb-6 border border-slate-800"
                >
                    <div className="size-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Dumbbell size={28} className="text-slate-600" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">Nenhum treino disponível</h3>
                    <p className="text-xs text-slate-500">
                        Seu personal ainda não criou um treino para você.
                    </p>
                </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
                <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Target size={20} className="text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meta</span>
                    </div>
                    <p className="text-lg font-black text-white">
                        {clientData?.goal || 'Definir meta'}
                    </p>
                </div>

                <div className="card-dark p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <TrendingUp size={20} className="text-blue-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adesão</span>
                    </div>
                    <p className="text-lg font-black text-white">
                        {clientData?.adherence || 0}%
                    </p>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
                    Acesso Rápido
                </h3>

                <button
                    onClick={() => currentWorkout ? onStartWorkout(currentWorkout) : null}
                    className={`w-full card-dark p-4 flex items-center gap-4 active:scale-[0.99] transition-all group ${!currentWorkout ? 'opacity-50' : ''}`}
                    disabled={!currentWorkout}
                >
                    <div className="size-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Dumbbell size={24} className="text-purple-400" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-bold text-white">Meus Treinos</p>
                        <p className="text-xs text-slate-500">
                            {currentWorkout ? currentWorkout.title : 'Nenhum treino disponível'}
                        </p>
                    </div>
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-white transition-colors" />
                </button>

                <button
                    onClick={() => onNavigate('calendar')}
                    className="w-full card-dark p-4 flex items-center gap-4 active:scale-[0.99] transition-all group"
                >
                    <div className="size-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar size={24} className="text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-bold text-white">Minha Agenda</p>
                        <p className="text-xs text-slate-500">Próximos treinos agendados</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-white transition-colors" />
                </button>

                <button
                    onClick={() => onNavigate('student_profile')}
                    className="w-full card-dark p-4 flex items-center gap-4 active:scale-[0.99] transition-all group"
                >
                    <div className="size-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <User size={24} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-bold text-white">Meu Perfil</p>
                        <p className="text-xs text-slate-500">Biometria, metas e configurações</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-white transition-colors" />
                </button>
            </motion.div>
        </motion.div>
    );
};

export default StudentDashboardView;
