import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Dumbbell, ChevronRight, Play, Pause, RotateCcw, Trophy, Flame, Timer as TimerIcon, ArrowLeft, Layers, AlertCircle } from 'lucide-react';
import { WorkoutExercise, ExerciseSet, WorkoutSplit } from '../types';
import { getClientCurrentWorkout } from '../services/supabaseClient';
import { mockExercises } from '../mocks/demoData';
import VideoPlayerModal from '../components/VideoPlayerModal';

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
    // States
    const [loading, setLoading] = useState(true);
    const [workout, setWorkout] = useState<{
        title: string;
        objective: string;
        duration: string;
        splits: WorkoutSplit[];
    } | null>(null);
    const [selectedSplit, setSelectedSplit] = useState<WorkoutSplit | null>(null);
    const [completions, setCompletions] = useState<ExerciseCompletion[]>([]);
    const [activeExercise, setActiveExercise] = useState<number>(0);
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(0);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [activeVideo, setActiveVideo] = useState<{ url: string; name: string } | null>(null);

    // Fetch workout data on mount
    useEffect(() => {
        const fetchWorkout = async () => {
            setLoading(true);

            if (clientId) {
                try {
                    const workoutData = await getClientCurrentWorkout(clientId);

                    if (workoutData && workoutData.splits && Array.isArray(workoutData.splits) && workoutData.splits.length > 0) {
                        setWorkout({
                            title: workoutData.title,
                            objective: workoutData.objective,
                            duration: workoutData.duration,
                            splits: workoutData.splits as WorkoutSplit[]
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
            setActiveExercise(0);
        }
    }, [selectedSplit, processedSplitId]);

    // Calculate progress
    const totalSets = selectedSplit?.exercises?.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0) || 0;
    const completedSets = completions.reduce((acc, comp) =>
        acc + comp.setCompletions.filter(Boolean).length, 0
    );
    const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

    // Toggle set completion
    const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
        const newCompletions = [...completions];
        newCompletions[exerciseIndex].setCompletions[setIndex] = !newCompletions[exerciseIndex].setCompletions[setIndex];
        setCompletions(newCompletions);

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

    // Handle workout completion
    const handleFinishWorkout = () => {
        setShowCompleteModal(true);
        if (onCompleteWorkout) {
            onCompleteWorkout();
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="size-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
            <div className="min-h-screen bg-slate-950 text-white">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-4 py-4 safe-area-top">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {onBack && (
                                    <button
                                        onClick={onBack}
                                        className="size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center active:scale-90 transition-all"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Olá, {studentName.split(' ')[0]}! 👋</p>
                                    <h1 className="text-lg font-black text-white">{workout.title}</h1>
                                </div>
                            </div>
                            {coachLogo ? (
                                <img src={coachLogo} alt={coachName} className="h-10 w-auto" />
                            ) : (
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Personal</p>
                                    <p className="text-sm font-bold text-white">{coachName}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Split Selection */}
                <main className="max-w-md mx-auto px-4 py-6 pb-32">
                    <div className="mb-6">
                        <h2 className="text-xl font-black text-white mb-2">Escolha seu Treino</h2>
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
                                    onClick={() => setSelectedSplit(split)}
                                    className="w-full glass-card p-5 rounded-[24px] text-left border border-white/5 hover:border-blue-500/50 active:scale-[0.98] transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                                            <span className="text-2xl font-black text-white">{splitLetter}</span>
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
                        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                            <p className="text-xs text-amber-400 text-center">
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
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-4 py-4 safe-area-top">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setSelectedSplit(null); setProcessedSplitId(null); }}
                                className="size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center active:scale-90 transition-all"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Olá, {studentName.split(' ')[0]}! 👋</p>
                                <h1 className="text-lg font-black text-white">Treino {selectedSplit.name} - {selectedSplit.description}</h1>
                            </div>
                        </div>
                        {coachLogo ? (
                            <img src={coachLogo} alt={coachName} className="h-10 w-auto" />
                        ) : (
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Personal</p>
                                <p className="text-sm font-bold text-white">{coachName}</p>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] font-bold text-slate-500">{completedSets} de {totalSets} séries</span>
                        <span className="text-[10px] font-bold text-emerald-400">{Math.round(progress)}% concluído</span>
                    </div>
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
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[24px] p-6 shadow-2xl shadow-blue-500/30">
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
                            onClick={() => setActiveExercise(exerciseIndex)}
                            className={`rounded-[24px] overflow-hidden transition-all ${isComplete
                                ? 'bg-emerald-500/10 border border-emerald-500/30'
                                : isActive
                                    ? 'bg-white/5 border border-blue-500/30'
                                    : 'bg-white/5 border border-white/5'
                                }`}
                        >
                            {/* Exercise Header */}
                            <div className="p-4 flex items-center gap-4">
                                <div className={`size-12 rounded-xl flex items-center justify-center transition-all ${isComplete
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                    }`}>
                                    {isComplete ? <Check size={24} /> : <Dumbbell size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-base ${isComplete ? 'text-emerald-400' : 'text-white'}`}>
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
                                                    className={`grid grid-cols-5 gap-2 items-center p-3 rounded-xl transition-all ${isSetComplete
                                                        ? 'bg-emerald-500/10'
                                                        : 'bg-slate-800/50'
                                                        }`}
                                                >
                                                    <div className="text-sm font-bold text-slate-400">
                                                        {setIndex + 1}
                                                    </div>
                                                    <div className={`text-sm font-bold ${isSetComplete ? 'text-emerald-400' : 'text-white'}`}>
                                                        {set.load || '-'}
                                                    </div>
                                                    <div className={`text-sm font-bold ${isSetComplete ? 'text-emerald-400' : 'text-white'}`}>
                                                        {set.reps || '-'}
                                                    </div>
                                                    <div className="text-sm font-medium text-slate-500">
                                                        {set.rest || '60s'}
                                                    </div>
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleSetComplete(exerciseIndex, setIndex); }}
                                                            className={`size-10 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${isSetComplete
                                                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                                                : 'border-slate-600 text-slate-600 hover:border-blue-500 hover:text-blue-500'
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
            <div className="fixed bottom-20 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-white/5 px-4 py-3 safe-area-bottom">
                <div className="max-w-md mx-auto">
                    {progress >= 100 ? (
                        <button
                            onClick={handleFinishWorkout}
                            className="w-full py-4 px-5 rounded-[20px] font-bold text-lg flex items-center gap-4 bg-emerald-950/30 border-2 border-emerald-500/50 text-white hover:bg-emerald-950/50 hover:border-emerald-400 active:scale-[0.98] transition-all"
                        >
                            <div className="size-12 rounded-xl bg-emerald-900/50 border-2 border-emerald-500/50 flex items-center justify-center flex-shrink-0">
                                <Check size={24} className="text-emerald-400" strokeWidth={3} />
                            </div>
                            <div className="flex flex-col items-start flex-1">
                                <span className="text-white font-bold">Encerrar sessão</span>
                                <span className="text-sm text-slate-400 font-normal">
                                    Ótimo trabalho hoje
                                </span>
                            </div>
                        </button>
                    ) : (
                        <button
                            disabled
                            className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-3 bg-slate-800 text-slate-500 cursor-not-allowed transition-all"
                        >
                            <Trophy size={20} />
                            <span>{Math.round(progress)}% Concluído</span>
                        </button>
                    )}
                </div>
            </div>

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
