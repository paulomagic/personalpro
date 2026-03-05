import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    User,
    Scale,
    Ruler,
    Target,
    TrendingUp,
    Calendar,
    Flame,
    Award,
    CheckCircle,
    Activity,
    Dumbbell,
    Clock,
    ChevronRight,
    Settings,
    Heart,
    Droplets
} from 'lucide-react';
import { getUserProfile } from '../services/userProfileService';
import { getClientById } from '../services/supabase/domains/clientsDomain';
import { getCompletedWorkouts } from '../services/supabase/domains/completedWorkoutsDomain';
import { AppUser, Client, CompletedWorkout } from '../types';

interface StudentProfileViewProps {
    user: AppUser;
    onBack: () => void;
    onSettings: () => void;
}



const StudentProfileView: React.FC<StudentProfileViewProps> = ({
    user,
    onBack,
    onSettings
}) => {
    const [loading, setLoading] = useState(true);
    const [clientData, setClientData] = useState<Client | null>(null);
    const [activeTab, setActiveTab] = useState<'bio' | 'goals' | 'history'>('bio');
    const [history, setHistory] = useState<CompletedWorkout[]>([]);

    const studentName = user?.user_metadata?.name || user?.user_metadata?.full_name || 'Aluno';

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const profile = await getUserProfile(user.id);
                if (profile?.client_id) {
                    const client = await getClientById(profile.client_id);
                    if (client) {
                        // Map body_fat from DB to bodyFat in frontend
                        const mappedClient: Client = {
                            ...client as any,
                            bodyFat: (client as any).body_fat
                        };
                        setClientData(mappedClient);

                        // Load history
                        const workouts = await getCompletedWorkouts(profile.client_id);
                        setHistory(workouts);
                    }
                }
            } catch (error) {
                console.error('Error loading student profile:', error);
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
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Biometrics data (would come from client/assessments)
    // Detecta automaticamente se altura está em metros (< 3) ou centímetros (>= 100)
    const getHeightInMeters = (h: number | undefined) => {
        if (!h) return 1.75; // default
        return h < 3 ? h : h / 100;
    };
    const biometrics = {
        weight: clientData?.weight || 72,
        height: clientData?.height || 175,
        bodyFat: clientData?.bodyFat || 18,
        muscleMass: 35,
        hydration: 55,
        bmi: clientData?.weight && clientData?.height
            ? (clientData.weight / Math.pow(getHeightInMeters(clientData.height), 2)).toFixed(1)
            : '23.5'
    };

    // Daily goals data
    const dailyGoals = [
        { id: 1, icon: Dumbbell, label: 'Treino', target: 1, current: 1, unit: 'sessão', color: 'blue' },
        { id: 2, icon: Droplets, label: 'Água', target: 3, current: 2, unit: 'L', color: 'cyan' },
        { id: 3, icon: Activity, label: 'Passos', target: 8000, current: 5420, unit: '', color: 'emerald' },
        { id: 4, icon: Clock, label: 'Sono', target: 8, current: 7, unit: 'h', color: 'blue' },
    ];

    // Weekly stats
    const weeklyStats = {
        workoutsCompleted: 4,
        workoutsPlanned: 5,
        totalMinutes: 200,
        streak: 12
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen pb-32"
            style={{ background: 'var(--bg-void)' }}
        >
            {/* Header with Avatar */}
            <motion.div
                variants={itemVariants}
                className="relative h-64 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #030712 0%, #0a1628 50%, #001a3d 100%)' }}
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32" style={{ background: 'rgba(30, 58, 138,0.15)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl -ml-24 -mb-24" style={{ background: 'rgba(59, 130, 246,0.1)' }} />

                {/* Top bar - with safe area padding */}
                <div className="absolute top-0 left-0 right-0 pt-14 px-6 flex justify-between items-center z-10">
                    <button
                        onClick={onBack}
                        className="size-11 rounded-2xl bg-white/10 backdrop-blur-xl text-white border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all shadow-lg active:scale-95"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={onSettings}
                        className="size-11 rounded-2xl bg-white/10 backdrop-blur-xl text-white border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all shadow-lg active:scale-95"
                    >
                        <Settings size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Avatar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="size-28 rounded-3xl bg-slate-800 border-4 border-slate-950 flex items-center justify-center overflow-hidden shadow-2xl">
                        {clientData?.avatar_url || user?.user_metadata?.avatar_url ? (
                            <img src={clientData?.avatar_url || user?.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="size-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)' }}>
                                <span className="text-4xl font-black text-white">
                                    {studentName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Profile Info */}
            <motion.div variants={itemVariants} className="pt-6 px-6 text-center mb-6">
                <h1 className="text-2xl font-black text-white">{studentName}</h1>
                <p className="text-sm text-slate-500 mt-1">{clientData?.goal || 'Definir objetivo'}</p>

                {/* Streak Badge */}
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <Flame size={16} className="text-blue-400" />
                    <span className="text-xs font-bold text-blue-400">{weeklyStats.streak} dias seguidos</span>
                </div>
            </motion.div>

            {/* Premium Segmented Control (Tabs) */}
            <motion.div variants={itemVariants} className="px-6 mb-6">
                <div className="flex bg-slate-900/60 rounded-[18px] backdrop-blur-md p-1 border border-white/5 relative">
                    {[
                        { key: 'bio', label: 'Biometria', icon: Activity },
                        { key: 'goals', label: 'Metas', icon: Target },
                        { key: 'history', label: 'Histórico', icon: Calendar }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`relative z-10 flex-1 py-3 px-2 rounded-[14px] flex items-center justify-center gap-2 transition-all ${activeTab === tab.key
                                ? 'text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <tab.icon size={16} strokeWidth={activeTab === tab.key ? 2.5 : 2} />
                            <span className="text-[11px] font-black uppercase tracking-wider">{tab.label}</span>
                        </button>
                    ))}

                    {/* Active Background Pill */}
                    <motion.div
                        className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-blue-600 rounded-[14px] shadow-glow z-0"
                        animate={{
                            left: activeTab === 'bio' ? '4px' : activeTab === 'goals' ? 'calc(33.33% + 2px)' : 'calc(66.66%)'
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                </div>
            </motion.div>

            {/* Tab Content */}
            <div className="px-6">
                <AnimatePresence mode="wait">
                    {/* Biometry Tab */}
                    {activeTab === 'bio' && (
                        <motion.div
                            key="bio"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Main Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                                    <div className="size-12 rounded-[14px] bg-blue-600/10 flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
                                        <Scale size={24} className="text-blue-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white tracking-tight">{biometrics.weight}<span className="text-sm font-bold text-slate-500 ml-1">kg</span></p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Peso Atual</p>
                                </div>

                                <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                                    <div className="size-12 rounded-[14px] bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                                        <Ruler size={24} className="text-emerald-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white tracking-tight">{biometrics.height}<span className="text-sm font-bold text-slate-500 ml-1">cm</span></p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Estatura</p>
                                </div>

                                <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                                    <div className="size-12 rounded-[14px] bg-indigo-500/10 flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
                                        <TrendingUp size={24} className="text-indigo-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white tracking-tight">{biometrics.bmi}</p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Índice IMC</p>
                                </div>

                                <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all" />
                                    <div className="size-12 rounded-[14px] bg-red-500/10 flex items-center justify-center mx-auto mb-3 border border-red-500/20">
                                        <Heart size={24} className="text-red-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white tracking-tight">{biometrics.bodyFat}<span className="text-sm font-bold text-slate-500 ml-1">%</span></p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Tx Gordura</p>
                                </div>
                            </div>

                            {/* Secondary Stats */}
                            <div className="glass-card p-6 rounded-3xl mt-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                                    <Activity size={12} className="text-cyan-400" />
                                    Composição Corporal
                                </h4>
                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-300">Massa Muscular</span>
                                            <span className="text-sm font-black text-white">{biometrics.muscleMass} <span className="text-[10px] text-slate-500">kg</span></span>
                                        </div>
                                        <div className="h-2.5 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: '65%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-300">Hidratação</span>
                                            <span className="text-sm font-black text-white">{biometrics.hydration}<span className="text-[10px] text-slate-500">%</span></span>
                                        </div>
                                        <div className="h-2.5 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(0,255,136,0.3)]" style={{ width: `${biometrics.hydration}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Goals Tab */}
                    {activeTab === 'goals' && (
                        <motion.div
                            key="goals"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Weekly Progress Card */}
                            <div className="card-blue p-5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 opacity-90" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Award size={18} className="text-blue-400" />
                                        <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Progresso Semanal</span>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <div>
                                            <p className="text-4xl font-black text-white">{weeklyStats.workoutsCompleted}<span className="text-lg text-blue-200">/{weeklyStats.workoutsPlanned}</span></p>
                                            <p className="text-xs text-blue-200/80 mt-1">treinos concluídos</p>
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-500"
                                                    style={{ width: `${(weeklyStats.workoutsCompleted / weeklyStats.workoutsPlanned) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            </div>

                            {/* Daily Goals */}
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Metas de Hoje</h4>
                            <div className="space-y-3">
                                {dailyGoals.map((goal) => {
                                    const progress = Math.min((goal.current / goal.target) * 100, 100);
                                    const isComplete = goal.current >= goal.target;
                                    const colorClasses: Record<string, { bg: string; text: string; progress: string }> = {
                                        blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', progress: 'from-blue-500 to-blue-400' },
                                        cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', progress: 'from-cyan-500 to-cyan-400' },
                                        emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', progress: 'from-emerald-500 to-emerald-400' },
                                        purple: { bg: 'bg-blue-500/20', text: 'text-blue-400', progress: 'from-blue-500 to-cyan-500' },
                                    };
                                    const colors = colorClasses[goal.color];

                                    return (
                                        <div key={goal.id} className="glass-card p-4 rounded-[20px] relative overflow-hidden group hover:border-slate-700 transition-colors">
                                            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={`size-12 rounded-[14px] ${colors.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                                                    <goal.icon size={22} className={colors.text} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[13px] font-black tracking-wide text-white">{goal.label}</span>
                                                        <span className="text-[11px] font-bold text-slate-400">
                                                            <span className={isComplete ? colors.text : "text-white"}>{goal.current.toLocaleString()}</span>/{goal.target.toLocaleString()}{goal.unit}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${colors.progress} rounded-full transition-all duration-1000 ease-out`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="w-6 flex justify-end">
                                                    {isComplete && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                                            <CheckCircle size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                                    <div className="size-10 rounded-[12px] bg-blue-500/10 flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
                                        <Clock size={18} className="text-blue-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white tracking-tight">{weeklyStats.totalMinutes}<span className="text-xs text-slate-500 ml-1">m</span></p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Tempo Total (Semana)</p>
                                </div>
                                <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                                    <div className="size-10 rounded-[12px] bg-amber-500/10 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                                        <Flame size={18} className="text-amber-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white tracking-tight">{weeklyStats.streak}<span className="text-xs text-slate-500 ml-1">d</span></p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Dias Seguidos</p>
                                </div>
                            </div>

                            {/* Activity List */}
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-2 mb-3">Atividades Recentes</h4>
                            <div className="space-y-3">
                                {history.length === 0 ? (
                                    <div className="glass-card p-8 rounded-[24px] text-center">
                                        <div className="size-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3 border border-white/5">
                                            <Calendar size={20} className="text-slate-600" />
                                        </div>
                                        <p className="text-slate-300 font-bold mb-1">Nada por aqui</p>
                                        <p className="text-slate-500 text-xs">Nenhum treino registrado recentemente.</p>
                                    </div>
                                ) : (
                                    history.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="glass-card p-4 rounded-[20px] flex items-center gap-4 hover:border-blue-500/30 transition-colors group cursor-pointer"
                                        >
                                            <div className="size-12 rounded-[14px] flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                                <CheckCircle size={22} className="text-emerald-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[14px] font-black text-white tracking-wide">{activity.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {new Date(activity.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    {activity.duration && (
                                                        <>
                                                            <div className="size-1 bg-slate-700 rounded-full" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activity.duration}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="size-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-400" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default StudentProfileView;
