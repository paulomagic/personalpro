import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { WorkoutSplit } from '../../types';

interface StudentExecutionHeaderProps {
    isLightTheme: boolean;
    selectedSplit: WorkoutSplit;
    oneHandMode: boolean;
    progress: number;
    completedSets: number;
    totalSets: number;
    isColdStartWorkout: boolean;
    feedbackCompletedCount: number;
    requiredFeedbackCount: number;
    adherenceNudge: string;
    onBack: () => void;
    onToggleOneHandMode: () => void;
}

export default function StudentExecutionHeader({
    isLightTheme,
    selectedSplit,
    oneHandMode,
    progress,
    completedSets,
    totalSets,
    isColdStartWorkout,
    feedbackCompletedCount,
    requiredFeedbackCount,
    adherenceNudge,
    onBack,
    onToggleOneHandMode
}: StudentExecutionHeaderProps) {
    return (
        <header
            className={`sticky top-0 z-40 backdrop-blur-xl px-5 pt-12 pb-5 safe-area-top border-b ${isLightTheme
                ? 'bg-[linear-gradient(180deg,rgba(231,239,252,0.96)_0%,rgba(223,233,250,0.9)_100%)] border-b-[rgba(130,170,235,0.28)]'
                : 'bg-[rgba(3,7,18,0.85)] border-b-[rgba(255,255,255,0.05)]'
                }`}
        >
            <div
                className={`absolute top-0 left-0 right-0 h-32 pointer-events-none ${isLightTheme
                    ? 'bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(59,130,246,0.14)_0%,transparent_100%)]'
                    : 'bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(59,130,246,0.08)_0%,transparent_100%)]'
                    }`}
            />

            <div className="max-w-md mx-auto relative z-10">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onBack}
                                aria-label="Voltar para a selecao de treino"
                                className={`size-11 rounded-2xl backdrop-blur-xl text-white flex items-center justify-center shadow-lg transition-all active:scale-95 border ${isLightTheme
                                    ? 'bg-[rgba(255,255,255,0.66)] border-[rgba(130,170,235,0.35)] shadow-[0_8px_22px_rgba(63,93,152,0.16)]'
                                    : 'bg-[rgba(255,255,255,0.10)] border-[rgba(255,255,255,0.20)]'
                                    }`}
                            >
                                <ArrowLeft size={20} strokeWidth={2.5} />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] mb-0.5">Treino {selectedSplit.name}</span>
                                <span className="text-[15px] font-black tracking-wide text-white leading-tight pr-4">{selectedSplit.description}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onToggleOneHandMode}
                            aria-pressed={oneHandMode}
                            aria-label={oneHandMode ? 'Desativar modo uma mao' : 'Ativar modo uma mao'}
                            className={`h-11 px-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${oneHandMode
                                ? 'bg-blue-500/20 border-blue-400/60 text-blue-300'
                                : (isLightTheme
                                    ? 'bg-white/60 border-[rgba(130,170,235,0.35)] text-[#3D5A80]'
                                    : 'bg-white/10 border-white/20 text-slate-300')
                                }`}
                        >
                            1M
                        </button>
                    </div>
                </div>

                <div className="relative h-1.5 bg-slate-800/50 rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute inset-y-0 left-0 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{completedSets} de {totalSets} séries</span>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{Math.round(progress)}% concluído</span>
                </div>
                {isColdStartWorkout && (
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Modo Inicial Ativo</span>
                        <span className="text-[10px] font-bold text-amber-300">
                            Feedback: {feedbackCompletedCount}/{requiredFeedbackCount}
                        </span>
                    </div>
                )}
                <div
                    className={`mt-3 rounded-2xl px-3 py-2 border ${isLightTheme
                        ? 'bg-[rgba(219,234,254,0.68)] border-[rgba(130,170,235,0.32)]'
                        : 'bg-[rgba(59,130,246,0.12)] border-[rgba(59,130,246,0.25)]'
                        }`}
                >
                    <p className={`text-[11px] font-semibold ${isLightTheme ? 'text-[#264569]' : 'text-[#BFDBFE]'}`}>
                        {adherenceNudge}
                    </p>
                </div>
            </div>
        </header>
    );
}
