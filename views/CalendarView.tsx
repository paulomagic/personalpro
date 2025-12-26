
import React, { useState } from 'react';

interface CalendarViewProps {
    onBack: () => void;
    onSelectClient?: (clientId: string) => void;
}

interface Appointment {
    id: string;
    clientName: string;
    clientAvatar: string;
    time: string;
    duration: string;
    type: 'training' | 'assessment' | 'consultation';
    status: 'confirmed' | 'pending' | 'completed';
    phone?: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onBack, onSelectClient }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [showNewModal, setShowNewModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState<Appointment | null>(null);

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

    // Mock appointments
    const [appointments, setAppointments] = useState<Appointment[]>([
        { id: '1', clientName: 'Ana Silva', clientAvatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=100', time: '07:00', duration: '1h', type: 'training', status: 'confirmed', phone: '5561999999999' },
        { id: '2', clientName: 'Carlos Mendes', clientAvatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=100', time: '08:30', duration: '1h', type: 'training', status: 'confirmed', phone: '5561988888888' },
        { id: '3', clientName: 'Júlia Costa', clientAvatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100', time: '10:00', duration: '1h30', type: 'assessment', status: 'pending', phone: '5561977777777' },
        { id: '4', clientName: 'Ricardo Sousa', clientAvatar: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=100', time: '14:00', duration: '1h', type: 'training', status: 'confirmed', phone: '5561966666666' },
        { id: '5', clientName: 'Marina Santos', clientAvatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100', time: '16:00', duration: '1h', type: 'training', status: 'confirmed', phone: '5561955555555' },
    ]);

    const availableSlots = ['09:00', '11:00', '12:00', '13:00', '15:00', '17:00', '18:00', '19:00', '20:00'];

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

    const handleConfirmAppointment = (apt: Appointment) => {
        setAppointments(prev => prev.map(a =>
            a.id === apt.id ? { ...a, status: 'confirmed' as const } : a
        ));
        setShowDetailModal(null);
    };

    const handleCancelAppointment = (apt: Appointment) => {
        setAppointments(prev => prev.filter(a => a.id !== apt.id));
        setShowDetailModal(null);
    };

    const handleSendReminder = (apt: Appointment) => {
        const message = `Olá ${apt.clientName}! 👋\n\nLembrete do seu treino amanhã:\n📅 ${selectedDate.toLocaleDateString('pt-BR')}\n⏰ ${apt.time}\n\nTe vejo lá! 💪`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${apt.phone}?text=${encoded}`, '_blank');
    };

    const handleBookSlot = (time: string) => {
        alert(`Agendar horário ${time} - Em breve você poderá selecionar o aluno aqui!`);
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
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-glow active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
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
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
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

                {/* Appointments List */}
                <div className="animate-slide-up stagger-1">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Fluxo de Protocolos</h3>

                    <div className="space-y-3">
                        {appointments.map((apt) => (
                            <button
                                key={apt.id}
                                onClick={() => setShowDetailModal(apt)}
                                className="w-full glass-card rounded-[28px] p-4 flex items-center gap-4 active:scale-[0.99] transition-all text-left group hover:border-blue-500/30"
                            >
                                {/* Time */}
                                <div className="text-center w-14 border-r border-white/5 pr-4 mr-1">
                                    <p className="text-lg font-black text-white leading-none mb-1">{apt.time}</p>
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
                            </button>
                        ))}
                    </div>
                </div>

                {/* Available Slots */}
                <div className="animate-slide-up stagger-2 pb-8">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Janelas Disponíveis</h3>

                    <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((time) => (
                            <button
                                key={time}
                                onClick={() => handleBookSlot(time)}
                                className="py-3 glass-card rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 active:scale-95 transition-all"
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            {/* Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end">
                    <div className="w-full max-w-md mx-auto bg-slate-900 rounded-t-[40px] p-8 animate-slide-up border-t border-white/10">
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
                    </div>
                </div>
            )}

            {/* New Appointment Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end">
                    <div className="w-full max-w-md mx-auto bg-slate-900 rounded-t-[40px] p-8 animate-slide-up border-t border-white/10">
                        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8"></div>

                        <div className="text-center mb-10">
                            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Novo Agendamento</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Personalização de Agenda</p>
                        </div>

                        <div className="glass-card rounded-[32px] p-8 border-dashed flex flex-col items-center justify-center text-center gap-4 mb-8">
                            <div className="size-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-400 text-3xl">construction</span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                O módulo de criação rápida está em fase de implantação premium.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowNewModal(false)}
                            className="w-full h-16 bg-white text-slate-950 font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-[0.2em]"
                        >
                            Retornar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
