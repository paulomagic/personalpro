import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Dumbbell, Layers } from 'lucide-react';
import type { WorkoutSplit } from '../../types';
import PageHeader from '../PageHeader';

interface StudentSplitSelectionProps {
    workout: {
        title: string;
        splits: WorkoutSplit[];
    };
    studentName: string;
    coachName: string;
    coachLogo?: string;
    clientId?: string;
    onBack?: () => void;
    onSelectSplit: (split: WorkoutSplit) => void;
}

export default function StudentSplitSelection({
    workout,
    studentName,
    coachName,
    coachLogo,
    clientId,
    onBack,
    onSelectSplit
}: StudentSplitSelectionProps) {
    return (
        <div className="min-h-screen text-white bg-[var(--bg-void)]">
            <PageHeader
                title={workout.title}
                subtitle={`Olá, ${studentName.split(' ')[0]}! 👋`}
                onBack={onBack}
                accentColor="blue"
                rightSlot={
                    coachLogo ? (
                        <img
                            src={coachLogo}
                            alt={`Logo de ${coachName}`}
                            className="h-11 w-auto rounded-[14px] border border-white/10 shadow-lg"
                        />
                    ) : (
                        <div className="text-right flex flex-col justify-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-0.5">Personal</span>
                            <span className="text-xs font-black text-white tracking-wide">{coachName}</span>
                        </div>
                    )
                }
            />

            <main className="max-w-md mx-auto px-5 py-2 pb-32">
                <div className="mb-6">
                    <h2 className="text-2xl font-display font-black text-white mb-2">Escolha seu Treino</h2>
                    <p className="text-sm text-slate-400">Selecione qual treino você vai fazer hoje</p>
                </div>

                <div className="space-y-4">
                    {workout.splits.map((split, index) => {
                        const splitLetter = split.name.match(/[A-Z](?=:|$)/)?.[0] || split.name.charAt(0).toUpperCase();
                        const splitDescription = split.description || split.name.replace(/^Treino\s*[A-Z][\s:]*/, '').trim() || 'Treino Geral';

                        return (
                            <motion.button
                                key={split.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => {
                                    if ('vibrate' in navigator) navigator.vibrate(20);
                                    onSelectSplit(split);
                                }}
                                aria-label={`Selecionar treino ${splitLetter}: ${splitDescription}`}
                                className="w-full glass-card p-5 rounded-[24px] text-left relative overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.98]"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="size-[60px] rounded-[18px] flex items-center justify-center flex-shrink-0 bg-[var(--btn-primary-bg)] border border-[var(--btn-primary-border)] shadow-[var(--btn-primary-shadow)]">
                                        <span className="text-[26px] font-black text-[var(--btn-primary-text)]">
                                            {splitLetter}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-lg mb-1 truncate">
                                            Treino {splitLetter}: {splitDescription}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                <Dumbbell size={12} /> {split.exercises?.length || 0} exercícios
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                <Layers size={12} /> {split.exercises?.reduce((acc, exercise) => acc + (Array.isArray(exercise.sets) ? exercise.sets.length : 0), 0) || 0} séries
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={24} className="text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {!clientId && (
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                        <p className="text-xs text-blue-400 text-center">
                            Modo demonstração - treino de exemplo
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
