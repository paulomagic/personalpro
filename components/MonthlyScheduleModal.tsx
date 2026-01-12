import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import MonthlyScheduleTypeSelection from './MonthlyScheduleTypeSelection';
import WeeklyPatternSelector from './WeeklyPatternSelector';
import MonthlyReviewScreen from './MonthlyReviewScreen';
import { createMonthlyScheduleBatch } from '../services/monthlyScheduleService';
import { MonthlyScheduleConfig } from '../types';

interface MonthlyScheduleModalProps {
    coachId: string;
    clientId?: string;
    clientName?: string;
    month: number;
    year: number;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'type' | 'configure' | 'review' | 'creating';

const MonthlyScheduleModal: React.FC<MonthlyScheduleModalProps> = ({
    coachId,
    clientId: initialClientId,
    clientName: initialClientName,
    month,
    year,
    onClose,
    onSuccess
}) => {
    const [step, setStep] = useState<Step>('type');
    const [patternType, setPatternType] = useState<'weekly' | 'specific_dates' | 'custom'>('weekly');
    const [config, setConfig] = useState<Partial<MonthlyScheduleConfig>>({
        month,
        year
    });
    const [isCreating, setIsCreating] = useState(false);

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
            clientId: initialClientId || config.clientId
        });
        setStep('review');
    };

    const handleConfirm = async (exceptions: string[]) => {
        setIsCreating(true);

        try {
            const finalConfig: MonthlyScheduleConfig = {
                clientId: initialClientId || config.clientId!,
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
        } catch (error) {
            console.error('Error creating monthly schedule:', error);
            alert('Erro ao criar agendamento mensal. Tente novamente.');
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
                    clientId={initialClientId || ''}
                    clientName={initialClientName || ''}
                    onBack={() => setStep('type')}
                    onNext={handleConfigureComplete}
                />
            )}

            {step === 'review' && (
                <MonthlyReviewScreen
                    key="review"
                    clientId={initialClientId || config.clientId || ''}
                    clientName={initialClientName || ''}
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
