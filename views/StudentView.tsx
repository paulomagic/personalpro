import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Dumbbell, ChevronRight, Play, AlertCircle } from 'lucide-react';
import { WorkoutExercise, WorkoutSplit } from '../types';
import { getCurrentWorkoutByClient } from '../services/supabase/domains/workoutsDomain';
import { saveCompletedWorkout } from '../services/supabase/domains/completedWorkoutsDomain';
import { saveSessionFeedbackWithRetry, flushQueuedFeedback } from '../services/ai/feedback';
import type { SessionFeedback } from '../services/ai/feedback/types';
import { logFunnelEvent } from '../services/loggingService';
import { createScopedLogger } from '../services/appLogger';
import VideoPlayerModal from '../components/VideoPlayerModal';
import { FeedbackForm } from '../components/FeedbackForm';
import { useTheme } from '../services/ThemeContext';
import StudentSplitSelection from '../components/student/StudentSplitSelection';
import StudentExecutionHeader from '../components/student/StudentExecutionHeader';
import StudentRestTimerOverlay from '../components/student/StudentRestTimerOverlay';
import StudentProgressFooter from '../components/student/StudentProgressFooter';
import StudentCompletionModal from '../components/student/StudentCompletionModal';

const studentViewLogger = createScopedLogger('StudentView');

interface StudentViewProps {
    clientId?: string;          // ID do cliente para buscar treinos reais
    studentName: string;
    coachName?: string;
    coachLogo?: string;
    onCompleteWorkout?: () => void;
    onBack?: () => void;
}

interface ExerciseCompletion {
    exerciseId: string;
    setCompletions: boolean[];
}

interface StudentWorkoutState {
    id?: string;
    title: string;
    objective: string;
    duration: string;
    splits: WorkoutSplit[];
    coldStartMode?: boolean;
    ai_metadata?: {
        coldStartMode?: boolean;
    };
}

