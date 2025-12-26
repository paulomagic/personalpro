
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
        <div className="max-w-md mx-auto min-h-screen bg-white pb-8">
            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 z-30">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="size-10 rounded-full bg-slate-50 flex items-center justify-center active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Agenda</h1>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>

                {/* Month & View Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">
                            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                        </h2>
                    </div>
                    <div className="flex bg-slate-100 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Dia
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Semana
                        </button>
                    </div>
                </div>

                {/* Week Days */}
                <div className="flex gap-1 mt-4">
                    {weekDays.map((day, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(day)}
                            className={`flex-1 py-2 rounded-xl text-center transition-all ${isSelected(day)
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                    : isToday(day)
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <p className={`text-[10px] font-medium ${isSelected(day) ? 'text-blue-100' : 'text-slate-400'}`}>
                                {dayNames[i]}
                            </p>
                            <p className="text-lg font-bold">{day.getDate()}</p>
                        </button>
                    ))}
                </div>
            </header>

            {/* Today Stats */}
            <div className="px-6 py-4 flex gap-4">
                <div className="flex-1 bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-blue-600 text-lg">event</span>
                        <span className="text-sm font-medium text-slate-500">Hoje</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
                    <p className="text-xs text-slate-400">agendamentos</p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-emerald-600 text-lg">schedule</span>
                        <span className="text-sm font-medium text-slate-500">Próximo</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{appointments[0]?.time || '--:--'}</p>
                    <p className="text-xs text-slate-400">{appointments[0]?.clientName || 'Nenhum'}</p>
                </div>
            </div>

            {/* Appointments List */}
            <div className="px-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Agendamentos</h3>

                <div className="space-y-3">
                    {appointments.map((apt) => (
                        <button
                            key={apt.id}
                            onClick={() => setShowDetailModal(apt)}
                            className="w-full bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.99] transition-all text-left"
                        >
                            {/* Time */}
                            <div className="text-center w-14">
                                <p className="text-lg font-bold text-slate-900">{apt.time}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{apt.duration}</p>
                            </div>

                            {/* Divider */}
                            <div className={`w-1 h-12 rounded-full ${getTypeColor(apt.type)}`}></div>

                            {/* Client Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="size-10 rounded-full bg-cover bg-center border-2 border-white shadow-sm"
                                        style={{ backgroundImage: `url(${apt.clientAvatar})` }}
                                    />
                                    <div>
                                        <h4 className="font-bold text-slate-900">{apt.clientName}</h4>
                                        <p className="text-xs text-slate-400">{getTypeLabel(apt.type)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                    apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-600'
                                }`}>
                                {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'pending' ? 'Pendente' : 'Concluído'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Available Slots */}
            <div className="px-6 mt-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Horários Livres</h3>

                <div className="flex flex-wrap gap-2">
                    {availableSlots.map((time) => (
                        <button
                            key={time}
                            onClick={() => handleBookSlot(time)}
                            className="px-4 py-2 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95 transition-all"
                        >
                            {time}
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                    <div className="w-full max-w-md mx-auto bg-white rounded-t-[32px] p-6 animate-slide-up">
                        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>

                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className="size-16 rounded-full bg-cover bg-center border-2 border-white shadow-lg"
                                style={{ backgroundImage: `url(${showDetailModal.clientAvatar})` }}
                            />
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{showDetailModal.clientName}</h3>
                                <p className="text-slate-400">{getTypeLabel(showDetailModal.type)} • {showDetailModal.time}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleSendReminder(showDetailModal)}
                                className="w-full h-14 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                            >
                                <span className="material-symbols-outlined">send</span>
                                Enviar Lembrete WhatsApp
                            </button>

                            {showDetailModal.status === 'pending' && (
                                <button
                                    onClick={() => handleConfirmAppointment(showDetailModal)}
                                    className="w-full h-14 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                                >
                                    <span className="material-symbols-outlined">check</span>
                                    Confirmar Agendamento
                                </button>
                            )}

                            <button
                                onClick={() => handleCancelAppointment(showDetailModal)}
                                className="w-full h-14 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                            >
                                <span className="material-symbols-outlined">close</span>
                                Cancelar Agendamento
                            </button>

                            <button
                                onClick={() => setShowDetailModal(null)}
                                className="w-full h-14 bg-slate-100 text-slate-700 font-bold rounded-2xl active:scale-[0.98] transition-transform"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Appointment Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                    <div className="w-full max-w-md mx-auto bg-white rounded-t-[32px] p-6">
                        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>

                        <h3 className="text-xl font-bold text-slate-900 mb-6">Novo Agendamento</h3>

                        <p className="text-slate-500 text-center py-8">
                            Em breve você poderá criar novos agendamentos aqui!
                        </p>

                        <button
                            onClick={() => setShowNewModal(false)}
                            className="w-full h-14 bg-slate-100 text-slate-700 font-bold rounded-2xl active:scale-[0.98] transition-transform"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
