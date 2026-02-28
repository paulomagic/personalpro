import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Dumbbell, ChevronRight, Play, Pause, RotateCcw, Trophy, Flame, Timer as TimerIcon, ArrowLeft, Layers, AlertCircle } from 'lucide-react';
import { WorkoutExercise, ExerciseSet, WorkoutSplit } from '../types';
import { getClientCurrentWorkout, saveCompletedWorkout } from '../services/supabaseClient';
import { saveSessionFeedbackWithRetry, flushQueuedFeedback } from '../services/ai/feedback';
import type { SessionFeedback } from '../services/ai/feedback/types';
import { logFunnelEvent } from '../services/loggingService';
import { mockExercises } from '../mocks/demoData';
import VideoPlayerModal from '../components/VideoPlayerModal';
import { FeedbackForm } from '../components/FeedbackForm';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../services/ThemeContext';

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

// Fallback workout para demo (quando não há treino no banco)
const createDemoWorkout = (studentName: string) => ({
    title: 'Treino Demo',
    objective: 'Demonstração',
    duration: '45 min',
    splits: [
        {
            id: 'demo-a',
            name: 'A',
            description: 'Superior (Demo)',
            exercises: mockExercises.filter(e => ['ch1', 'ch2', 'sh1', 'sh2', 'tri1', 'bi1'].includes(e.id))
        },
        {
            id: 'demo-b',
            name: 'B',
            description: 'Inferior (Demo)',
            exercises: mockExercises.filter(e => ['quad1', 'quad2', 'ham1', 'glut1', 'calf1'].includes(e.id))
        }
    ]
});

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
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedbackExerciseIndex, setFeedbackExerciseIndex] = useState(0);
    const [feedbackCompletedExercises, setFeedbackCompletedExercises] = useState<Set<number>>(new Set());

    const isColdStartWorkout = Boolean(workout?.coldStartMode || workout?.ai_metadata?.coldStartMode);

    // Fetch workout data on mount
    useEffect(() => {
        const fetchWorkout = async () => {
            setLoading(true);

            if (clientId) {
                try {
                    const workoutData = await getClientCurrentWorkout(clientId);

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
                        // Fallback to demo workout
                        setWorkout(createDemoWorkout(studentName));
                    }
                } catch (error) {
                    console.error('Error fetching workout:', error);
                    setWorkout(createDemoWorkout(studentName));
                }
            } else {
                // No clientId - use demo workout
                setWorkout(createDemoWorkout(studentName));
            }

            setLoading(false);
        };

        fetchWorkout();
    }, [clientId, studentName]);

    useEffect(() => {
        void flushQueuedFeedback();
    }, []);

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

    const getFirstMissingFeedbackExerciseIndex = () => {
        if (!selectedSplit) return -1;
        return selectedSplit.exercises.findIndex((_, idx) => !feedbackCompletedExercises.has(idx));
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

    const handleExerciseFeedbackSubmit = async (feedback: Omit<SessionFeedback, 'session_date'>) => {
        const result = await saveSessionFeedbackWithRetry(feedback);

        if (!result.success) {
            alert('Erro ao salvar feedback. Tente novamente.');
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
            alert('No modo inicial, o feedback por exercício é obrigatório.');
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

        setShowCompleteModal(true);

        // Save to history if we have a real client
        if (clientId && selectedSplit) {
            try {
                // Calculate stats
                const completedSetsCount = completions.reduce((acc, comp) =>
                    acc + comp.setCompletions.filter(Boolean).length, 0
                );

                // Calculate actual duration
                let duration = '0 min';
                if (workoutStartTime) {
                    const diffMs = new Date().getTime() - workoutStartTime.getTime();
                    const diffMins = Math.round(diffMs / 60000);
                    if (diffMins >= 60) {
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        duration = `${hours}h ${mins}min`;
                    } else {
                        duration = `${diffMins} min`;
                    }
                }

                await saveCompletedWorkout({
                    client_id: clientId,
                    workout_id: workout?.id,
                    title: `Treino ${selectedSplit.name}`,
                    duration: duration,
                    exercises_count: selectedSplit.exercises.length,
                    sets_completed: completedSetsCount,
                    total_load_volume: 0, // Not tracked in this view
                    feedback_notes: 'Treino concluído via app'
                });
                console.log('Workout saved successfully');
            } catch (error) {
                console.error('Error saving workout history:', error);
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
            <div className="min-h-screen text-white flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
                <div className="text-center">
                    <div className="size-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
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
            <div className="min-h-screen text-white" style={{ background: 'var(--bg-void)' }}>
                {/* Header Premium (Seletor de Treinos) */}
                <PageHeader
                    title={workout.title}
                    subtitle={`Olá, ${studentName.split(' ')[0]}! 👋`}
                    onBack={onBack}
                    accentColor="blue"
                    rightSlot={
                        coachLogo ? (
                            <img src={coachLogo} alt={coachName} className="h-11 w-auto rounded-[14px] border border-white/10 shadow-lg" />
                        ) : (
                            <div className="text-right flex flex-col justify-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-0.5">Personal</span>
                                <span className="text-xs font-black text-white tracking-wide">{coachName}</span>
                            </div>
                        )
                    }
                />

                {/* Split Selection */}
                <main className="max-w-md mx-auto px-5 py-2 pb-32">
                    <div className="mb-6">
                        <h2 className="text-2xl font-display font-black text-white mb-2">Escolha seu Treino</h2>
                        <p className="text-sm text-slate-400">Selecione qual treino você vai fazer hoje</p>
                    </div>

                    <div className="space-y-4">
                        {workout.splits.map((split, index) => {
                            // Extract letter from split name (e.g., "Treino A: Força..." -> "A")
                            const splitLetter = split.name.match(/[A-Z](?=:|$)/)?.[0] || split.name.charAt(0).toUpperCase();
                            // Use description if available, otherwise parse from name
                            const splitDescription = split.description || split.name.replace(/^Treino\s*[A-Z][\s:]*/, '').trim() || 'Treino Geral';

                            return (
                                <motion.button
                                    key={split.id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(20);
                                        setSelectedSplit(split);
                                    }}
                                    className="w-full glass-card p-5 rounded-[24px] text-left relative overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.98]"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div
                                            className="size-[60px] rounded-[18px] flex items-center justify-center flex-shrink-0"
                                            style={{
                                                background: 'var(--btn-primary-bg)',
                                                border: '1px solid var(--btn-primary-border)',
                                                boxShadow: 'var(--btn-primary-shadow)',
                                            }}
                                        >
                                            <span className="text-[26px] font-black" style={{ color: 'var(--btn-primary-text)' }}>
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
                                                    <Layers size={12} /> {split.exercises?.reduce((acc, e) => acc + (Array.isArray(e.sets) ? e.sets.length : 0), 0) || 0} séries
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={24} className="text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Demo Indicator */}
                    {!clientId && (
                        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                            <p className="text-xs text-blue-400 text-center">
                                ⚠️ Modo demonstração - Treinos de exemplo
                            </p>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // Workout Execution View (existing functionality)
    return (
        <div className="min-h-screen text-white" style={{ background: 'var(--bg-void)' }}>
            {/* Header Execution Premium */}
            <header
                className="sticky top-0 z-40 backdrop-blur-xl px-5 pt-12 pb-5 safe-area-top"
                style={isLightTheme
                    ? {
                        background: 'linear-gradient(180deg, rgba(231, 239, 252, 0.96) 0%, rgba(223, 233, 250, 0.9) 100%)',
                        borderBottom: '1px solid rgba(130, 170, 235, 0.28)',
                    }
                    : {
                        background: 'rgba(3,7,18,0.85)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
            >
                <div
                    className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
                    style={{
                        background: isLightTheme
                            ? 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(59, 130, 246,0.14) 0%, transparent 100%)'
                            : 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(59, 130, 246,0.08) 0%, transparent 100%)',
                    }}
                />

                <div className="max-w-md mx-auto relative z-10">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedSplit(null);
                                        setProcessedSplitId(null);
                                        setWorkoutStartTime(null);
                                        setShowFeedbackForm(false);
                                        setFeedbackCompletedExercises(new Set());
                                    }}
                                    className="size-11 rounded-2xl backdrop-blur-xl text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
                                    style={isLightTheme
                                        ? {
                                            background: 'rgba(255,255,255,0.66)',
                                            border: '1px solid rgba(130, 170, 235, 0.35)',
                                            boxShadow: '0 8px 22px rgba(63, 93, 152, 0.16)',
                                        }
                                        : {
                                            background: 'rgba(255,255,255,0.10)',
                                            border: '1px solid rgba(255,255,255,0.20)',
                                        }}
                                >
                                    <ArrowLeft size={20} strokeWidth={2.5} />
                                </button>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] mb-0.5">Treino {selectedSplit.name}</span>
                                    <span className="text-[15px] font-black tracking-wide text-white leading-tight pr-4">{selectedSplit.description}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-1.5 bg-slate-800/50 rounded-full overflow-hidden mb-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="absolute inset-y-0 left-0 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
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
                                Feedback: {feedbackCompletedExercises.size}/{requiredFeedbackCount}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {/* Rest Timer Overlay */}
            <AnimatePresence>
                {isResting && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
                    >
                        <div className="rounded-[24px] p-6 shadow-2xl" style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)', boxShadow: '0 16px 48px rgba(30, 58, 138,0.3)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <TimerIcon size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white/70">Descansando...</p>
                                        <p className="text-3xl font-black text-white">{formatTime(restTime)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsResting(false)}
                                    className="size-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                                >
                                    <Play size={24} className="ml-1" />
                                </button>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: restTime, ease: 'linear' }}
                                    className="h-full bg-white rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

            {/* Finish Button */}
            <div
                className="fixed bottom-0 left-0 right-0 py-6 px-4 pointer-events-none z-40 safe-area-bottom"
                style={isLightTheme
                    ? {
                        background: 'linear-gradient(to top, rgba(240,244,255,0.98) 0%, rgba(240,244,255,0.75) 42%, rgba(240,244,255,0) 100%)',
                    }
                    : {
                        background: 'linear-gradient(to top, rgba(2,8,23,1) 0%, rgba(2,8,23,0.9) 40%, rgba(2,8,23,0) 100%)',
                    }}
            >
                <div className="max-w-md mx-auto pointer-events-auto">
                    {progress >= 100 ? (
                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(100);
                                handleFinishWorkout();
                            }}
                            disabled={!canFinishWorkout}
                            className={`w-full py-4 rounded-2xl relative overflow-hidden group disabled:opacity-35 transition-all active:scale-[0.98] ${canFinishWorkout
                                ? 'cursor-pointer'
                                : 'opacity-80 cursor-not-allowed'
                                }`}
                            style={canFinishWorkout
                                ? {
                                    background: 'var(--btn-primary-bg)',
                                    border: '1px solid var(--btn-primary-border)',
                                    boxShadow: 'var(--btn-primary-shadow)',
                                }
                                : (isLightTheme
                                    ? {
                                        background: 'linear-gradient(145deg, rgba(214, 224, 242, 0.95), rgba(204, 216, 238, 0.95))',
                                        border: '1px solid rgba(130,170,235,0.28)',
                                        boxShadow: 'inset 0 1px 0 rgba(246,250,255,0.45)',
                                    }
                                    : {
                                        background: 'rgba(15,23,42,0.7)',
                                        border: '1px solid rgba(51,65,85,0.65)',
                                    })}
                        >
                            <div className="absolute inset-0 flex items-center justify-center gap-3 z-10 px-6">
                                <div className="flex-1 flex flex-col items-start justify-center">
                                    <span
                                        className="font-black uppercase tracking-[0.15em] text-[13px] leading-tight"
                                        style={{ color: canFinishWorkout ? 'var(--btn-primary-text)' : (isLightTheme ? '#3D5A80' : '#7A9FCC') }}
                                    >
                                        Encerrar Sessão
                                    </span>
                                    <span
                                        className="text-[10px] font-semibold tracking-wide"
                                        style={{ color: canFinishWorkout ? 'rgba(244,248,255,0.78)' : (isLightTheme ? '#64748B' : '#64748B') }}
                                    >
                                        {isColdStartWorkout && !hasAllRequiredFeedback
                                            ? 'Feedback obrigatório Pendente'
                                            : 'Excelente trabalho hoje'}
                                    </span>
                                </div>
                                <div
                                    className="size-11 rounded-[14px] backdrop-blur-sm flex items-center justify-center mt-px"
                                    style={canFinishWorkout
                                        ? {
                                            background: 'rgba(255,255,255,0.18)',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                        }
                                        : (isLightTheme
                                            ? {
                                                background: 'rgba(255,255,255,0.45)',
                                                border: '2px solid rgba(130,170,235,0.28)',
                                            }
                                            : {
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '2px solid rgba(255,255,255,0.12)',
                                            })}
                                >
                                    <Check
                                        size={20}
                                        strokeWidth={3}
                                        style={{ color: canFinishWorkout ? '#FFFFFF' : (isLightTheme ? '#64748B' : '#64748B') }}
                                    />
                                </div>
                            </div>
                        </button>
                    ) : (
                        <div
                            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 backdrop-blur-md"
                            style={isLightTheme
                                ? {
                                    background: 'linear-gradient(145deg, rgba(222, 232, 248, 0.92), rgba(212, 224, 244, 0.92))',
                                    border: '1px solid rgba(130,170,235,0.28)',
                                    boxShadow: 'inset 0 1px 0 rgba(246,250,255,0.45)',
                                }
                                : {
                                    background: 'rgba(2, 12, 37, 0.86)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                        >
                            <Trophy size={18} style={{ color: isLightTheme ? '#526A8C' : '#64748B' }} />
                            <span className="font-black text-[11px] uppercase tracking-widest" style={{ color: isLightTheme ? '#3D5A80' : '#64748B' }}>
                                {Math.round(progress)}% Concluído
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedbackForm && selectedSplit && selectedSplit.exercises[feedbackExerciseIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
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

            {/* Completion Modal */}
            <AnimatePresence>
                {showCompleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                        >
                            {/* Celebration Animation */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', bounce: 0.6, delay: 0.2 }}
                                className="size-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50"
                            >
                                <Trophy size={64} className="text-white" />
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-3xl font-black text-white mb-2"
                            >
                                Treino Concluído! 🎉
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-slate-400 mb-8"
                            >
                                Excelente trabalho, {studentName.split(' ')[0]}!
                            </motion.p>

                            {/* Stats */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="grid grid-cols-3 gap-4 mb-8"
                            >
                                <div className="bg-white/5 rounded-2xl p-4">
                                    <p className="text-2xl font-black text-emerald-400">{selectedSplit?.exercises.length || 0}</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase">Exercícios</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4">
                                    <p className="text-2xl font-black text-blue-400">{totalSets}</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase">Séries</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4">
                                    <div className="flex items-center justify-center gap-1">
                                        <Flame size={20} className="text-orange-400" />
                                        <span className="text-2xl font-black text-orange-400">45</span>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase">Minutos</p>
                                </div>
                            </motion.div>

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                onClick={() => {
                                    setShowCompleteModal(false);
                                    setSelectedSplit(null);
                                    setProcessedSplitId(null);
                                    setWorkoutStartTime(null);
                                    setShowFeedbackForm(false);
                                    setFeedbackCompletedExercises(new Set());
                                }}
                                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                            >
                                Fechar
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
