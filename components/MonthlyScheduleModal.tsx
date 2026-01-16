import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MonthlyScheduleTypeSelection from './MonthlyScheduleTypeSelection';
import WeeklyPatternSelector from './WeeklyPatternSelector';
import MonthlyReviewScreen from './MonthlyReviewScreen';
import { createMonthlyScheduleBatch } from '../services/monthlyScheduleService';
import { MonthlyScheduleConfig } from '../types';
import { getClients, DBClient } from '../services/supabaseClient';

interface MonthlyScheduleModalProps {
    coachId: string;
    clientId?: string;
    clientName?: string;
    month: number;
    year: number;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'select-client' | 'type' | 'configure' | 'review' | 'creating';

const MonthlyScheduleModal: React.FC<MonthlyScheduleModalProps> = ({
    coachId,
    clientId: initialClientId,
    clientName: initialClientName,
    month,
    year,
    onClose,
    onSuccess
}) => {
    const [step, setStep] = useState<Step>(initialClientId ? 'type' : 'select-client');
    const [patternType, setPatternType] = useState<'weekly' | 'specific_dates' | 'custom'>('weekly');
    const [config, setConfig] = useState<Partial<MonthlyScheduleConfig>>({
        month,
        year,
        clientId: initialClientId
    });
    const [isCreating, setIsCreating] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
    const [selectedClientName, setSelectedClientName] = useState<string>(initialClientName || '');
    const [clients, setClients] = useState<DBClient[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    // Load clients on mount
    useEffect(() => {
        const fetchClients = async () => {
            setLoadingClients(true);
            try {
                const clientsData = await getClients(coachId);
                setClients(clientsData);
            } catch (error) {
                console.error('Error fetching clients:', error);
            } finally {
                setLoadingClients(false);
            }
        };

        if (!initialClientId) {
            fetchClients();
        }
    }, [coachId, initialClientId]);

    const handleClientSelect = (client: DBClient) => {
        setSelectedClientId(client.id);
        setSelectedClientName(client.name);
        setConfig({ ...config, clientId: client.id });
        setStep('type');
    };

    const handleSelectType = (type: 'weekly' | 'specific_dates' | 'custom') => {
        setPatternType(type);
        setConfig({ ...config, patternType: type });
        setStep('configure');
    };

    const handleConfigureComplete = (data: {
        weekDays: number[];
        times: Record<number, string>;
        sessionType: 'training' | 'assessment' | 'consultation';
        duration: string;
    }) => {
        setConfig({
            ...config,
            weekDays: data.weekDays,
            times: data.times,
            sessionType: data.sessionType,
            duration: data.duration,
            clientId: selectedClientId || config.clientId
        });
        setStep('review');
    };

    const handleConfirm = async (exceptions: string[]) => {
        setIsCreating(true);

        try {
            const finalConfig: MonthlyScheduleConfig = {
                clientId: selectedClientId || config.clientId!,
                patternType: config.patternType!,
                month: config.month!,
                year: config.year!,
                weekDays: config.weekDays,
                times: config.times,
                sessionType: config.sessionType!,
                duration: config.duration!,
                exceptions
            };

            const result = await createMonthlyScheduleBatch(coachId, finalConfig);

            if (result) {
                onSuccess();
                onClose();
            } else {
                alert('Erro ao criar agendamento mensal. Tente novamente.');
                setIsCreating(false);
            }
        } catch (error: any) {
            console.error('Error creating monthly schedule:', error);
            const errorMessage = error?.message?.includes('Conflito')
                ? error.message
                : 'Erro ao criar agendamento mensal. Tente novamente.';
            alert(errorMessage);
            setIsCreating(false);
        }
    };

    if (isCreating) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0A0E27] rounded-2xl p-8 max-w-md w-full border border-[#1E293B] shadow-2xl text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <h3 className="text-white text-xl font-bold mb-2">
                        Criando agendamentos...
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Aguarde enquanto processamos seu agendamento mensal
                    </p>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {step === 'select-client' && (
                <motion.div
                    key="select-client"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50"
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="w-full max-w-md mx-auto bg-slate-900 rounded-t-[40px] p-8 border-t border-white/10 max-h-[85vh] overflow-y-auto"
                    >
                        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8"></div>

                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                                Selecionar Aluno
                            </h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                                Para quem é o agendamento mensal?
                            </p>
                        </div>

                        {loadingClients ? (
                            <div className="flex justify-center py-12">
                                <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : clients.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-slate-600 text-5xl mb-4">person_off</span>
                                <p className="text-slate-500 text-sm">Nenhum aluno cadastrado</p>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-8">
                                {clients.map((client) => (
                                    <button
                                        key={client.id}
                                        onClick={() => handleClientSelect(client)}
                                        className="w-full glass-card rounded-3xl p-5 flex items-center gap-4 hover:bg-blue-600/10 hover:border-blue-500/30 active:scale-[0.98] transition-all"
                                    >
                                        <div
                                            className="size-14 rounded-2xl bg-cover bg-center border-2 border-white/10"
                                            style={{
                                                backgroundImage: `url(${client.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=3b82f6&color=fff`})`
                                            }}
                                        />
                                        <div className="flex-1 text-left">
                                            <h4 className="font-black text-white text-base leading-tight">
                                                {client.name}
                                            </h4>
                                            {client.email && (
                                                <p className="text-[10px] text-slate-500 font-bold mt-1">
                                                    {client.email}
                                                </p>
                                            )}
                                        </div>
                                        <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full h-14 bg-white/5 text-slate-500 font-bold rounded-2xl active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]"
                        >
                            Cancelar
                        </button>
                    </motion.div>
                </motion.div>
            )}

            {step === 'type' && (
                <MonthlyScheduleTypeSelection
                    key="type"
                    onSelectType={handleSelectType}
                    onClose={onClose}
                />
            )}

            {step === 'configure' && patternType === 'weekly' && (
                <WeeklyPatternSelector
                    key="configure"
                    coachId={coachId}
                    clientId={selectedClientId || ''}
                    clientName={selectedClientName || ''}
                    onBack={() => setStep('type')}
                    onNext={handleConfigureComplete}
                />
            )}

            {step === 'review' && (
                <MonthlyReviewScreen
                    key="review"
                    clientId={selectedClientId || config.clientId || ''}
                    clientName={selectedClientName || ''}
                    month={month}
                    year={year}
                    weekDays={config.weekDays || []}
                    times={config.times || {}}
                    sessionType={config.sessionType || 'training'}
                    duration={config.duration || '1h'}
                    onBack={() => setStep('configure')}
                    onConfirm={handleConfirm}
                />
            )}
        </AnimatePresence>
    );
};

export default MonthlyScheduleModal;
