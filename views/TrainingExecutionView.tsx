
import React, { useState } from 'react';
import { Workout } from '../types';

interface TrainingExecutionViewProps {
  workout: Workout;
  onFinish: () => void;
}

const TrainingExecutionView: React.FC<TrainingExecutionViewProps> = ({ workout, onFinish }) => {
  const [currentSet, setCurrentSet] = useState(1);
  const [currentLoad, setCurrentLoad] = useState(60);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const totalSets = 4;

  const handleComplete = () => {
    if (currentSet < totalSets) {
      setIsResting(true);
      const timer = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsResting(false);
            setCurrentSet(prevSet => prevSet + 1);
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Progress Bar Top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 z-50">
        <div
          className="h-full bg-blue-500 shadow-glow transition-all duration-700 ease-out"
          style={{ width: `${(currentSet / totalSets) * 100}%` }}
        ></div>
      </div>

      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1200&fit=crop"
          alt="Training background"
          className="w-full h-full object-cover opacity-30 scale-110 active:scale-125 transition-transform duration-[10s]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
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
          <h2 className="text-2xl font-black text-white tracking-tighter tabular-nums">14:30</h2>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Protocolo Elite</p>
        </div>

        <button className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white">timer</span>
        </button>
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
              onClick={() => { setIsResting(false); setCurrentSet(prev => prev + 1); setRestTime(90); }}
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
                <h1 className="text-5xl font-black leading-[0.9] tracking-tighter text-white">Supino<br />Reto</h1>
                <div className="flex flex-col items-end">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 shadow-glow">
                    Série {currentSet}/{totalSets}
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Peitoral</p>
                </div>
              </div>
            </div>

            {/* Reps & Load Display */}
            <div className="grid grid-cols-2 gap-8 mb-12 animate-slide-up stagger-1">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Meta</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-8xl font-black text-white leading-none tracking-tighter">12</h2>
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
                  value={currentLoad}
                  onChange={(e) => setCurrentLoad(Number(e.target.value))}
                  className="w-full bg-transparent border-none text-white text-7xl font-black outline-none p-0 tabular-nums focus:text-blue-400 transition-colors"
                />
              </div>
            </div>

            {/* Main Action */}
            <button
              onClick={handleComplete}
              className="w-full h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-[32px] font-black text-lg uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-blue-900/40 active:scale-95 transition-all animate-slide-up stagger-2"
            >
              <span className="material-symbols-outlined text-3xl font-bold">check</span>
              Concluir Série
            </button>
          </>
        )}
      </main>
    </div>
  );
};

export default TrainingExecutionView;
