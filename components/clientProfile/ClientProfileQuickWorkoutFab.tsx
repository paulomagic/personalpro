import React from 'react';
import { Play } from 'lucide-react';

interface ClientProfileQuickWorkoutFabProps {
  onStartWorkout: (workout: any) => void;
}

const QUICK_WORKOUT_TEMPLATE = {
  title: 'Treino Rápido',
  objective: 'Demonstração',
  duration: '20min',
  exercises: [
    {
      id: 'demo-1',
      name: 'Supino Reto',
      category: 'chest',
      targetMuscle: 'Peitoral',
      sets: [
        { reps: 12, rest: 60 },
        { reps: 10, rest: 60 },
        { reps: 8, rest: 90 }
      ]
    },
    {
      id: 'demo-2',
      name: 'Agachamento Livre',
      category: 'legs',
      targetMuscle: 'Quadríceps',
      sets: [
        { reps: 15, rest: 90 },
        { reps: 12, rest: 90 },
        { reps: 10, rest: 120 }
      ]
    }
  ]
};

const ClientProfileQuickWorkoutFab: React.FC<ClientProfileQuickWorkoutFabProps> = ({ onStartWorkout }) => {
  return (
    <button
      onClick={() => onStartWorkout(QUICK_WORKOUT_TEMPLATE)}
      data-testid="quick-workout-button"
      className="fixed bottom-24 right-6 size-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-30"
    >
      <Play size={28} className="ml-1" />
    </button>
  );
};

export default ClientProfileQuickWorkoutFab;