const StudentView: React.FC<StudentViewProps> = ({
    clientId,
    studentName,
    coachName = 'Seu Personal',
    coachLogo,
    onCompleteWorkout,
    onBack
}) => {
    const { resolvedTheme } = useTheme();
    const isLightTheme = resolvedTheme === 'light';

    // States
    const [loading, setLoading] = useState(true);
    const [workout, setWorkout] = useState<StudentWorkoutState | null>(null);
    const [selectedSplit, setSelectedSplit] = useState<WorkoutSplit | null>(null);
    const [completions, setCompletions] = useState<ExerciseCompletion[]>([]);
    const [activeExercise, setActiveExercise] = useState<number>(0);
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(0);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [activeVideo, setActiveVideo] = useState<{ url: string; name: string } | null>(null);
    const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
    const [completionDurationLabel, setCompletionDurationLabel] = useState('0 min');
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedbackExerciseIndex, setFeedbackExerciseIndex] = useState(0);
    const [feedbackCompletedExercises, setFeedbackCompletedExercises] = useState<Set<number>>(new Set());
    const [notice, setNotice] = useState<{ type: 'error' | 'info'; message: string } | null>(null);
    const [oneHandMode, setOneHandMode] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem('personalpro:quick_one_hand_mode') === '1';
    });

    const isColdStartWorkout = Boolean(workout?.coldStartMode || workout?.ai_metadata?.coldStartMode);

    // Fetch workout data on mount
    useEffect(() => {
        const fetchWorkout = async () => {
            setLoading(true);

            if (clientId) {
                try {
                    const workoutData = await getCurrentWorkoutByClient(clientId);

                    if (workoutData && workoutData.splits && Array.isArray(workoutData.splits) && workoutData.splits.length > 0) {
                        setWorkout({
                            id: (workoutData as any).id,
                            title: workoutData.title,
                            objective: workoutData.objective,
                            duration: workoutData.duration,
                            splits: workoutData.splits as WorkoutSplit[],
                            coldStartMode: Boolean((workoutData as any).coldStartMode || (workoutData as any).ai_metadata?.coldStartMode),
                            ai_metadata: (workoutData as any).ai_metadata
                        });
                    } else {
                        setWorkout(null);
                    }
                } catch (error) {
                    studentViewLogger.error('Error fetching current workout', error, { clientId, studentName });
                    setWorkout(null);
                }
            } else {
                setWorkout(null);
            }

            setLoading(false);
        };

        fetchWorkout();
    }, [clientId, studentName]);

    useEffect(() => {
        void flushQueuedFeedback();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('personalpro:quick_one_hand_mode', oneHandMode ? '1' : '0');
    }, [oneHandMode]);

    useEffect(() => {
        if (!notice) return;
        const timeout = window.setTimeout(() => setNotice(null), 3200);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    // Helper to normalize exercises with default sets
    const normalizeExercises = (exercises: WorkoutExercise[]): WorkoutExercise[] => {
        return exercises.map(ex => {
            if (!Array.isArray(ex.sets) || ex.sets.length === 0) {
                // Create 3 default sets for exercises without sets
                return {
                    ...ex,
                    sets: [
                        { method: 'simples' as const, reps: '12', load: '-', rest: '60s' },
                        { method: 'simples' as const, reps: '10', load: '-', rest: '60s' },
                        { method: 'simples' as const, reps: '8', load: '-', rest: '90s' }
                    ]
                };
            }
            return ex;
        });
    };

    // Track which split has been processed to avoid infinite loops
    const [processedSplitId, setProcessedSplitId] = useState<string | null>(null);

    // Initialize completions when split is selected
    useEffect(() => {
        if (selectedSplit && selectedSplit.exercises && selectedSplit.id !== processedSplitId) {
            // Mark as processed to avoid re-running
            setProcessedSplitId(selectedSplit.id);

            // Normalize exercises with default sets
            const exercisesWithSets = normalizeExercises(selectedSplit.exercises);

            // Update the split with normalized exercises
            setSelectedSplit({ ...selectedSplit, exercises: exercisesWithSets });

            // Initialize completions
            setCompletions(
                exercisesWithSets.map(ex => ({
                    exerciseId: ex.id,
                    setCompletions: ex.sets.map(() => false)
                }))
            );
            setFeedbackCompletedExercises(new Set());
            setActiveExercise(0);
            setShowFeedbackForm(false);

            // Start timer if not already started
            if (!workoutStartTime) {
                setWorkoutStartTime(new Date());
            }

            void logFunnelEvent('workout_started', {
                workoutId: workout?.id || 'unknown',
                splitId: selectedSplit.id,
                splitName: selectedSplit.name,
                coldStartMode: isColdStartWorkout
            });
        }
    }, [selectedSplit, processedSplitId, workoutStartTime, workout?.id, isColdStartWorkout]);

    // Calculate progress
    const totalSets = selectedSplit?.exercises?.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0) || 0;
    const completedSets = completions.reduce((acc, comp) =>
        acc + comp.setCompletions.filter(Boolean).length, 0
    );
    const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    const totalExercises = selectedSplit?.exercises?.length || 0;
    const shouldCollectExerciseFeedback = Boolean(clientId);
    const requiredFeedbackCount = isColdStartWorkout ? totalExercises : 0;
    const hasAllRequiredFeedback = requiredFeedbackCount === 0 || feedbackCompletedExercises.size >= requiredFeedbackCount;
    const canFinishWorkout = progress >= 100 && (!isColdStartWorkout || hasAllRequiredFeedback);
    const activeExercisePendingSetIndex = completions[activeExercise]?.setCompletions?.findIndex(done => !done) ?? -1;
    const canQuickCompleteSet = activeExercisePendingSetIndex >= 0;
    const adherenceNudge = (() => {
        if (isColdStartWorkout && !hasAllRequiredFeedback) {
            return `Envie feedback de ${feedbackCompletedExercises.size}/${requiredFeedbackCount} exercícios para calibrar a IA com precisão.`;
        }
        if (progress >= 90) return 'Fase final: mantenha execução limpa e feche o treino.';
        if (progress >= 65) return 'Ritmo forte. Continue sem alongar descansos.';
        if (progress >= 35) return 'Consistência boa. Foque em amplitude e controle.';
        return 'Início do treino: priorize técnica e percepção de esforço.';
    })();

    const getFirstMissingFeedbackExerciseIndex = () => {
        if (!selectedSplit) return -1;
        return selectedSplit.exercises.findIndex((_, idx) => !feedbackCompletedExercises.has(idx));
    };

    const moveToNextPendingExercise = () => {
        if (!selectedSplit) return;
        const isDone = (idx: number) => completions[idx]?.setCompletions?.every(Boolean) || false;
        const nextOpen = selectedSplit.exercises.findIndex((_, idx) => idx > activeExercise && !isDone(idx));
        if (nextOpen >= 0) {
            setActiveExercise(nextOpen);
            return;
        }
        const firstOpen = selectedSplit.exercises.findIndex((_, idx) => !isDone(idx));
        if (firstOpen >= 0) {
            setActiveExercise(firstOpen);
        }
    };

    const handleQuickCompleteNextSet = () => {
        if (!selectedSplit) return;
        if (activeExercisePendingSetIndex < 0) {
            moveToNextPendingExercise();
            return;
        }
        if ('vibrate' in navigator) navigator.vibrate([15, 30, 15]);
        const remainingSets = completions[activeExercise]?.setCompletions.filter(done => !done).length ?? 0;
        toggleSetComplete(activeExercise, activeExercisePendingSetIndex);
        if (remainingSets <= 1) {
            setTimeout(() => {
                moveToNextPendingExercise();
            }, 120);
        }
    };

    // Toggle set completion
    const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
        const newCompletions = [...completions];
        newCompletions[exerciseIndex].setCompletions[setIndex] = !newCompletions[exerciseIndex].setCompletions[setIndex];
        setCompletions(newCompletions);

        const isExerciseNowComplete = newCompletions[exerciseIndex].setCompletions.every(Boolean);
        if (isExerciseNowComplete && shouldCollectExerciseFeedback && !feedbackCompletedExercises.has(exerciseIndex)) {
            setFeedbackExerciseIndex(exerciseIndex);
            setShowFeedbackForm(true);
        }
        if (!isExerciseNowComplete && feedbackCompletedExercises.has(exerciseIndex)) {
            setFeedbackCompletedExercises(prev => {
                const next = new Set(prev);
                next.delete(exerciseIndex);
                return next;
            });
        }

        // Auto-start rest timer if completing a set
        if (newCompletions[exerciseIndex].setCompletions[setIndex] && selectedSplit) {
            const restTimeSeconds = parseInt(selectedSplit.exercises[exerciseIndex].sets[setIndex].rest) || 60;
            startRestTimer(restTimeSeconds);
        }
    };

    // Rest timer
    const startRestTimer = (seconds: number) => {
        setRestTime(seconds);
        setIsResting(true);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isResting && restTime > 0) {
            interval = setInterval(() => {
                setRestTime(prev => prev - 1);
            }, 1000);
        } else if (restTime === 0 && isResting) {
            setIsResting(false);
            // Vibrate if available
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isResting, restTime]);

    // Check if exercise is complete
    const isExerciseComplete = (exerciseIndex: number) => {
        return completions[exerciseIndex]?.setCompletions.every(Boolean) || false;
    };

    // Format rest time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const parseRepsFromSet = (value?: string): number => {
        if (!value) return 0;
        const match = value.match(/\d+/);
        return match ? Number(match[0]) : 0;
    };

    const parseLoadFromSet = (value?: string): number => {
        if (!value) return 0;
        const match = value.replace(',', '.').match(/\d+(\.\d+)?/);
        return match ? Number(match[0]) : 0;
    };

    const calculateDurationLabel = () => {
        if (!workoutStartTime) return '0 min';
        const diffMs = new Date().getTime() - workoutStartTime.getTime();
        const diffMins = Math.max(1, Math.round(diffMs / 60000));
        if (diffMins >= 60) {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return `${hours}h ${mins}min`;
        }
        return `${diffMins} min`;
    };

    const handleExerciseFeedbackSubmit = async (feedback: Omit<SessionFeedback, 'session_date'>) => {
        const result = await saveSessionFeedbackWithRetry(feedback);

        if (!result.success) {
            setNotice({ type: 'error', message: 'Erro ao salvar feedback. Tente novamente.' });
            void logFunnelEvent('feedback_failed', {
                workoutId: feedback.workout_id,
                exerciseId: feedback.exercise_id,
                coldStartMode: isColdStartWorkout,
                reason: result.error || 'unknown_error'
            });
            return;
        }

        void logFunnelEvent('feedback_submitted', {
            workoutId: feedback.workout_id,
            exerciseId: feedback.exercise_id,
            coldStartMode: isColdStartWorkout,
            queued: !!result.queued
        });

        setFeedbackCompletedExercises(prev => {
            const next = new Set(prev);
            next.add(feedbackExerciseIndex);
            const completedAllRequired = !isColdStartWorkout || next.size >= totalExercises;
            if (progress >= 100 && completedAllRequired) {
                setTimeout(() => {
                    void handleFinishWorkout();
                }, 0);
            }
            return next;
        });
        setShowFeedbackForm(false);
    };

    const handleSkipExerciseFeedback = () => {
        if (isColdStartWorkout) {
            setNotice({
                type: 'info',
                message: 'No modo inicial, o feedback por exercício é obrigatório.'
            });
            return;
        }
        setShowFeedbackForm(false);
    };

    // Handle workout completion
    const handleFinishWorkout = async () => {
        if (isColdStartWorkout && !hasAllRequiredFeedback) {
            const missingIndex = getFirstMissingFeedbackExerciseIndex();
            if (missingIndex >= 0) {
                setFeedbackExerciseIndex(missingIndex);
                setShowFeedbackForm(true);
            }
            return;
        }

        const durationLabel = calculateDurationLabel();
        setCompletionDurationLabel(durationLabel);
        setShowCompleteModal(true);

        // Save to history if we have a real client
        if (clientId && selectedSplit) {
            try {
                // Calculate stats
                const completedSetsCount = completions.reduce((acc, comp) =>
                    acc + comp.setCompletions.filter(Boolean).length, 0
                );

                // Calculate actual duration
                await saveCompletedWorkout({
                    client_id: clientId,
                    workout_id: workout?.id,
                    title: `Treino ${selectedSplit.name}`,
                    duration: durationLabel,
                    exercises_count: selectedSplit.exercises.length,
                    sets_completed: completedSetsCount,
                    total_load_volume: 0, // Not tracked in this view
                    feedback_notes: 'Treino concluído via app'
                });
                studentViewLogger.debug('Workout history saved successfully', {
                    clientId,
                    workoutId: workout?.id,
                    splitId: selectedSplit.id
                });
            } catch (error) {
                studentViewLogger.error('Error saving workout history', error, {
                    clientId,
                    workoutId: workout?.id,
                    splitId: selectedSplit.id
                });
            }
        }

        void logFunnelEvent('workout_finished', {
            workoutId: workout?.id || 'unknown',
            splitId: selectedSplit.id,
            coldStartMode: isColdStartWorkout,
            feedbackCompleted: feedbackCompletedExercises.size,
            feedbackRequired: requiredFeedbackCount
        });

        if (onCompleteWorkout) {
            onCompleteWorkout();
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center bg-[var(--bg-void)]">
                <div className="text-center">
                    <div className="size-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm font-medium">Carregando treino...</p>
                </div>
            </div>
        );
    }

    // No workout available
    if (!workout) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="size-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={40} className="text-slate-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Nenhum Treino Encontrado</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Seu personal ainda não criou um treino para você. Entre em contato para solicitar.
                    </p>
                    {onBack && (
                        <button
                            onClick={onBack}
                            aria-label="Voltar para a tela anterior"
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl"
                        >
                            Voltar
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Split Selection View
    if (!selectedSplit) {
        return (
            <StudentSplitSelection
                workout={workout}
                studentName={studentName}
                coachName={coachName}
                coachLogo={coachLogo}
                clientId={clientId}
                onBack={onBack}
                onSelectSplit={setSelectedSplit}
            />
        );
    }

    // Workout Execution View (existing functionality)
    return (
        <div className="min-h-screen text-white bg-[var(--bg-void)]">
            <AnimatePresence>
                {notice && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="fixed top-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
                    >
                        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl backdrop-blur-xl ${
                            notice.type === 'error'
                                ? 'bg-[rgba(255,51,102,0.14)] border-[rgba(255,51,102,0.22)] text-[#FFD1DD]'
                                : 'bg-[rgba(59,130,246,0.14)] border-[rgba(59,130,246,0.22)] text-[#D9E7FF]'
                        }`}>
                            <p aria-live="polite">{notice.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Execution Premium */}
            <StudentExecutionHeader
                isLightTheme={isLightTheme}
                selectedSplit={selectedSplit}
                oneHandMode={oneHandMode}
                progress={progress}
                completedSets={completedSets}
                totalSets={totalSets}
                isColdStartWorkout={isColdStartWorkout}
                feedbackCompletedCount={feedbackCompletedExercises.size}
                requiredFeedbackCount={requiredFeedbackCount}
                adherenceNudge={adherenceNudge}
                onBack={() => {
                    setSelectedSplit(null);
                    setProcessedSplitId(null);
                    setWorkoutStartTime(null);
                    setShowFeedbackForm(false);
                    setFeedbackCompletedExercises(new Set());
                }}
                onToggleOneHandMode={() => setOneHandMode(prev => !prev)}
            />

            <StudentRestTimerOverlay
                isResting={isResting}
                restTime={restTime}
                formatTime={formatTime}
                onSkip={() => setIsResting(false)}
            />

            {/* Exercises List */}
            <main className="max-w-md mx-auto px-4 py-6 pb-32 space-y-4">
                {selectedSplit.exercises.map((exercise, exerciseIndex) => {
                    const isComplete = isExerciseComplete(exerciseIndex);
                    const isActive = exerciseIndex === activeExercise;

                    return (
                        <motion.div
                            key={exercise.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: exerciseIndex * 0.1 }}
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(15);
                                setActiveExercise(exerciseIndex);
                            }}
                            className={`glass-card rounded-[24px] overflow-hidden transition-all group ${isComplete
                                ? 'border border-blue-500/20 bg-blue-500/5'
                                : isActive
                                    ? 'border border-blue-500/50 bg-white/5 relative shadow-[0_4px_30px_rgba(59,130,246,0.15)]'
                                    : 'border border-white/5 hover:border-blue-500/30'
                                }`}
                        >
                            {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />}

                            {/* Exercise Header */}
                            <div className="p-4 flex items-center gap-4 relative z-10">
                                <div className={`size-[52px] rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${isComplete
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                    : isActive
                                        ? 'bg-white/10 text-white shadow-lg shadow-black/20'
                                        : 'bg-white/5 text-slate-400'
                                    }`}>
                                    {isComplete ? <Check size={24} /> : <Dumbbell size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-lg leading-tight mb-0.5 ${isComplete ? 'text-blue-400' : 'text-white'}`}>
                                        {exercise.name}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        {exercise.targetMuscle || 'Geral'} • {Array.isArray(exercise.sets) ? exercise.sets.length : 0} séries
                                    </p>
                                </div>
                                <ChevronRight
                                    size={20}
                                    className={`text-slate-600 transition-transform ${isActive ? 'rotate-90' : ''}`}
                                />
                            </div>

                            {/* Video Button - Student View */}
                            {isActive && exercise.videoUrl && (
                                <div className="px-4 pb-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveVideo({ url: exercise.videoUrl!, name: exercise.name });
                                            setShowVideoModal(true);
                                        }}
                                        aria-label={`Ver execucao do exercicio ${exercise.name}`}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        <Play size={12} fill="currentColor" />
                                        Ver Execução
                                    </button>
                                </div>
                            )}

                            {/* Sets (Expanded) */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-4 pb-4 space-y-2"
                                    >
                                        {/* Column Headers */}
                                        <div className="grid grid-cols-5 gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2">
                                            <div>Série</div>
                                            <div>Carga</div>
                                            <div>Reps</div>
                                            <div>Descanso</div>
                                            <div className="text-center">Feito</div>
                                        </div>

                                        {Array.isArray(exercise.sets) && exercise.sets.map((set, setIndex) => {
                                            const isSetComplete = completions[exerciseIndex]?.setCompletions[setIndex] || false;

                                            return (
                                                <div
                                                    key={setIndex}
                                                    className={`grid grid-cols-5 gap-2 items-center p-3 rounded-2xl transition-all border ${isSetComplete
                                                        ? 'bg-blue-500/10 border-blue-500/20'
                                                        : 'bg-white/5 border-transparent'
                                                        }`}
                                                >
                                                    <div className="text-sm font-black text-slate-500">
                                                        {setIndex + 1}
                                                    </div>
                                                    <div className={`text-sm font-bold ${isSetComplete ? 'text-blue-400' : 'text-white'}`}>
                                                        {set.load || '-'}
                                                    </div>
                                                    <div className={`text-sm font-bold ${isSetComplete ? 'text-blue-400' : 'text-white'}`}>
                                                        {set.reps || '-'}
                                                    </div>
                                                    <div className="text-sm font-medium text-slate-500">
                                                        {set.rest || '60s'}
                                                    </div>
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if ('vibrate' in navigator) navigator.vibrate([15, 30, 15]);
                                                                toggleSetComplete(exerciseIndex, setIndex);
                                                            }}
                                                            aria-label={`Marcar serie ${setIndex + 1} do exercicio ${exercise.name} como ${isSetComplete ? 'nao concluida' : 'concluida'}`}
                                                            aria-pressed={isSetComplete}
                                                            className={`size-[42px] rounded-[14px] border-2 flex items-center justify-center transition-all active:scale-90 ${isSetComplete
                                                                ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                                : 'bg-white/5 border-white/10 text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10'
                                                                }`}
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Exercise Notes */}
                                        {exercise.notes && (
                                            <div className="mt-3 p-3 bg-blue-500/10 rounded-xl">
                                                <p className="text-xs text-blue-300">
                                                    📝 {exercise.notes}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </main>

            <StudentProgressFooter
                isLightTheme={isLightTheme}
                oneHandMode={oneHandMode}
                canQuickCompleteSet={canQuickCompleteSet}
                progress={progress}
                canFinishWorkout={canFinishWorkout}
                isColdStartWorkout={isColdStartWorkout}
                hasAllRequiredFeedback={hasAllRequiredFeedback}
                onQuickCompleteNextSet={handleQuickCompleteNextSet}
                onMoveToNextExercise={moveToNextPendingExercise}
                onFinishWorkout={() => {
                    if ('vibrate' in navigator) navigator.vibrate(100);
                    void handleFinishWorkout();
                }}
            />

            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedbackForm && selectedSplit && selectedSplit.exercises[feedbackExerciseIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Feedback do exercicio"
                        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <FeedbackForm
                                workoutId={workout?.id || `split-${selectedSplit.id || 'unknown'}`}
                                studentId={clientId || 'unknown'}
                                exerciseId={selectedSplit.exercises[feedbackExerciseIndex].id || `ex-${feedbackExerciseIndex}`}
                                exerciseName={selectedSplit.exercises[feedbackExerciseIndex].name || 'Exercício'}
                                prescribedSets={Array.isArray(selectedSplit.exercises[feedbackExerciseIndex].sets) ? selectedSplit.exercises[feedbackExerciseIndex].sets.length : 0}
                                prescribedReps={`${selectedSplit.exercises[feedbackExerciseIndex].sets?.[0]?.reps || '-'}`}
                                prescribedLoad={parseLoadFromSet(selectedSplit.exercises[feedbackExerciseIndex].sets?.[0]?.load)}
                                onSubmit={handleExerciseFeedbackSubmit}
                                onCancel={handleSkipExerciseFeedback}
                                allowCancel={!isColdStartWorkout}
                                cancelLabel="Pular feedback"
                                requirementNote={isColdStartWorkout ? 'Modo inicial: feedback por exercício é obrigatório para calibrar treino.' : undefined}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <StudentCompletionModal
                show={showCompleteModal}
                studentName={studentName}
                exerciseCount={selectedSplit?.exercises.length || 0}
                totalSets={totalSets}
                durationLabel={completionDurationLabel}
                onClose={() => {
                    setShowCompleteModal(false);
                    setSelectedSplit(null);
                    setProcessedSplitId(null);
                    setWorkoutStartTime(null);
                    setCompletionDurationLabel('0 min');
                    setShowFeedbackForm(false);
                    setFeedbackCompletedExercises(new Set());
                }}
            />

            {/* Video Modal */}
            {showVideoModal && activeVideo && (
                <VideoPlayerModal
                    videoUrl={activeVideo.url}
                    exerciseName={activeVideo.name}
                    onClose={() => setShowVideoModal(false)}
                />
            )}
        </div>
    );
};

export default StudentView;
