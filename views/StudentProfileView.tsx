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
import { getUserProfile, getClient, getCompletedWorkouts } from '../services/supabaseClient';
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
                    const client = await getClient(profile.client_id);
                    if (client) {
                        // Map body_fat from DB to bodyFat in frontend
                        const mappedClient: Client = {
                            ...client as any,
                            bodyFat: (client as any).body_fat
                        };
                        setClientData(mappedClient);

                        console.log('📥 Perfil do aluno carregado:', { bodyFat: (client as any).body_fat });

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
        { id: 4, icon: Clock, label: 'Sono', target: 8, current: 7, unit: 'h', color: 'purple' },
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
            className="min-h-screen bg-slate-950 pb-32"
        >
            {/* Header with Avatar */}
            <motion.div
                variants={itemVariants}
                className="relative h-64 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl -ml-24 -mb-24" />

                {/* Top bar - with safe area padding */}
                <div className="absolute top-0 left-0 right-0 pt-14 px-6 flex justify-between items-center z-10">
                    <button
                        onClick={onBack}
                        className="size-12 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <button
                        onClick={onSettings}
                        className="size-12 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <Settings size={22} />
                    </button>
                </div>

                {/* Avatar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="size-28 rounded-3xl bg-slate-800 border-4 border-slate-950 flex items-center justify-center overflow-hidden shadow-2xl">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="size-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
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
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <Flame size={16} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">{weeklyStats.streak} dias seguidos</span>
                </div>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div variants={itemVariants} className="px-6 mb-6">
                <div className="flex bg-slate-900/50 rounded-2xl p-1 border border-white/5">
                    {[
                        { key: 'bio', label: 'Biometria', icon: Activity },
                        { key: 'goals', label: 'Metas', icon: Target },
                        { key: 'history', label: 'Histórico', icon: Calendar }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === tab.key
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            <tab.icon size={16} />
                            <span className="text-xs font-bold">{tab.label}</span>
                        </button>
                    ))}
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
                            <div className="grid grid-cols-2 gap-3">
                                <div className="card-dark p-4 text-center">
                                    <div className="size-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                                        <Scale size={24} className="text-blue-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white">{biometrics.weight}<span className="text-sm text-slate-500 ml-1">kg</span></p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Peso</p>
                                </div>

                                <div className="card-dark p-4 text-center">
                                    <div className="size-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                                        <Ruler size={24} className="text-emerald-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white">{biometrics.height}<span className="text-sm text-slate-500 ml-1">cm</span></p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Altura</p>
                                </div>

                                <div className="card-dark p-4 text-center">
                                    <div className="size-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                                        <TrendingUp size={24} className="text-purple-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white">{biometrics.bmi}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">IMC</p>
                                </div>

                                <div className="card-dark p-4 text-center">
                                    <div className="size-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                                        <Heart size={24} className="text-red-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white">{biometrics.bodyFat}<span className="text-sm text-slate-500 ml-1">%</span></p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gordura</p>
                                </div>
                            </div>

                            {/* Secondary Stats */}
                            <div className="card-dark p-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Composição Corporal</h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-slate-400">Massa Muscular</span>
                                            <span className="text-sm font-bold text-white">{biometrics.muscleMass} kg</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: '65%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-slate-400">Hidratação</span>
                                            <span className="text-sm font-bold text-white">{biometrics.hydration}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: `${biometrics.hydration}%` }} />
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
                                        <Award size={18} className="text-amber-400" />
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
                                        purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', progress: 'from-purple-500 to-purple-400' },
                                    };
                                    const colors = colorClasses[goal.color];

                                    return (
                                        <div key={goal.id} className="card-dark p-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`size-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                                    <goal.icon size={24} className={colors.text} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-bold text-white">{goal.label}</span>
                                                        <span className="text-sm text-slate-400">
                                                            {goal.current.toLocaleString()}/{goal.target.toLocaleString()}{goal.unit}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${colors.progress} rounded-full transition-all duration-500`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                {isComplete && (
                                                    <CheckCircle size={20} className="text-emerald-400" />
                                                )}
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
                            <div className="grid grid-cols-2 gap-3">
                                <div className="card-dark p-4 text-center">
                                    <p className="text-2xl font-black text-white">{weeklyStats.totalMinutes}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Min. esta semana</p>
                                </div>
                                <div className="card-dark p-4 text-center">
                                    <p className="text-2xl font-black text-white">{weeklyStats.streak}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Dias de Streak</p>
                                </div>
                            </div>

                            {/* Activity List */}
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Atividades Recentes</h4>
                            <div className="space-y-2">
                                {history.length === 0 ? (
                                    <div className="card-dark p-6 text-center">
                                        <p className="text-slate-400 text-sm">Nenhum treino registrado ainda.</p>
                                    </div>
                                ) : (
                                    history.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="card-dark p-4 flex items-center gap-4"
                                        >
                                            <div className="size-10 rounded-xl flex items-center justify-center bg-emerald-500/20">
                                                <CheckCircle size={20} className="text-emerald-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white">{activity.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500">
                                                        {new Date(activity.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    {activity.duration && (
                                                        <>
                                                            <span className="text-slate-700">•</span>
                                                            <span className="text-[10px] text-slate-500">{activity.duration}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-600" />
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
