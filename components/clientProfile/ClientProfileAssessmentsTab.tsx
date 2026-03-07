import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, PlusCircle } from 'lucide-react';
import type { Client } from '../../types';

interface ClientProfileAssessmentsTabProps {
    client: Client;
    onStartAssessment: () => void;
}

const ClientProfileAssessmentsTab: React.FC<ClientProfileAssessmentsTabProps> = ({
    client,
    onStartAssessment
}) => {
    return (
        <motion.div
            key="assessments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <button
                onClick={onStartAssessment}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--btn-primary-border)] shadow-[var(--btn-primary-shadow)]"
            >
                <PlusCircle size={20} />
                Nova Avaliação
            </button>

            <h3 className="font-black text-white tracking-tight text-sm mt-4">Histórico</h3>
            <div className="space-y-3">
                {client.assessments.length > 0 ? client.assessments.map((assessment, index) => (
                    <div key={index} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 active:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-wider">
                                    {new Date(assessment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                <div className="flex gap-3 text-[10px] text-slate-400 font-medium mt-0.5">
                                    <span>Peso: <b className="text-white">{assessment.weight}kg</b></span>
                                    {assessment.bodyFat && <span>BF: <b className="text-blue-400">{assessment.bodyFat}%</b></span>}
                                </div>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                    </div>
                )) : (
                    <div className="py-8 text-center text-slate-500 text-xs">
                        Nenhuma avaliação registrada ainda.
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ClientProfileAssessmentsTab;
