
import React, { useState } from 'react';
import { Workout } from '../types';

interface TrainingExecutionViewProps {
  workout: Workout;
  onFinish: () => void;
}

const TrainingExecutionView: React.FC<TrainingExecutionViewProps> = ({ workout, onFinish }) => {
  const [currentSet, setCurrentSet] = useState(2);
  const [currentLoad, setCurrentLoad] = useState(60);
  const totalSets = 4;

  const handleComplete = () => {
    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1200&fit=crop"
          alt="Training background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 pt-14 px-6 flex justify-between items-center">
        <button
          onClick={onFinish}
          className="size-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">14:30</h2>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Treino A</p>
        </div>

        <button className="size-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10">
          <span className="material-symbols-outlined text-white">more_vert</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-8">
        {/* Exercise Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-[36px] font-bold leading-tight">Supino Reto</h1>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <span className="material-symbols-outlined text-sm">repeat</span>
              <span className="text-sm font-bold">Série {currentSet}/{totalSets}</span>
            </div>
          </div>
          <p className="text-slate-400 text-base">Peitoral Maior • Barra Olímpica</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Reps */}
          <div>
            <h2 className="text-[80px] font-bold leading-none tracking-tight">12</h2>
            <p className="text-slate-400 text-base font-medium">repetições</p>
          </div>

          {/* Load Input */}
          <div>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              Carga Usada
              <span className="material-symbols-outlined text-sm">edit</span>
            </p>
            <div className="relative">
              <input
                type="number"
                value={currentLoad}
                onChange={(e) => setCurrentLoad(Number(e.target.value))}
                className="w-full h-20 bg-white/5 border border-white/10 rounded-2xl text-center text-[40px] font-bold focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">kg</span>
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <button
          onClick={handleComplete}
          className="w-full h-16 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[28px]">check</span>
          Concluir Série
        </button>

        {/* Rest Info */}
        <p className="text-center mt-4 text-sm text-slate-500">
          Descanso previsto: <span className="text-white font-semibold">90s</span>
        </p>
      </main>

      {/* Progress Bar Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(currentSet / totalSets) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default TrainingExecutionView;
