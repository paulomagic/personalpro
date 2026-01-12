import React from 'react';
import { motion } from 'framer-motion';

interface MonthlyScheduleTypeSelectionProps {
    onSelectType: (type: 'weekly' | 'specific_dates' | 'custom') => void;
    onClose: () => void;
}

const MonthlyScheduleTypeSelection: React.FC<MonthlyScheduleTypeSelectionProps> = ({
    onSelectType,
    onClose
}) => {
    const options = [
        {
            type: 'weekly' as const,
            icon: '📅',
            title: 'Padrão Semanal',
            description: 'Repete o mesmo padrão semanal o mês inteiro',
            available: true
        },
        {
            type: 'specific_dates' as const,
            icon: '🎯',
            title: 'Dias Específicos',
            description: 'Escolha dias específicos do calendário',
            available: true
        },
        {
            type: 'custom' as const,
            icon: '📊',
            title: 'Personalizado',
            description: 'Configure semana por semana com variações',
            available: false // MVP: implementação futura
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0A0E27] rounded-2xl p-6 max-w-md w-full border border-[#1E293B] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Agendamento Mensal
                    </h2>
                    <p className="text-sm text-gray-400">
                        Como você deseja agendar o mês?
                    </p>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {options.map((option) => (
                        <button
                            key={option.type}
                            onClick={() => option.available && onSelectType(option.type)}
                            disabled={!option.available}
                            className={`
                w-full p-4 rounded-xl border text-left transition-all
                ${option.available
                                    ? 'border-[#2563EB]/30 hover:border-[#2563EB] hover:bg-[#2563EB]/10 cursor-pointer'
                                    : 'border-gray-700 opacity-50 cursor-not-allowed'
                                }
                ${option.type === 'weekly' ? 'bg-[#2563EB]/5' : ''}
              `}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">{option.icon}</span>
                                <div className="flex-1">
                                    <h3 className="text-white font-semibold mb-1">
                                        {option.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {option.description}
                                    </p>
                                    {!option.available && (
                                        <span className="text-xs text-blue-400 mt-1 inline-block">
                                            Em breve
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800/50 transition-all"
                >
                    Cancelar
                </button>
            </motion.div>
        </motion.div>
    );
};

export default MonthlyScheduleTypeSelection;
