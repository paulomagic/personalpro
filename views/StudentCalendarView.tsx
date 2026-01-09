import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Dumbbell,
    ClipboardCheck,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { getStudentAppointments, getUserProfile, Appointment } from '../services/supabaseClient';
import { AppUser } from '../types';
import RescheduleRequestModal from '../components/RescheduleRequestModal';

interface StudentCalendarViewProps {
    user: AppUser;
    onBack: () => void;
}

const StudentCalendarView: React.FC<StudentCalendarViewProps> = ({ user, onBack }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [clientId, setClientId] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadData();
    }, [user.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Get user profile to find client_id
            const profile = await getUserProfile(user.id);
            if (profile?.client_id) {
                setClientId(profile.client_id);
                const data = await getStudentAppointments(profile.client_id);
                setAppointments(data);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'training': return <Dumbbell size={18} className="text-blue-400" />;
            case 'assessment': return <ClipboardCheck size={18} className="text-purple-400" />;
            case 'consultation': return <MessageSquare size={18} className="text-green-400" />;
            default: return <Calendar size={18} className="text-slate-400" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'training': return 'Treino';
            case 'assessment': return 'Avaliação';
            case 'consultation': return 'Consulta';
            default: return 'Sessão';
        }
    };

    const formatDate = (dateStr: string) => {
        // Parse date without timezone conversion - use the date as stored
        // dateStr format: "2026-01-09T17:00:00" or "2026-01-09"
        const datePart = dateStr.split('T')[0]; // "2026-01-09"
        const [year, month, day] = datePart.split('-').map(Number);
        const date = new Date(year, month - 1, day); // Local date without TZ conversion

        return {
            day: day,
            weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
            month: date.toLocaleDateString('pt-BR', { month: 'short' }),
            full: date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
        };
    };

    const navigateMonth = (delta: number) => {
        const newDate = new Date(selectedMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setSelectedMonth(newDate);
    };

    const handleRescheduleSuccess = () => {
        setShowRescheduleModal(false);
        setSelectedAppointment(null);
        setSuccessMessage('Solicitação enviada! Aguarde a confirmação do seu personal.');
        setTimeout(() => setSuccessMessage(''), 5000);
        loadData();
    };

    // Group appointments by date - use date string directly to avoid timezone issues
    const groupedAppointments = appointments.reduce((acc, apt) => {
        const datePart = apt.date.split('T')[0]; // "2026-01-09" 
        if (!acc[datePart]) acc[datePart] = [];
        acc[datePart].push(apt);
        return acc;
    }, {} as Record<string, Appointment[]>);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Carregando agenda...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-4 py-4 safe-area-top">
                <div className="max-w-md mx-auto flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-black text-white">Minha Agenda</h1>
                        <p className="text-xs text-slate-400">Seus próximos agendamentos</p>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-6 pb-32">
                {/* Success Message */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3"
                        >
                            <CheckCircle2 size={20} className="text-emerald-400" />
                            <p className="text-sm text-emerald-300">{successMessage}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="size-10 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:bg-white/20 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-lg font-bold text-white capitalize">
                        {selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="size-10 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:bg-white/20 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Appointments List */}
                {appointments.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="size-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                            <Calendar size={40} className="text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Nenhum agendamento</h3>
                        <p className="text-sm text-slate-400">
                            Você não tem sessões agendadas no momento.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedAppointments).map(([dateKey, dayAppointments]) => {
                            const dateInfo = formatDate(dayAppointments[0].date);
                            return (
                                <div key={dateKey}>
                                    {/* Date Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex flex-col items-center justify-center text-white">
                                            <span className="text-lg font-black leading-none">{dateInfo.day}</span>
                                            <span className="text-[9px] font-bold uppercase">{dateInfo.weekday}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 capitalize">{dateInfo.full}</p>
                                    </div>

                                    {/* Appointments */}
                                    {(dayAppointments as Appointment[]).map((apt) => (
                                        <motion.div
                                            key={apt.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="ml-6 mb-3 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-slate-700 flex items-center justify-center">
                                                        {getTypeIcon(apt.type || 'training')}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">
                                                            {getTypeLabel(apt.type || 'training')}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <Clock size={12} />
                                                            <span>{(apt.time || '00:00').slice(0, 5)}</span>
                                                            <span>•</span>
                                                            <span>{apt.duration || 60} min</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reschedule Button */}
                                            <button
                                                onClick={() => {
                                                    setSelectedAppointment(apt);
                                                    setShowRescheduleModal(true);
                                                }}
                                                className="mt-3 w-full py-2 px-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-colors"
                                            >
                                                <RefreshCw size={16} />
                                                Solicitar Reagendamento
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700 rounded-2xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-slate-300 font-medium">Como funciona?</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Ao solicitar um reagendamento, seu personal será notificado e poderá aprovar ou sugerir uma alternativa.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Reschedule Modal */}
            {showRescheduleModal && selectedAppointment && clientId && (
                <RescheduleRequestModal
                    appointment={selectedAppointment}
                    clientId={clientId}
                    onClose={() => {
                        setShowRescheduleModal(false);
                        setSelectedAppointment(null);
                    }}
                    onSuccess={handleRescheduleSuccess}
                />
            )}
        </div>
    );
};

export default StudentCalendarView;
