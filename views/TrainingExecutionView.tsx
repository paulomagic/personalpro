import React, { useState, useEffect, useMemo } from 'react';
import { Workout, WorkoutExercise, Exercise } from '../types';
import VideoPlayerModal from '../components/VideoPlayerModal';
import { FeedbackForm } from '../components/FeedbackForm';
import { saveSessionFeedbackWithRetry, flushQueuedFeedback, getProgressionSuggestion } from '../services/ai/feedback';
import { logFunnelEvent } from '../services/loggingService';
import type { SessionFeedback } from '../services/ai/feedback/types';
import {
  getWorkoutSplits,
  hasPendingSplitSelection,
  resolveActiveSplit,
  resolveExecutionExercises,
  resolveInitialSplitIndex,
} from '../services/trainingExecutionUtils';

interface TrainingExecutionViewProps {
  workout: Workout;
  onFinish: () => void;
}

const TrainingExecutionView: React.FC<TrainingExecutionViewProps> = ({ workout, onFinish }) => {
  const workoutSplits = useMemo(() => getWorkoutSplits(workout), [workout]);
  const [selectedSplitIndex, setSelectedSplitIndex] = useState<number | null>(() => resolveInitialSplitIndex(workoutSplits));
  const activeSplit = useMemo(
    () => resolveActiveSplit(workoutSplits, selectedSplitIndex),
    [workoutSplits, selectedSplitIndex]
  );
  const exercises = useMemo<(WorkoutExercise | Exercise)[]>(() => {
    return resolveExecutionExercises(workout, activeSplit);
  }, [workout, activeSplit]);
  const pendingSplitSelection = useMemo(
    () => hasPendingSplitSelection(workoutSplits, selectedSplitIndex),
    [workoutSplits, selectedSplitIndex]
  );

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentLoad, setCurrentLoad] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Feedback state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackExerciseIndex, setFeedbackExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const isColdStartWorkout = Boolean((workout as any)?.coldStartMode || (workout as any)?.ai_metadata?.coldStartMode);

  const parseRestSeconds = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (!value) return 90;
    const normalized = String(value).trim().toLowerCase();
    const mmss = normalized.match(/^(\d+):(\d{1,2})$/);
    if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
    const minutes = normalized.match(/(\d+)\s*min/);
    if (minutes) return Number(minutes[1]) * 60;
    const seconds = normalized.match(/(\d+)/);
    return seconds ? Number(seconds[1]) : 90;
  };

  const currentExercise = exercises[currentExerciseIndex] as WorkoutExercise;

  // Get exercise details
  const exerciseName = currentExercise?.name || 'Exercício';
  const totalSets = currentExercise?.sets?.length || 4;
  const targetReps = currentExercise?.sets?.[currentSet - 1]?.reps || 12;
  const targetMuscle = currentExercise?.targetMuscle || currentExercise?.category || 'Músculo';
  const restSeconds = parseRestSeconds(currentExercise?.sets?.[currentSet - 1]?.rest as any);
  const videoUrl = currentExercise?.videoUrl || '';

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (pendingSplitSelection) return;
    void flushQueuedFeedback();
    void logFunnelEvent('workout_execution_started', {
      workoutId: workout.id,
      coldStartMode: isColdStartWorkout,
      exercises: exercises.length,
      splitId: activeSplit?.id,
      splitName: activeSplit?.name
    });
  }, [workout.id, isColdStartWorkout, exercises.length, pendingSplitSelection, activeSplit?.id, activeSplit?.name]);

  useEffect(() => {
    if (pendingSplitSelection) return;
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setCurrentLoad(0);
    setIsResting(false);
    setRestTime(90);
    setShowFeedbackForm(false);
    setFeedbackExerciseIndex(0);
    setCompletedExercises(new Set());
  }, [selectedSplitIndex, pendingSplitSelection]);

  const finishWorkout = () => {
    void logFunnelEvent('workout_execution_finished', {
      workoutId: workout.id,
      coldStartMode: isColdStartWorkout,
      completedExercises: completedExercises.size,
      splitId: activeSplit?.id,
      splitName: activeSplit?.name
    });
    onFinish();
  };

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
      // Exercise completed - show feedback form
      setShowFeedbackForm(true);
      setFeedbackExerciseIndex(currentExerciseIndex);
    } else {
      // Last exercise - show feedback form
      setShowFeedbackForm(true);
      setFeedbackExerciseIndex(currentExerciseIndex);
    }
  };

  const handleFeedbackSubmit = async (feedback: Omit<SessionFeedback, 'session_date'>) => {
    try {
      const result = await saveSessionFeedbackWithRetry(feedback);

      if (result.success) {
        void logFunnelEvent('feedback_submitted', {
          workoutId: feedback.workout_id,
          exerciseId: feedback.exercise_id,
          queued: !!result.queued
        });

        // Mark exercise as completed
        setCompletedExercises(prev => new Set(prev).add(feedbackExerciseIndex));

        // Get progression suggestion
        const suggestion = result.queued
          ? null
          : await getProgressionSuggestion(
            feedback.student_id,
            feedback.exercise_id
          );

        if (suggestion) {
          // Show suggestion (could use toast/notification)
          console.log('[Feedback] Suggestion:', suggestion);
        }

        // Move to next exercise or finish
        const isLastExercise = feedbackExerciseIndex >= exercises.length - 1;
        if (!isLastExercise) {
          setCurrentExerciseIndex(feedbackExerciseIndex + 1);
          setCurrentSet(1);
          setCurrentLoad(0);
          setShowFeedbackForm(false);
        } else {
          // All exercises completed
          finishWorkout();
        }
      } else if (isColdStartWorkout) {
        alert('Não foi possível salvar o feedback. No modo inicial, o feedback é obrigatório para finalizar.');
        void logFunnelEvent('feedback_failed', {
          workoutId: feedback.workout_id,
          exerciseId: feedback.exercise_id,
          coldStartMode: true,
          reason: result.error || 'unknown_error'
        });
        return;
      } else if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        setCurrentLoad(0);
        setShowFeedbackForm(false);
      } else {
        finishWorkout();
      }
    } catch (error) {
      console.error('[Feedback] Error:', error);
      if (isColdStartWorkout) {
        alert('Erro ao salvar feedback. No modo inicial, tente novamente para concluir.');
        return;
      }

      alert('Erro ao salvar feedback. Continuando...');

      // Continue anyway
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        setCurrentLoad(0);
        setShowFeedbackForm(false);
      } else {
        finishWorkout();
      }
    }
  };

  const handleSkipFeedback = () => {
    if (isColdStartWorkout) {
      alert('No modo inicial, o feedback de cada exercício é obrigatório.');
      return;
    }

    // Move to next exercise or finish without feedback
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setCurrentLoad(0);
      setShowFeedbackForm(false);
    } else {
      finishWorkout();
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

  if (pendingSplitSelection) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col px-6 py-10">
        <div className="max-w-md mx-auto w-full">
          <button
            onClick={onFinish}
            aria-label="Voltar para treinos"
            className="mb-6 text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Voltar
          </button>

          <h1 className="text-3xl font-black tracking-tight mb-2">Escolha o treino de hoje</h1>
          <p className="text-sm text-slate-400 mb-8">
            Este plano possui {workoutSplits.length} splits. Selecione qual bloco você vai executar agora.
          </p>

          <div className="space-y-3">
            {workoutSplits.map((split, index) => {
              const splitExercises = Array.isArray(split.exercises) ? split.exercises.length : 0;
              return (
                <button
                  key={split.id || `${split.name}-${index}`}
                  onClick={() => setSelectedSplitIndex(index)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-white">{split.name || `Split ${index + 1}`}</p>
                      <p className="text-xs text-slate-400 mt-1">{split.description || 'Treino programado'}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                      {splitExercises} exercícios
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

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
          aria-label="Encerrar treino e voltar"
          className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-white" aria-hidden="true">arrow_back</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-black text-white tracking-tighter tabular-nums">{formatTime(elapsedTime)}</h2>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{workout.title || 'Treino'}</p>
          {activeSplit?.name && (
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
              {activeSplit.name}
            </p>
          )}
          {isColdStartWorkout && (
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Modo Inicial Ativo</p>
          )}
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

              {/* Video Button */}
              {videoUrl && (
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white text-sm font-medium transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">play_circle</span>
                  Ver Execução
                </button>
              )}
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
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                  Carga (KG)
                </p>
                <label htmlFor="current-load-input" className="sr-only">
                  Carga atual em quilos para {exerciseName}
                </label>
                <input
                  id="current-load-input"
                  type="number"
                  value={currentLoad || ''}
                  placeholder="0"
                  onChange={(e) => setCurrentLoad(Number(e.target.value))}
                  inputMode="decimal"
                  min={0}
                  step="0.5"
                  aria-label={`Carga atual em quilos para ${exerciseName}`}
                  className="w-full bg-transparent border-none text-white text-7xl font-black outline-none p-0 tabular-nums focus:text-blue-400 transition-colors placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Main Action */}
            <button
              onClick={handleCompleteSet}
              aria-label={currentSet === totalSets && currentExerciseIndex === exercises.length - 1
                ? 'Finalizar treino'
                : currentSet === totalSets
                  ? 'Ir para próximo exercício'
                  : 'Concluir série atual'}
              className="w-full h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-[32px] font-black text-lg uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-blue-900/40 active:scale-95 transition-all animate-slide-up stagger-2"
            >
              <span className="material-symbols-outlined text-3xl font-bold" aria-hidden="true">check</span>
              {currentSet === totalSets && currentExerciseIndex === exercises.length - 1
                ? 'Finalizar Treino'
                : currentSet === totalSets
                  ? 'Próximo Exercício'
                  : 'Concluir Série'}
            </button>
          </>
        )}
      </main>

      {/* Video Modal */}
      {showVideoModal && videoUrl && (
        <VideoPlayerModal
          videoUrl={videoUrl}
          exerciseName={exerciseName}
          onClose={() => setShowVideoModal(false)}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <FeedbackForm
              workoutId={workout.id || 'unknown'}
              studentId={workout.studentId || 'unknown'}
              exerciseId={(exercises[feedbackExerciseIndex] as any)?.id || `ex-${feedbackExerciseIndex}`}
              exerciseName={exercises[feedbackExerciseIndex]?.name || 'Exercício'}
              prescribedSets={Array.isArray((exercises[feedbackExerciseIndex] as any)?.sets) ? (exercises[feedbackExerciseIndex] as any).sets.length : 4}
              prescribedReps={`${(exercises[feedbackExerciseIndex] as any)?.sets?.[0]?.reps || 12}`}
              prescribedLoad={currentLoad}
              onSubmit={handleFeedbackSubmit}
              onCancel={handleSkipFeedback}
              allowCancel={!isColdStartWorkout}
              cancelLabel="Pular feedback"
              requirementNote={isColdStartWorkout ? 'Modo inicial: feedback obrigatório para calibrar treino e progressão.' : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingExecutionView;
