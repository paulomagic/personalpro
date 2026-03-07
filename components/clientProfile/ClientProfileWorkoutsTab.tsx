import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Dumbbell, User, Zap } from 'lucide-react';
import type { Client, MissedClass } from '../../types';

interface ClientProfileWorkoutsTabProps {
    client: Client;
    onCreateWorkout?: () => void;
    onStartWorkout: (workout: any) => void;
    onStudentView?: () => void;
    onSportTraining?: () => void;
    onOpenMissedClassModal: () => void;
    getReasonLabel: (reason: MissedClass['reason']) => string;
    handleMarkAsReplaced: (missedClassId: string) => void;
}

const ClientProfileWorkoutsTab: React.FC<ClientProfileWorkoutsTabProps> = ({
    client,
    onCreateWorkout,
    onStartWorkout,
    onStudentView,
    onSportTraining,
    onOpenMissedClassModal,
    getReasonLabel,
    handleMarkAsReplaced
}) => {
    return (
        <motion.div
            key="workouts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <button
                onClick={() => onCreateWorkout ? onCreateWorkout() : onStartWorkout({ title: 'Novo Treino', exercises: [] })}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--btn-primary-border)] shadow-[var(--btn-primary-shadow)]"
            >
                <Dumbbell size={20} />
                Criar Novo Treino
            </button>

            <div className="grid grid-cols-2 gap-3">
                {onStudentView && (
                    <button
                        onClick={onStudentView}
                        className="py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <User size={16} />
                        Ver como Aluno
                    </button>
                )}
                {onSportTraining && (
                    <button
                        onClick={onSportTraining}
                        className="py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)] text-[#3B82F6]"
                    >
                        <Zap size={16} />
                        Esportivo ⭐
                    </button>
                )}
            </div>

            <div className="glass-card rounded-2xl p-4 border border-blue-500/20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Clock size={16} className="text-blue-400" />
                        Aulas Perdidas
                    </h3>
                    <button
                        onClick={onOpenMissedClassModal}
                        className="text-xs font-bold text-blue-400 uppercase tracking-widest"
                    >
                        + Registrar
                    </button>
                </div>

                {client.missedClasses.length > 0 ? (
                    <div className="space-y-2">
                        {client.missedClasses.map((missedClass, index) => (
                            <div key={index} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                                <div>
                                    <p className="text-xs font-bold text-white">
                                        {new Date(missedClass.date).toLocaleDateString('pt-BR')}
                                    </p>
                                    <p className="text-[10px] text-slate-400">{getReasonLabel(missedClass.reason)}</p>
                                </div>
                                {missedClass.replaced ? (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">
                                        ✓ Reposta
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleMarkAsReplaced(missedClass.id!)}
                                        className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold hover:bg-blue-500/30 transition-colors"
                                    >
                                        Marcar como Reposta
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-slate-500 text-center py-2">
                        Nenhuma aula perdida registrada 🎉
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default ClientProfileWorkoutsTab;
