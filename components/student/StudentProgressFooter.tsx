import React from 'react';
import { Check, Trophy } from 'lucide-react';

interface StudentProgressFooterProps {
    isLightTheme: boolean;
    oneHandMode: boolean;
    canQuickCompleteSet: boolean;
    progress: number;
    canFinishWorkout: boolean;
    isColdStartWorkout: boolean;
    hasAllRequiredFeedback: boolean;
    onQuickCompleteNextSet: () => void;
    onMoveToNextExercise: () => void;
    onFinishWorkout: () => void;
}

export default function StudentProgressFooter({
    isLightTheme,
    oneHandMode,
    canQuickCompleteSet,
    progress,
    canFinishWorkout,
    isColdStartWorkout,
    hasAllRequiredFeedback,
    onQuickCompleteNextSet,
    onMoveToNextExercise,
    onFinishWorkout
}: StudentProgressFooterProps) {
    return (
        <div
            className={`fixed bottom-0 left-0 right-0 py-6 px-4 pointer-events-none z-40 safe-area-bottom ${isLightTheme
                ? 'bg-[linear-gradient(to_top,rgba(240,244,255,0.98)_0%,rgba(240,244,255,0.75)_42%,rgba(240,244,255,0)_100%)]'
                : 'bg-[linear-gradient(to_top,rgba(2,8,23,1)_0%,rgba(2,8,23,0.9)_40%,rgba(2,8,23,0)_100%)]'
                }`}
        >
            <div className="max-w-md mx-auto pointer-events-auto">
                {oneHandMode && (
                    <div
                        className={`mb-3 p-2 rounded-2xl border ${isLightTheme
                            ? 'bg-[rgba(235,243,255,0.9)] border-[rgba(130,170,235,0.32)]'
                            : 'bg-[rgba(15,23,42,0.82)] border-[rgba(59,130,246,0.28)]'
                            }`}
                    >
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={onQuickCompleteNextSet}
                                disabled={!canQuickCompleteSet}
                                aria-label="Marcar a proxima serie como concluida"
                                className="h-12 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Próxima Série
                            </button>
                            <button
                                type="button"
                                onClick={onMoveToNextExercise}
                                aria-label="Ir para o proximo exercicio"
                                className={`h-12 rounded-xl border text-[10px] font-black uppercase tracking-widest ${isLightTheme
                                    ? 'border-[rgba(130,170,235,0.42)] text-[#355680] bg-[rgba(255,255,255,0.75)]'
                                    : 'border-[rgba(148,163,184,0.35)] text-[#CBD5E1] bg-[rgba(15,23,42,0.65)]'
                                    }`}
                            >
                                Próx Exercício
                            </button>
                        </div>
                    </div>
                )}
                {progress >= 100 ? (
                    <button
                        onClick={onFinishWorkout}
                        disabled={!canFinishWorkout}
                        aria-label="Encerrar sessao de treino"
                        className={`w-full py-4 rounded-2xl relative overflow-hidden group disabled:opacity-35 transition-all active:scale-[0.98] ${canFinishWorkout
                            ? 'cursor-pointer bg-[var(--btn-primary-bg)] border border-[var(--btn-primary-border)] shadow-[var(--btn-primary-shadow)]'
                            : 'opacity-80 cursor-not-allowed'
                            } ${!canFinishWorkout && (isLightTheme
                                ? 'bg-[linear-gradient(145deg,rgba(214,224,242,0.95),rgba(204,216,238,0.95))] border border-[rgba(130,170,235,0.28)] shadow-[inset_0_1px_0_rgba(246,250,255,0.45)]'
                                : 'bg-[rgba(15,23,42,0.7)] border border-[rgba(51,65,85,0.65)]'
                            )}`}
                    >
                        <div className="absolute inset-0 flex items-center justify-center gap-3 z-10 px-6">
                            <div className="flex-1 flex flex-col items-start justify-center">
                                <span
                                    className={`font-black uppercase tracking-[0.15em] text-[13px] leading-tight ${canFinishWorkout ? 'text-[var(--btn-primary-text)]' : (isLightTheme ? 'text-[#3D5A80]' : 'text-[#7A9FCC]')}`}
                                >
                                    Encerrar Sessão
                                </span>
                                <span
                                    className={`text-[10px] font-semibold tracking-wide ${canFinishWorkout ? 'text-[rgba(244,248,255,0.78)]' : 'text-[#64748B]'}`}
                                >
                                    {isColdStartWorkout && !hasAllRequiredFeedback
                                        ? 'Feedback obrigatório Pendente'
                                        : 'Excelente trabalho hoje'}
                                </span>
                            </div>
                            <div
                                className={`size-11 rounded-[14px] backdrop-blur-sm flex items-center justify-center mt-px border-2 ${canFinishWorkout
                                    ? 'bg-[rgba(255,255,255,0.18)] border-[rgba(255,255,255,0.3)]'
                                    : (isLightTheme
                                        ? 'bg-[rgba(255,255,255,0.45)] border-[rgba(130,170,235,0.28)]'
                                        : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.12)]')
                                    }`}
                            >
                                <Check
                                    size={20}
                                    strokeWidth={3}
                                    className={canFinishWorkout ? 'text-white' : 'text-[#64748B]'}
                                />
                            </div>
                        </div>
                    </button>
                ) : (
                    <div
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 backdrop-blur-md border ${isLightTheme
                            ? 'bg-[linear-gradient(145deg,rgba(222,232,248,0.92),rgba(212,224,244,0.92))] border-[rgba(130,170,235,0.28)] shadow-[inset_0_1px_0_rgba(246,250,255,0.45)]'
                            : 'bg-[rgba(2,12,37,0.86)] border-[rgba(255,255,255,0.06)]'
                            }`}
                    >
                        <Trophy size={18} className={isLightTheme ? 'text-[#526A8C]' : 'text-[#64748B]'} />
                        <span className={`font-black text-[11px] uppercase tracking-widest ${isLightTheme ? 'text-[#3D5A80]' : 'text-[#64748B]'}`}>
                            {Math.round(progress)}% Concluído
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
