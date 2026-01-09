import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Send, AlertCircle } from 'lucide-react';
import { createRescheduleRequest } from '../services/supabaseClient';
import { Appointment } from '../services/supabaseClient';

interface RescheduleRequestModalProps {
    appointment: Appointment;
    clientId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const RescheduleRequestModal: React.FC<RescheduleRequestModalProps> = ({
    appointment,
    clientId,
    onClose,
    onSuccess
}) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const timeSlots = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00'
    ];

    const formatOriginalDate = () => {
        // Parse date without timezone conversion
        const datePart = appointment.date.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dayFormatted = date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        // Use appointment.time field directly for correct time
        return `${dayFormatted} às ${appointment.time || '00:00'}`;
    };

    const handleSubmit = async () => {
        if (!selectedDate || !selectedTime) {
            setError('Selecione uma nova data e horário');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create ISO string directly without Date conversion to avoid timezone issues
            // selectedTime format: "18:00", need to add seconds
            const requestedDateStr = `${selectedDate}T${selectedTime}:00`;

            // Combine appointment date with appointment.time for original date
            const originalDatePart = appointment.date.split('T')[0]; // "2026-01-09"
            // appointment.time might be "17:00" or "17:00:00", normalize it
            const timeValue = appointment.time?.includes(':')
                ? (appointment.time.length === 5 ? `${appointment.time}:00` : appointment.time.slice(0, 8))
                : '00:00:00';
            const originalDateStr = `${originalDatePart}T${timeValue}`;

            const result = await createRescheduleRequest({
                appointmentId: appointment.id,
                clientId: clientId,
                coachId: appointment.coach_id,
                originalDate: originalDateStr,  // Now includes the correct time
                requestedDate: requestedDateStr,
                reason: reason || undefined
            });

            if (result) {
                onSuccess();
            } else {
                setError('Erro ao enviar solicitação. Tente novamente.');
            }
        } catch (err) {
            setError('Erro ao enviar solicitação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Get tomorrow's date as minimum
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-slate-900 rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[85vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-white">Solicitar Reagendamento</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Seu personal será notificado
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-10 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:bg-white/20 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Original Appointment */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Agendamento Atual
                        </p>
                        <p className="text-white font-bold">
                            {appointment.type === 'training' ? '🏋️ Treino' :
                                appointment.type === 'assessment' ? '📊 Avaliação' : '💬 Consulta'}
                        </p>
                        <p className="text-sm text-slate-400 capitalize">
                            {formatOriginalDate()}
                        </p>
                    </div>

                    {/* New Date Selection */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">
                                <Calendar size={14} className="inline mr-2" />
                                Nova Data
                            </label>
                            <input
                                type="date"
                                min={minDate}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">
                                <Clock size={14} className="inline mr-2" />
                                Novo Horário
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {timeSlots.map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        className={`py-2 px-3 rounded-xl text-sm font-bold transition-all ${selectedTime === time
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">
                                Motivo (opcional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ex: Compromisso de trabalho..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors resize-none h-20"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
                            <AlertCircle size={18} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedDate || !selectedTime}
                        className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${loading || !selectedDate || !selectedTime
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 active:scale-[0.98]'
                            }`}
                    >
                        <Send size={20} />
                        {loading ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>

                    <p className="text-center text-xs text-slate-500 mt-4">
                        Aguarde a confirmação do seu personal
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RescheduleRequestModal;
