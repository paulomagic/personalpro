import React, { useEffect, useMemo, useState } from 'react';
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
import { getCurrentWorkoutByClient, type Workout } from '../services/supabase/domains/workoutsDomain';
import { buildConsistencyRecommendation, deriveSmartGoals, deriveStudentConsistencyStats } from '../services/product/trainingConsistency';
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
    const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);

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

                        const activeWorkout = await getCurrentWorkoutByClient(profile.client_id);
                        setCurrentWorkout(activeWorkout);
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

    const formatActivityDate = (activity: CompletedWorkout): string => {
        const rawDate = activity.date || activity.created_at;
        if (!rawDate) return 'Data indisponível';

        const parsed = new Date(rawDate);
        if (Number.isNaN(parsed.getTime())) return 'Data indisponível';

        return parsed.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
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

    const weeklyStats = useMemo(() => deriveStudentConsistencyStats({
        history,
        client: clientData,
        currentWorkout
    }), [history, clientData, currentWorkout]);

    const smartGoals = useMemo(() => deriveSmartGoals({
        history,
        client: clientData,
        currentWorkout
    }), [history, clientData, currentWorkout]);

    const consistencyRecommendation = useMemo(
        () => buildConsistencyRecommendation(weeklyStats),
        [weeklyStats]
    );

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
        <div className="min-h-screen pb-32 bg-[var(--bg-void)] animate-fade-in">
            {/* Header with Avatar */}
            <div className="relative h-64 overflow-hidden bg-[linear-gradient(135deg,#030712_0%,#0a1628_50%,#001a3d_100%)]">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 bg-[rgba(30,58,138,0.15)]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl -ml-24 -mb-24 bg-[rgba(59,130,246,0.1)]" />

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
                            <div className="size-full flex items-center justify-center bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)]">
                                <span className="text-4xl font-black text-white">
                                    {studentName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="pt-6 px-6 text-center mb-6 animate-fade-in">
                <h1 className="text-2xl font-black text-white">{studentName}</h1>
                <p className="text-sm text-slate-500 mt-1">{clientData?.goal || 'Definir objetivo'}</p>

                {/* Streak Badge */}
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <Flame size={16} className="text-blue-400" />
                    <span className="text-xs font-bold text-blue-400">{weeklyStats.streak} dias seguidos</span>
                </div>
            </div>

            {/* Premium Segmented Control (Tabs) */}
            <div className="px-6 mb-6 animate-fade-in">
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
                                ? 'bg-blue-600 shadow-glow text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <tab.icon size={16} strokeWidth={activeTab === tab.key ? 2.5 : 2} />
                            <span className="text-[11px] font-black uppercase tracking-wider">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="px-6">
                {/* Biometry Tab */}
                {activeTab === 'bio' && (
                    <div className="space-y-4 animate-fade-in">
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
                                            <div className="h-full w-[65%] bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-300">Hidratação</span>
                                            <span className="text-sm font-black text-white">{biometrics.hydration}<span className="text-[10px] text-slate-500">%</span></span>
                                        </div>
                                        <div className="h-2.5 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                                            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-full w-full rounded-full">
                                                <defs>
                                                    <linearGradient id="student-hydration-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#06B6D4" />
                                                        <stop offset="100%" stopColor="#34D399" />
                                                    </linearGradient>
                                                </defs>
                                                <rect x="0" y="0" width={biometrics.hydration} height="10" rx="5" fill="url(#student-hydration-gradient)" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </div>
                )}

                {/* Goals Tab */}
                {activeTab === 'goals' && (
                    <div className="space-y-4 animate-fade-in">
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
                                                <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="h-full w-full rounded-full">
                                                    <defs>
                                                        <linearGradient id="student-weekly-progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#FBBF24" />
                                                            <stop offset="100%" stopColor="#FCD34D" />
                                                        </linearGradient>
                                                    </defs>
                                                    <rect
                                                        x="0"
                                                        y="0"
                                                        width={weeklyStats.workoutsPlanned > 0 ? (weeklyStats.workoutsCompleted / weeklyStats.workoutsPlanned) * 100 : 0}
                                                        height="12"
                                                        rx="6"
                                                        fill="url(#student-weekly-progress-gradient)"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-100/80 mt-4">
                                        Score de consistência: <span className="font-black text-white">{weeklyStats.consistencyScore}/100</span>
                                    </p>
                                </div>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            </div>

                            <div className="glass-card p-4 rounded-[20px] border border-blue-500/10">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] mb-2">Próxima recomendação</p>
                                <p className="text-sm text-slate-200 leading-relaxed">{consistencyRecommendation}</p>
                            </div>

                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Metas Inteligentes</h4>
                            <div className="space-y-3">
                                {smartGoals.map((goal) => {
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
                                                    <p className="text-[11px] text-slate-500 mb-2">{goal.hint}</p>
                                                    <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                                                        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-full w-full rounded-full">
                                                            <defs>
                                                                <linearGradient id={`student-goal-${goal.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                                    {goal.color === 'blue' && (<><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#60A5FA" /></>)}
                                                                    {goal.color === 'cyan' && (<><stop offset="0%" stopColor="#06B6D4" /><stop offset="100%" stopColor="#22D3EE" /></>)}
                                                                    {goal.color === 'emerald' && (<><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#34D399" /></>)}
                                                                    {goal.color === 'purple' && (<><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#06B6D4" /></>)}
                                                                </linearGradient>
                                                            </defs>
                                                            <rect x="0" y="0" width={progress} height="8" rx="4" fill={`url(#student-goal-${goal.id})`} />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div className="w-6 flex justify-end">
                                                    {isComplete && (
                                                        <div className="animate-fade-in">
                                                            <CheckCircle size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-4 animate-fade-in">
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

                            <div className="glass-card p-4 rounded-[20px]">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Resumo de consistência</p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-black text-white">{weeklyStats.consistencyScore}<span className="text-sm text-slate-500 ml-1">/100</span></p>
                                        <p className="text-xs text-slate-500 mt-1">Combina aderência, frequência e execução recente.</p>
                                    </div>
                                    <div className="size-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <TrendingUp size={22} className="text-blue-400" />
                                    </div>
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
                                                        {formatActivityDate(activity)}
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProfileView;
