import React, { useState, useEffect } from 'react';
import { Workout, WorkoutExercise, Exercise } from '../types';

interface TrainingExecutionViewProps {
  workout: Workout;
  onFinish: () => void;
}

const TrainingExecutionView: React.FC<TrainingExecutionViewProps> = ({ workout, onFinish }) => {
  // Get exercises from workout (could be top-level or in splits)
  const getExercises = (): (WorkoutExercise | Exercise)[] => {
    if (workout.splits && workout.splits.length > 0) {
      // Get exercises from first split
      return workout.splits[0].exercises || [];
    }
    return workout.exercises || [];
  };

  const exercises = getExercises();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentLoad, setCurrentLoad] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentExercise = exercises[currentExerciseIndex] as WorkoutExercise;

  // Get exercise details
  const exerciseName = currentExercise?.name || 'Exercício';
  const totalSets = currentExercise?.sets?.length || 4;
  const targetReps = currentExercise?.sets?.[currentSet - 1]?.reps || 12;
  const targetMuscle = currentExercise?.targetMuscle || currentExercise?.category || 'Músculo';
  const restSeconds = currentExercise?.sets?.[currentSet - 1]?.rest || 90;

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = () => {
    if (currentSet < totalSets) {
      setIsResting(true);
      setRestTime(restSeconds);
      const timer = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsResting(false);
            setCurrentSet(prevSet => prevSet + 1);
            return restSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (currentExerciseIndex < exercises.length - 1) {
      // Next exercise
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setCurrentLoad(0);
    } else {
      // Workout finished
      onFinish();
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setCurrentSet(prev => prev + 1);
    setRestTime(restSeconds);
  };

  // Split exercise name for better display
  const nameParts = exerciseName.split(' ');
  const firstName = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ');
  const lastName = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ');

  if (exercises.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">fitness_center</span>
        <p className="text-slate-400 mb-6">Nenhum exercício encontrado neste treino</p>
        <button onClick={onFinish} className="px-6 py-3 bg-blue-600 rounded-xl font-bold">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Progress Bar Top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 z-50">
        <div
          className="h-full bg-blue-500 shadow-glow transition-all duration-700 ease-out"
          style={{ width: `${((currentExerciseIndex * totalSets + currentSet) / (exercises.length * totalSets)) * 100}%` }}
        ></div>
      </div>

      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-slate-950"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 pt-14 px-6 flex justify-between items-center animate-fade-in">
        <button
          onClick={onFinish}
          className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-black text-white tracking-tighter tabular-nums">{formatTime(elapsedTime)}</h2>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{workout.title || 'Treino'}</p>
        </div>

        <div className="size-12 rounded-2xl glass-card flex items-center justify-center">
          <span className="text-xs font-bold text-slate-400">{currentExerciseIndex + 1}/{exercises.length}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-end px-8 pb-12">
        {isResting ? (
          <div className="mb-12 text-center animate-fade-in">
            <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Descanso Ativo</p>
            <h1 className="text-[120px] font-black leading-none tracking-tighter tabular-nums text-white">
              {restTime}<span className="text-4xl text-blue-500 ml-2">s</span>
            </h1>
            <button
              onClick={skipRest}
              className="mt-8 px-8 py-4 glass-card rounded-2xl text-xs font-black uppercase tracking-widest text-white active:scale-95 transition-all"
            >
              Pular Descanso
            </button>
          </div>
        ) : (
          <>
            {/* Exercise Info */}
            <div className="mb-10 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-black leading-[0.9] tracking-tighter text-white">
                  {firstName}
                  {lastName && <><br />{lastName}</>}
                </h1>
                <div className="flex flex-col items-end">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 shadow-glow">
                    Série {currentSet}/{totalSets}
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{targetMuscle}</p>
                </div>
              </div>
            </div>

            {/* Reps & Load Display */}
            <div className="grid grid-cols-2 gap-8 mb-12 animate-slide-up stagger-1">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Meta</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-8xl font-black text-white leading-none tracking-tighter">{targetReps}</h2>
                  <span className="text-xl font-black text-blue-500 uppercase">Reps</span>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Carga (KG)
                </p>
                <input
                  type="number"
                  value={currentLoad || ''}
                  placeholder="0"
                  onChange={(e) => setCurrentLoad(Number(e.target.value))}
                  className="w-full bg-transparent border-none text-white text-7xl font-black outline-none p-0 tabular-nums focus:text-blue-400 transition-colors placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Main Action */}
            <button
              onClick={handleCompleteSet}
              className="w-full h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-[32px] font-black text-lg uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-blue-900/40 active:scale-95 transition-all animate-slide-up stagger-2"
            >
              <span className="material-symbols-outlined text-3xl font-bold">check</span>
              {currentSet === totalSets && currentExerciseIndex === exercises.length - 1
                ? 'Finalizar Treino'
                : currentSet === totalSets
                  ? 'Próximo Exercício'
                  : 'Concluir Série'}
            </button>
          </>
        )}
      </main>
    </div>
  );
};

export default TrainingExecutionView;
