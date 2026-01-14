import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getClients, DBClient, Appointment } from '../services/supabaseClient';
import { supabase } from '../services/supabaseClient';

interface WeeklyPatternSelectorProps {
    coachId: string;
    clientId?: string;
    clientName?: string;
    onBack: () => void;
    onNext: (config: {
        clientId: string;
        clientName: string;
        weekDays: number[];
        times: Record<number, string>;
        sessionType: 'training' | 'assessment' | 'consultation';
        duration: string;
    }) => void;
}

const WEEKDAYS = [
    { id: 1, label: 'SEG', name: 'Segunda-feira' },
    { id: 2, label: 'TER', name: 'Terça-feira' },
    { id: 3, label: 'QUA', name: 'Quarta-feira' },
    { id: 4, label: 'QUI', name: 'Quinta-feira' },
    { id: 5, label: 'SEX', name: 'Sexta-feira' },
    { id: 6, label: 'SÁB', name: 'Sábado' },
    { id: 7, label: 'DOM', name: 'Domingo' }
];

const WeeklyPatternSelector: React.FC<WeeklyPatternSelectorProps> = ({
    coachId,
    clientId: initialClientId,
    clientName: initialClientName,
    onBack,
    onNext
}) => {
    const [clients, setClients] = useState<DBClient[]>([]);
    const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
    const [selectedClientName, setSelectedClientName] = useState(initialClientName || '');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [times, setTimes] = useState<Record<number, string>>({});
    const [sessionType, setSessionType] = useState<'training' | 'assessment' | 'consultation'>('training');
    const [duration, setDuration] = useState('1h');
    const [useSameTime, setUseSameTime] = useState(true);
    const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
    const [showTimeSelector, setShowTimeSelector] = useState(false);

    // Horários disponíveis para seleção
    const ALL_TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

    useEffect(() => {
        const fetchClients = async () => {
            const data = await getClients(coachId);
            setClients(data);
        };
        if (coachId) {
            fetchClients();
        }
    }, [coachId]);

    // Buscar horários ocupados
    useEffect(() => {
        const fetchOccupiedTimes = async () => {
            if (!supabase || !coachId) return;

            // Buscar todos os appointments para o mês atual
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
            const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('appointments')
                .select('time')
                .eq('coach_id', coachId)
                .gte('date', firstDay)
                .lte('date', lastDay)
                .neq('status', 'cancelled');

            if (error) {
                console.error('Error fetching occupied times:', error);
                return;
            }

            // Extrair horários únicos ocupados
            const times = [...new Set(data?.map(a => (a.time || '').slice(0, 5)) || [])];
            setOccupiedTimes(times);
        };

        fetchOccupiedTimes();
    }, [coachId]);

    const toggleDay = (dayId: number) => {
        if (selectedDays.includes(dayId)) {
            setSelectedDays(selectedDays.filter(d => d !== dayId));
            const newTimes = { ...times };
            delete newTimes[dayId];
            setTimes(newTimes);
        } else {
            setSelectedDays([...selectedDays, dayId].sort());
            // Set default time if using same time
            if (useSameTime && Object.keys(times).length > 0) {
                const firstTime = Object.values(times)[0];
                setTimes({ ...times, [dayId]: firstTime });
            } else if (!times[dayId]) {
                setTimes({ ...times, [dayId]: '14:00' });
            }
        }
    };

    const updateTime = (dayId: number, time: string) => {
        if (useSameTime) {
            // Update all selected days
            const newTimes: Record<number, string> = {};
            selectedDays.forEach(id => {
                newTimes[id] = time;
            });
            setTimes(newTimes);
        } else {
            setTimes({ ...times, [dayId]: time });
        }
    };

    const handleNext = () => {
        if (!selectedClientId || selectedDays.length === 0) return;

        onNext({
            clientId: selectedClientId,
            clientName: selectedClientName,
            weekDays: selectedDays,
            times,
            sessionType,
            duration
        });
    };

    const handleSelectClient = (client: DBClient) => {
        setSelectedClientId(client.id);
        setSelectedClientName(client.name);
    };

    const canProceed = selectedClientId && selectedDays.length > 0 && selectedDays.every(day => times[day]);

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
                className="bg-[#0A0E27] rounded-2xl p-6 max-w-md w-full border border-[#1E293B] shadow-2xl my-8"
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
                        Padrão Semanal
                    </h2>
                    <p className="text-sm text-gray-400">
                        Configure o agendamento mensal
                    </p>
                </div>

                {/* Client Selection */}
                {!initialClientId && (
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Selecionar Aluno
                        </h3>
                        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                            {clients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => handleSelectClient(client)}
                                    className={`flex flex-col items-center p-3 rounded-2xl transition-all ${selectedClientId === client.id
                                        ? 'bg-blue-600 border-blue-500'
                                        : 'bg-[#0F1629] border border-gray-700 hover:bg-[#1a2235]'
                                        }`}
                                >
                                    <div
                                        className="size-12 rounded-xl bg-cover bg-center border-2 border-white/10 mb-2"
                                        style={{ backgroundImage: `url(${client.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=3b82f6&color=fff`})` }}
                                    />
                                    <span className="text-[9px] font-bold text-white truncate w-full text-center">
                                        {client.name.split(' ')[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Week Days Selector */}
                <div className="mb-6">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        {WEEKDAYS.slice(0, 4).map((day) => (
                            <button
                                key={day.id}
                                onClick={() => toggleDay(day.id)}
                                className={`
                  py-3 px-4 rounded-xl font-semibold text-sm transition-all
                  ${selectedDays.includes(day.id)
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-transparent border border-gray-700 text-gray-400 hover:border-blue-500'
                                    }
                `}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {WEEKDAYS.slice(4).map((day) => (
                            <button
                                key={day.id}
                                onClick={() => toggleDay(day.id)}
                                className={`
                  py-3 px-4 rounded-xl font-semibold text-sm transition-all
                  ${selectedDays.includes(day.id)
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-transparent border border-gray-700 text-gray-400 hover:border-blue-500'
                                    }
                `}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Same Time Toggle */}
                {selectedDays.length > 1 && (
                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useSameTime}
                                onChange={(e) => setUseSameTime(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600"
                            />
                            Usar mesmo horário para todos os dias
                        </label>
                    </div>
                )}

                {/* Times */}
                {selectedDays.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Horários {occupiedTimes.length > 0 && <span className="text-red-400">(⚫ = ocupado)</span>}
                        </h3>
                        <div className="space-y-2">
                            {useSameTime ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-[#0F1629] p-3 rounded-lg">
                                        <span className="text-white text-sm">Horário único</span>
                                        <span className="text-blue-400 font-bold">{times[selectedDays[0]] || 'Selecione'}</span>
                                    </div>
                                    {/* Grid de slots */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {ALL_TIMES.map((time) => {
                                            const isOccupied = occupiedTimes.includes(time);
                                            const isSelected = times[selectedDays[0]] === time;
                                            return (
                                                <button
                                                    key={time}
                                                    onClick={() => !isOccupied && updateTime(selectedDays[0], time)}
                                                    disabled={isOccupied}
                                                    className={`py-2 rounded-lg text-xs font-bold transition-all ${isOccupied
                                                            ? 'bg-red-500/10 text-red-400/50 border border-red-500/20 cursor-not-allowed line-through'
                                                            : isSelected
                                                                ? 'bg-blue-600 text-white shadow-lg'
                                                                : 'bg-[#0F1629] text-gray-400 hover:bg-[#1a2235] hover:text-white'
                                                        }`}
                                                    title={isOccupied ? 'Horário ocupado' : `Selecionar ${time}`}
                                                >
                                                    {time}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                selectedDays.map((dayId) => {
                                    const day = WEEKDAYS.find(d => d.id === dayId);
                                    return (
                                        <div key={dayId} className="space-y-2">
                                            <div className="flex items-center justify-between bg-[#0F1629] p-3 rounded-lg">
                                                <span className="text-white text-sm">{day?.name}</span>
                                                <span className="text-blue-400 font-bold">{times[dayId] || 'Selecione'}</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {ALL_TIMES.map((time) => {
                                                    const isOccupied = occupiedTimes.includes(time);
                                                    const isSelected = times[dayId] === time;
                                                    return (
                                                        <button
                                                            key={time}
                                                            onClick={() => !isOccupied && updateTime(dayId, time)}
                                                            disabled={isOccupied}
                                                            className={`py-2 rounded-lg text-xs font-bold transition-all ${isOccupied
                                                                    ? 'bg-red-500/10 text-red-400/50 border border-red-500/20 cursor-not-allowed line-through'
                                                                    : isSelected
                                                                        ? 'bg-blue-600 text-white shadow-lg'
                                                                        : 'bg-[#0F1629] text-gray-400 hover:bg-[#1a2235] hover:text-white'
                                                                }`}
                                                            title={isOccupied ? 'Horário ocupado' : `Selecionar ${time}`}
                                                        >
                                                            {time}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Session Type */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        Tipo de Sessão
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: 'training', label: 'Treino', icon: '🏋️' },
                            { value: 'assessment', label: 'Avaliação', icon: '📊' },
                            { value: 'consultation', label: 'Consulta', icon: '💬' }
                        ].map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setSessionType(type.value as any)}
                                className={`
                  py-3 px-2 rounded-lg text-xs font-semibold transition-all
                  ${sessionType === type.value
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

                {/* Duration */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        Duração
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        {['30min', '1h', '1h30', '2h'].map((dur) => (
                            <button
                                key={dur}
                                onClick={() => setDuration(dur)}
                                className={`
                  py-2 px-3 rounded-lg text-sm font-semibold transition-all
                  ${duration === dur
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-[#0F1629] text-gray-400 hover:bg-[#1a2235]'
                                    }
                `}
                            >
                                {dur}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`
            w-full py-4 rounded-xl font-bold text-white transition-all
            ${canProceed
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                            : 'bg-gray-700 cursor-not-allowed opacity-50'
                        }
          `}
                >
                    PRÓXIMO
                </button>
            </motion.div>
        </motion.div>
    );
};

export default WeeklyPatternSelector;
