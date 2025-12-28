import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Dumbbell, ChevronRight, Play, Pause, RotateCcw, Trophy, Flame, Timer as TimerIcon, ArrowLeft } from 'lucide-react';
import { WorkoutExercise, ExerciseSet } from '../types';
import { mockExercises } from '../mocks/demoData';

interface StudentViewProps {
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

const StudentView: React.FC<StudentViewProps> = ({
    studentName,
    coachName = 'Seu Personal',
    coachLogo,
    onCompleteWorkout,
    onBack
}) => {
    // Sample workout - in real app this would come from props or API
    const [workout] = useState({
        title: 'Treino A - Superior',
        objective: 'Hipertrofia',
        duration: '45 min',
        exercises: mockExercises.filter(e => ['ch1', 'ch2', 'sh1', 'sh2', 'tri1', 'bi1'].includes(e.id))
    });

    const [completions, setCompletions] = useState<ExerciseCompletion[]>(
        workout.exercises.map(ex => ({
            exerciseId: ex.id,
            setCompletions: ex.sets.map(() => false)
        }))
    );

    const [activeExercise, setActiveExercise] = useState<number>(0);
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(0);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    // Calculate progress
    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = completions.reduce((acc, comp) =>
        acc + comp.setCompletions.filter(Boolean).length, 0
    );
    const progress = (completedSets / totalSets) * 100;

    // Toggle set completion
    const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
        const newCompletions = [...completions];
        newCompletions[exerciseIndex].setCompletions[setIndex] = !newCompletions[exerciseIndex].setCompletions[setIndex];
        setCompletions(newCompletions);

        // Auto-start rest timer if completing a set
        if (newCompletions[exerciseIndex].setCompletions[setIndex]) {
            const restTimeSeconds = parseInt(workout.exercises[exerciseIndex].sets[setIndex].rest) || 60;
            startRestTimer(restTimeSeconds);
        }
    };

    // Rest timer
    const startRestTimer = (seconds: number) => {
        setRestTime(seconds);
        setIsResting(true);
    };

    React.useEffect(() => {
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
        return completions[exerciseIndex].setCompletions.every(Boolean);
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

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-4 py-4 safe-area-top">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-3">
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
                {workout.exercises.map((exercise, exerciseIndex) => {
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
                                        {exercise.targetMuscle} • {exercise.sets.length} séries
                                    </p>
                                </div>
                                <ChevronRight
                                    size={20}
                                    className={`text-slate-600 transition-transform ${isActive ? 'rotate-90' : ''}`}
                                />
                            </div>

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

                                        {exercise.sets.map((set, setIndex) => {
                                            const isSetComplete = completions[exerciseIndex].setCompletions[setIndex];

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
                                                        {set.load}
                                                    </div>
                                                    <div className={`text-sm font-bold ${isSetComplete ? 'text-emerald-400' : 'text-white'}`}>
                                                        {set.reps}
                                                    </div>
                                                    <div className="text-sm font-medium text-slate-500">
                                                        {set.rest}
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
            <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-white/5 p-4 safe-area-bottom">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleFinishWorkout}
                        disabled={progress < 100}
                        className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${progress >= 100
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98]'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <Trophy size={24} />
                        {progress >= 100 ? 'Finalizar Treino' : `${Math.round(progress)}% Concluído`}
                    </button>
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
                                    <p className="text-2xl font-black text-emerald-400">{workout.exercises.length}</p>
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
                                onClick={() => setShowCompleteModal(false)}
                                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                            >
                                Fechar
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentView;
