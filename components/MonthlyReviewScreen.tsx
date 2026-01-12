import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMonthlyDates } from '../services/monthlyScheduleService';

interface MonthlyReviewScreenProps {
    clientId: string;
    clientName: string;
    month: number;
    year: number;
    weekDays: number[];
    times: Record<number, string>;
    sessionType: 'training' | 'assessment' | 'consultation';
    duration: string;
    onBack: () => void;
    onConfirm: (exceptions: string[]) => void;
}

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MonthlyReviewScreen: React.FC<MonthlyReviewScreenProps> = ({
    clientId,
    clientName,
    month,
    year,
    weekDays,
    times,
    sessionType,
    duration,
    onBack,
    onConfirm
}) => {
    const [exceptions, setExceptions] = useState<string[]>([]);
    const [showAddException, setShowAddException] = useState(false);
    const [newExceptionDate, setNewExceptionDate] = useState('');
    const [newExceptionReason, setNewExceptionReason] = useState('');

    // Generate all dates
    const allDates = generateMonthlyDates(year, month, weekDays, exceptions);

    // Calendar data
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    // Add empty cells for days before month start
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const getSessionTime = (day: number) => {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
        const dateStr = date.toISOString().split('T')[0];

        if (exceptions.includes(dateStr)) return null;
        if (!weekDays.includes(dayOfWeek)) return null;

        return times[dayOfWeek];
    };

    const addException = () => {
        if (!newExceptionDate) return;

        if (!exceptions.includes(newExceptionDate)) {
            setExceptions([...exceptions, newExceptionDate]);
        }

        setNewExceptionDate('');
        setNewExceptionReason('');
        setShowAddException(false);
    };

    const removeException = (date: string) => {
        setExceptions(exceptions.filter(d => d !== date));
    };

    const getSessionTypeLabel = () => {
        const labels = {
            training: '🏋️ Treino',
            assessment: '📊 Avaliação',
            consultation: '💬 Consulta'
        };
        return labels[sessionType];
    };

    const totalSessions = allDates.length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0A0E27] rounded-2xl p-6 max-w-lg w-full border border-[#1E293B] shadow-2xl my-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={onBack}
                        className="text-blue-400 hover:text-blue-300 mb-3 flex items-center gap-2"
                    >
                        <span>←</span> Voltar
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-1">
                        Revisão Final
                    </h2>
                </div>

                {/* Calendar */}
                <div className="mb-6 bg-[#0F1629] rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-3 text-center">
                        {MONTHS[month - 1]} {year}
                    </h3>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {WEEKDAY_LABELS.map((label, i) => (
                            <div key={i} className="text-center text-xs text-gray-500 font-semibold">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            if (day === null) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }

                            const time = getSessionTime(day);
                            const hasSession = time !== null;

                            return (
                                <div
                                    key={day}
                                    className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                    ${hasSession
                                            ? 'bg-blue-600/20 border border-blue-500/50'
                                            : 'text-gray-600'
                                        }
                  `}
                                >
                                    <span className={hasSession ? 'text-white font-semibold' : ''}>
                                        {day}
                                    </span>
                                    {hasSession && (
                                        <span className="text-xs text-blue-300 mt-0.5">
                                            {time}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Summary Info */}
                <div className="mb-6 bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-white">
                            <span>📅</span>
                            <span className="font-semibold">{totalSessions} sessões agendadas</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <span>👤</span>
                            <span>{clientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <span>{getSessionTypeLabel()}</span>
                            <span>•</span>
                            <span>{duration}</span>
                        </div>
                    </div>
                </div>

                {/* Exceptions */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        Exceções
                    </h3>

                    {exceptions.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {exceptions.map((date) => (
                                <div
                                    key={date}
                                    className="flex items-center justify-between bg-[#0F1629] p-3 rounded-lg"
                                >
                                    <span className="text-white text-sm">
                                        {new Date(date).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'short'
                                        })}
                                    </span>
                                    <button
                                        onClick={() => removeException(date)}
                                        className="text-red-400 hover:text-red-300 text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <AnimatePresence>
                        {showAddException ? (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-[#0F1629] p-4 rounded-lg space-y-3">
                                    <input
                                        type="date"
                                        value={newExceptionDate}
                                        onChange={(e) => setNewExceptionDate(e.target.value)}
                                        min={`${year}-${String(month).padStart(2, '0')}-01`}
                                        max={`${year}-${String(month).padStart(2, '0')}-${daysInMonth}`}
                                        className="w-full bg-[#0A0E27] text-white p-2 rounded-lg text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={addException}
                                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold"
                                        >
                                            Adicionar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAddException(false);
                                                setNewExceptionDate('');
                                            }}
                                            className="px-4 bg-gray-700 text-white py-2 rounded-lg text-sm"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <button
                                onClick={() => setShowAddException(true)}
                                className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                            >
                                + Adicionar exceção
                            </button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Confirm Button */}
                <button
                    onClick={() => onConfirm(exceptions)}
                    className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                >
                    CONFIRMAR AGENDAMENTO MENSAL
                </button>
            </motion.div>
        </motion.div>
    );
};

export default MonthlyReviewScreen;
