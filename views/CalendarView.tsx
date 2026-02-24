
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment, deleteAppointmentsBulk, getAllAppointmentsForCoach, getClients, DBClient, Appointment as DBAppointment } from '../services/supabaseClient';
import { mockClients } from '../mocks/demoData';
import PendingRequestsPanel from '../components/PendingRequestsPanel';
import MonthlyScheduleModal from '../components/MonthlyScheduleModal';
import { getAllBatchesForCoach } from '../services/monthlyScheduleService';


interface CalendarViewProps {
    user?: any;
    onBack: () => void;
    onSelectClient?: (clientId: string) => void;
}

interface DisplayAppointment {
    id: string;
    clientId?: string;
    clientName: string;
    clientAvatar: string;
    time: string;
    duration: string;
    type: 'training' | 'assessment' | 'consultation';
    status: 'confirmed' | 'pending' | 'completed';
    phone?: string;
}

// Demo appointments for fallback
const demoAppointments: DisplayAppointment[] = [
    { id: '1', clientName: 'Ana Silva', clientAvatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=100', time: '07:00', duration: '1h', type: 'training', status: 'confirmed', phone: '5561999999999' },
    { id: '2', clientName: 'Carlos Mendes', clientAvatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=100', time: '08:30', duration: '1h', type: 'training', status: 'confirmed', phone: '5561988888888' },
    { id: '3', clientName: 'Júlia Costa', clientAvatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100', time: '10:00', duration: '1h30', type: 'assessment', status: 'pending', phone: '5561977777777' },
    { id: '4', clientName: 'Ricardo Sousa', clientAvatar: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=100', time: '14:00', duration: '1h', type: 'training', status: 'confirmed', phone: '5561966666666' },
    { id: '5', clientName: 'Marina Santos', clientAvatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100', time: '16:00', duration: '1h', type: 'training', status: 'confirmed', phone: '5561955555555' },
];

const CalendarView: React.FC<CalendarViewProps> = ({ user, onBack, onSelectClient }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [showNewModal, setShowNewModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState<DisplayAppointment | null>(null);
    const [showMonthlyModal, setShowMonthlyModal] = useState(false);
    const [monthlyBatchesCount, setMonthlyBatchesCount] = useState(0);
    const [appointments, setAppointments] = useState<DisplayAppointment[]>(demoAppointments);
    const [clients, setClients] = useState<DBClient[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // New appointment form state
    const [newAppointment, setNewAppointment] = useState({
        clientId: '',
        time: '09:00',
        duration: '1h',
        type: 'training' as 'training' | 'assessment' | 'consultation',
    });

    const isDemo = user?.isDemo || !user?.id;

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            if (isDemo) {
                // Use demo data
                setAppointments(demoAppointments);
                setClients(mockClients as unknown as DBClient[]);
                return;
            }

            setLoading(true);
            try {
                // Fetch real clients
                const clientsData = await getClients(user.id);
                setClients(clientsData);

                // Fetch real appointments for selected date
                const dateStr = selectedDate.toISOString().split('T')[0];
                const appointmentsData = await getAppointments(user.id, dateStr);

                if (appointmentsData.length > 0) {
                    // Map DB appointments to display format
                    const mapped = appointmentsData.map((apt: any) => ({
                        id: apt.id,
                        clientId: apt.client_id,
                        clientName: apt.clients?.name || 'Cliente',
                        clientAvatar: apt.clients?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.clients?.name || 'C')}&background=3b82f6&color=fff`,
                        time: (apt.time || '').slice(0, 5) || '00:00',
                        duration: apt.duration,
                        type: apt.type,
                        status: apt.status,
                        phone: apt.clients?.phone,
                    }));
                    setAppointments(mapped);
                } else {
                    // No appointments for this date, show empty
                    setAppointments([]);
                }

                // Fetch monthly batches count for current month
                const month = selectedDate.getMonth() + 1;
                const year = selectedDate.getFullYear();
                const batches = await getAllBatchesForCoach(user.id, year, month);
                setMonthlyBatchesCount(batches.reduce((sum, b) => sum + b.total_sessions, 0));
            } catch (error) {
                console.error('Error fetching calendar data:', error);
                setAppointments(demoAppointments);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, selectedDate, isDemo]);

    // Generate week days
    const getWeekDays = () => {
        const days = [];
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const weekDays = getWeekDays();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const availableSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

    // Helper: Convert duration to minutes
    const durationToMinutes = (duration: string): number => {
        if (duration === '30min') return 30;
        if (duration === '1h') return 60;
        if (duration === '1h30') return 90;
        if (duration === '2h') return 120;
        return 60; // default
    };

    // Helper: Check if a time slot conflicts with existing appointments
    const isSlotAvailable = (slot: string): boolean => {
        const [slotHours, slotMinutes] = slot.split(':').map(Number);
        const slotTime = slotHours * 60 + slotMinutes;

        // Assume default slot duration is 1h
        const slotEnd = slotTime + 60;

        return !appointments.some(apt => {
            const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
            const aptTime = aptHours * 60 + aptMinutes;
            const aptEnd = aptTime + durationToMinutes(apt.duration);

            // Check for overlap: slot starts during appointment OR appointment starts during slot
            return (slotTime >= aptTime && slotTime < aptEnd) ||
                (aptTime >= slotTime && aptTime < slotEnd);
        });
    };

    const freeSlots = availableSlots.filter(isSlotAvailable);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'training': return 'bg-blue-500';
            case 'assessment': return 'bg-purple-500';
            case 'consultation': return 'bg-emerald-500';
            default: return 'bg-slate-500';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'training': return 'Treino';
            case 'assessment': return 'Avaliação';
            case 'consultation': return 'Consulta';
            default: return type;
        }
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
        return date.toDateString() === selectedDate.toDateString();
    };

    const handleConfirmAppointment = async (apt: DisplayAppointment) => {
        if (!isDemo && apt.id) {
            await updateAppointment(apt.id, { status: 'confirmed' });
        }
        setAppointments(prev => prev.map(a =>
            a.id === apt.id ? { ...a, status: 'confirmed' as const } : a
        ));
        setShowDetailModal(null);
    };

    const handleCancelAppointment = async (apt: DisplayAppointment) => {
        if (!isDemo && apt.id) {
            // Deletar permanentemente do banco de dados
            const deleted = await deleteAppointment(apt.id);
            if (!deleted) {
                alert('Erro ao excluir agendamento. Tente novamente.');
                return;
            }
        }
        setAppointments(prev => prev.filter(a => a.id !== apt.id));
        setShowDetailModal(null);
    };

    const handleSendReminder = (apt: DisplayAppointment) => {
        const message = `Olá ${apt.clientName}! 👋\n\nLembrete do seu treino amanhã:\n📅 ${selectedDate.toLocaleDateString('pt-BR')}\n⏰ ${apt.time}\n\nTe vejo lá! 💪`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${apt.phone}?text=${encoded}`, '_blank');
    };

    const handleCreateAppointment = async () => {
        if (!newAppointment.clientId) {
            // Visual feedback already shown by disabled button
            return;
        }

        // Clear previous error
        setErrorMessage(null);

        // Check for time conflicts
        const hasConflict = appointments.some(apt => {
            const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
            const aptTime = aptHours * 60 + aptMinutes;
            const aptEnd = aptTime + durationToMinutes(apt.duration);

            const [newHours, newMinutes] = newAppointment.time.split(':').map(Number);
            const newTime = newHours * 60 + newMinutes;
            const newEnd = newTime + durationToMinutes(newAppointment.duration);

            // Check for overlap
            return (newTime >= aptTime && newTime < aptEnd) ||
                (aptTime >= newTime && aptTime < newEnd);
        });

        if (hasConflict) {
            setErrorMessage('⚠️ Conflito de horário! Já existe um agendamento neste horário.');
            return;
        }

        setSaving(true);

        const selectedClient = clients.find(c => c.id === newAppointment.clientId);

        if (isDemo) {
            // Just add to local state for demo
            const newApt: DisplayAppointment = {
                id: Date.now().toString(),
                clientId: newAppointment.clientId,
                clientName: selectedClient?.name || 'Novo Aluno',
                clientAvatar: (selectedClient as any)?.avatar || (selectedClient as any)?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedClient?.name || 'N')}&background=3b82f6&color=fff`,
                time: newAppointment.time,
                duration: newAppointment.duration,
                type: newAppointment.type,
                status: 'pending',
                phone: selectedClient?.phone,
            };
            setAppointments(prev => [...prev, newApt].sort((a, b) => a.time.localeCompare(b.time)));
        } else {
            // Create in Supabase
            const dateStr = selectedDate.toISOString().split('T')[0];
            const created = await createAppointment({
                client_id: newAppointment.clientId,
                coach_id: user.id,
                date: dateStr,
                time: newAppointment.time,
                duration: newAppointment.duration,
                type: newAppointment.type,
                status: 'pending',
            });

            if (created) {
                const newApt: DisplayAppointment = {
                    id: created.id,
                    clientId: newAppointment.clientId,
                    clientName: selectedClient?.name || 'Novo Aluno',
                    clientAvatar: (selectedClient as any)?.avatar || (selectedClient as any)?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedClient?.name || 'N')}&background=3b82f6&color=fff`,
                    time: newAppointment.time,
                    duration: newAppointment.duration,
                    type: newAppointment.type,
                    status: 'pending',
                    phone: selectedClient?.phone,
                };
                setAppointments(prev => [...prev, newApt].sort((a, b) => a.time.localeCompare(b.time)));
            }
        }

        setSaving(false);
        setShowNewModal(false);
        setNewAppointment({ clientId: '', time: '09:00', duration: '1h', type: 'training' });
    };

    // Função para limpar todos os agendamentos duplicados
    const handleCleanupDuplicates = async () => {
        if (isDemo) {
            alert('Não disponível no modo demo');
            return;
        }

        const confirmCleanup = confirm('⚠️ Isso irá EXCLUIR TODOS os agendamentos deste mês.\n\nDeseja continuar?');
        if (!confirmCleanup) return;

        setLoading(true);
        try {
            const allAppts = await getAllAppointmentsForCoach(user.id);

            if (allAppts.length === 0) {
                alert('Nenhum agendamento encontrado.');
                setLoading(false);
                return;
            }

            const idsToDelete = allAppts.map(a => a.id);
            const deleted = await deleteAppointmentsBulk(idsToDelete);

            if (deleted) {
                alert(`✅ ${idsToDelete.length} agendamentos excluídos com sucesso!`);
                setAppointments([]);
            } else {
                alert('Erro ao excluir agendamentos. Tente novamente.');
            }
        } catch (error) {
            console.error('Error in cleanup:', error);
            alert('Erro ao limpar agendamentos.');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pb-12">
            {/* Header */}
            <header className="px-6 pt-14 pb-4 animate-fade-in relative z-30">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-white tracking-tight">Agenda</h1>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Sincronização Elite</p>
                    </div>
                    <div className="flex gap-2">
                        {!isDemo && (
                            <button
                                onClick={() => setShowMonthlyModal(true)}
                                className="relative size-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                title="Agendamento Mensal"
                            >
                                <span className="text-sm">📅</span>
                                {monthlyBatchesCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold size-4 rounded-full flex items-center justify-center">
                                        {monthlyBatchesCount}
                                    </span>
                                )}
                            </button>
                        )}
                        {!isDemo && (
                            <button
                                onClick={handleCleanupDuplicates}
                                className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                title="Limpar Todos Agendamentos"
                            >
                                <span className="material-symbols-outlined text-lg">delete_sweep</span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-glow active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined">add</span>
                        </button>
                    </div>
                </div>

                {/* Month & View Toggle */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black text-white tracking-tight">
                        {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </h2>
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'day' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
                        >
                            Dia
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
                        >
                            Semana
                        </button>
                    </div>
                </div>

                {/* Week Days */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {weekDays.map((day, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(day)}
                            className={`flex flex-col items-center min-w-[54px] py-4 rounded-[20px] transition-all duration-300 ${isSelected(day)
                                ? 'bg-blue-600 text-white shadow-glow scale-105'
                                : isToday(day)
                                    ? 'glass-card border-blue-500/30 text-blue-400'
                                    : 'glass-card text-slate-500'
                                }`}
                        >
                            <span className="text-[9px] font-black uppercase tracking-widest mb-1">
                                {dayNames[i]}
                            </span>
                            <span className="text-lg font-black">{day.getDate()}</span>
                        </button>
                    ))}
                </div>
            </header>

            <main className="px-6 space-y-6">
                {/* Pending Reschedule Requests - Only for coaches with real data */}
                {!isDemo && user?.id && (
                    <PendingRequestsPanel coachId={user.id} />
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 animate-slide-up">
                    <div className="glass-card rounded-[24px] p-4 border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-blue-400 text-lg">event</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hoje</span>
                        </div>
                        <p className="text-2xl font-black text-white">{appointments.length}</p>
                    </div>
                    <div className="glass-card rounded-[24px] p-4 border-l-4 border-emerald-500">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-emerald-400 text-lg">schedule</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próximo</span>
                        </div>
                        <p className="text-xl font-black text-white truncate">{appointments[0]?.time || '--:--'}</p>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="size-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Appointments List */}
                {!loading && (
                    <div className="animate-slide-up stagger-1">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Fluxo de Protocolos</h3>

                        {appointments.length === 0 ? (
                            <div className="glass-card rounded-[28px] p-8 text-center">
                                <span className="material-symbols-outlined text-slate-600 text-4xl mb-3">event_busy</span>
                                <p className="text-slate-500 text-sm font-medium">Nenhum agendamento nesta data</p>
                                <button
                                    onClick={() => setShowNewModal(true)}
                                    className="mt-4 px-6 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white"
                                >
                                    Agendar Horário
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {appointments.map((apt) => (
                                        <motion.button
                                            key={apt.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            onClick={() => setShowDetailModal(apt)}
                                            className="w-full glass-card rounded-[28px] p-4 flex items-center gap-4 active:scale-[0.99] transition-all text-left group hover:border-blue-500/30"
                                        >
                                            {/* Time */}
                                            <div className="text-center w-14 border-r border-white/5 pr-4 mr-1">
                                                <p className="text-lg font-black text-white leading-none mb-1">{(apt.time || '').slice(0, 5)}</p>
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{apt.duration}</p>
                                            </div>

                                            {/* Client Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="size-11 rounded-2xl bg-cover bg-center border-2 border-white/10 group-hover:border-blue-500/30 transition-colors"
                                                        style={{ backgroundImage: `url(${apt.clientAvatar})` }}
                                                    />
                                                    <div>
                                                        <h4 className="font-black text-white text-sm leading-tight mb-0.5">{apt.clientName}</h4>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`size-1.5 rounded-full ${getTypeColor(apt.type)}`}></div>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{getTypeLabel(apt.type)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${apt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                apt.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-white/5 text-slate-500 border border-white/5'
                                                }`}>
                                                {apt.status === 'confirmed' ? '✓' : apt.status === 'pending' ? '⋯' : '●'}
                                            </div>

                                            {/* Quick Delete Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Excluir agendamento de ${apt.clientName} às ${apt.time}?`)) {
                                                        handleCancelAppointment(apt);
                                                    }
                                                }}
                                                className="size-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                title="Excluir agendamento"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}

                {/* Available Slots */}
                {!loading && freeSlots.length > 0 && (
                    <div className="animate-slide-up stagger-2 pb-8">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Janelas Disponíveis</h3>

                        <div className="grid grid-cols-4 gap-2">
                            {freeSlots.map((time) => (
                                <button
                                    key={time}
                                    onClick={() => {
                                        setNewAppointment(prev => ({ ...prev, time }));
                                        setShowNewModal(true);
                                    }}
                                    className="py-3 glass-card rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 active:scale-95 transition-all"
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Detail Modal */}
            <AnimatePresence>
                {showDetailModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-md mx-auto bg-slate-900 rounded-t-[40px] p-8 border-t border-white/10"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowDetailModal(null)}
                                className="absolute top-6 right-6 size-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8"></div>

                            <div className="flex items-center gap-5 mb-8">
                                <div
                                    className="size-20 rounded-3xl bg-cover bg-center border-2 border-white/10 shadow-glow"
                                    style={{ backgroundImage: `url(${showDetailModal.clientAvatar})` }}
                                />
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">{showDetailModal.clientName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest ${getTypeColor(showDetailModal.type)}`}>
                                            {getTypeLabel(showDetailModal.type)}
                                        </span>
                                        <span className="text-slate-500 text-sm font-bold">•</span>
                                        <span className="text-slate-400 font-black text-sm">{showDetailModal.time}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleSendReminder(showDetailModal)}
                                    className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-3xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/20"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                    Lembrete WhatsApp
                                </button>

                                {showDetailModal.status === 'pending' && (
                                    <button
                                        onClick={() => handleConfirmAppointment(showDetailModal)}
                                        className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest shadow-lg shadow-blue-900/20"
                                    >
                                        <span className="material-symbols-outlined">check</span>
                                        Confirmar Protocolo
                                    </button>
                                )}

                                <button
                                    onClick={() => handleCancelAppointment(showDetailModal)}
                                    className="w-full h-16 bg-red-500/10 border border-red-500/20 text-red-500 font-black rounded-3xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                    Cancelar Agendamento
                                </button>

                                <button
                                    onClick={() => setShowDetailModal(null)}
                                    className="w-full h-14 bg-white/5 text-slate-500 font-bold rounded-2xl active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Appointment Modal */}
            <AnimatePresence>
                {showNewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="w-full max-w-md mx-auto bg-slate-900 rounded-t-[40px] p-8 pb-28 border-t border-white/10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6"></div>

                            {/* Header - padrão igual ao WeeklyPatternSelector */}
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="text-blue-400 hover:text-blue-300 mb-3 flex items-center gap-2"
                                >
                                    <span>←</span> Voltar
                                </button>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    Novo Agendamento
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 animate-slide-up">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                                        <p className="text-red-400 text-sm font-bold flex-1">{errorMessage}</p>
                                        <button onClick={() => setErrorMessage(null)} className="text-red-500/50 hover:text-red-500">
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6 mb-8">
                                {/* Client Selection */}
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                        Selecionar Aluno
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                        {(isDemo ? mockClients : clients).map((client: any) => (
                                            <button
                                                key={client.id}
                                                onClick={() => setNewAppointment(prev => ({ ...prev, clientId: client.id }))}
                                                className={`flex flex-col items-center p-3 rounded-2xl transition-all ${newAppointment.clientId === client.id
                                                    ? 'bg-blue-600 border-blue-500'
                                                    : 'bg-[#0F1629] border border-gray-700 hover:bg-[#1a2235]'
                                                    }`}
                                            >
                                                <div
                                                    className="size-12 rounded-xl bg-cover bg-center border-2 border-white/10 mb-2"
                                                    style={{ backgroundImage: `url(${client.avatar || client.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=3b82f6&color=fff`})` }}
                                                />
                                                <span className="text-[9px] font-bold text-white truncate w-full text-center">
                                                    {client.name.split(' ')[0]}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                        Horário
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {freeSlots.map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => setNewAppointment(prev => ({ ...prev, time }))}
                                                className={`py-2 rounded-lg text-xs font-bold transition-all ${newAppointment.time === time
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-[#0F1629] text-gray-400 hover:bg-[#1a2235] hover:text-white'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Type Selection */}
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                        Tipo de Sessão
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { value: 'training', label: 'Treino', icon: '🏋️' },
                                            { value: 'assessment', label: 'Avaliação', icon: '📊' },
                                        ].map((type) => (
                                            <button
                                                key={type.value}
                                                onClick={() => setNewAppointment(prev => ({ ...prev, type: type.value as any }))}
                                                className={`
                                                    py-3 px-2 rounded-lg text-xs font-semibold transition-all
                                                    ${newAppointment.type === type.value
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-[#0F1629] text-gray-400 hover:bg-[#1a2235]'
                                                    }
                                                `}
                                            >
                                                <div className="text-lg mb-1">{type.icon}</div>
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Duration - Fixado em 1h */}
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                        Duração
                                    </h3>
                                    <div className="flex justify-center">
                                        <div className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold">
                                            1h
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleCreateAppointment}
                                disabled={saving || !newAppointment.clientId}
                                className="w-full py-4 rounded-xl font-bold text-white transition-all bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                ) : (
                                    'CONFIRMAR'
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Monthly Schedule Modal */}
            <AnimatePresence>
                {showMonthlyModal && !isDemo && (
                    <MonthlyScheduleModal
                        coachId={user.id}
                        month={selectedDate.getMonth() + 1}
                        year={selectedDate.getFullYear()}
                        onClose={() => setShowMonthlyModal(false)}
                        onSuccess={() => {
                            setShowMonthlyModal(false);
                            // Refresh appointments
                            const dateStr = selectedDate.toISOString().split('T')[0];
                            getAppointments(user.id, dateStr).then(data => {
                                if (data.length > 0) {
                                    const mapped = data.map((apt: any) => ({
                                        id: apt.id,
                                        clientId: apt.client_id,
                                        clientName: apt.clients?.name || 'Cliente',
                                        clientAvatar: apt.clients?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.clients?.name || 'C')}&background=3b82f6&color=fff`,
                                        time: (apt.time || '').slice(0, 5) || '00:00',
                                        duration: apt.duration,
                                        type: apt.type,
                                        status: apt.status,
                                        phone: apt.clients?.phone,
                                    }));
                                    setAppointments(mapped);
                                }
                            });
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarView;
