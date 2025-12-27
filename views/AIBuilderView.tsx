import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { mockClients } from '../mocks/demoData';

interface AIBuilderViewProps {
  user: any;
  onBack: () => void;
  onDone: () => void;
}

// Smart workout generator using mockExercises DB
import { mockExercises } from '../mocks/demoData';

const generateSmartWorkout = (clientName: string, goal: string, days: number, observations: string) => {
  // Helper to get exercises by muscle
  const getEx = (muscle: string, count: number) => {
    return mockExercises
      .filter(e => (e.targetMuscle?.includes(muscle) ?? false) || (muscle === 'Cardio' && e.category === 'cardio'))
      .sort(() => 0.5 - Math.random())
      .slice(0, count)
      .map(e => ({
        name: e.name,
        sets: 4, // Default to 4 sets for Elite Protocol
        reps: e.sets?.[0]?.reps || '12',
        rest: e.sets?.[0]?.rest || '60s',
        targetMuscle: e.targetMuscle || 'Geral'
      }));
  };

  // Define Splits based on Goal
  let steps: any[] = [];
  let title = '';
  let objective = '';

  if (goal === 'Hipertrofia') {
    title = `Protocolo de Hipertrofia - ${clientName}`;
    objective = 'Foco em tensão mecânica e volume progressivo para maximizar ganho muscular.';

    // Logic for splits based on days
    const splitA = {
      name: 'Treino A - Superior (Empurrar)',
      exercises: [
        ...getEx('Peito', 2),
        ...getEx('Ombro', 1),
        ...getEx('Tríceps', 1),
        ...getEx('Cardio', 1)
      ]
    };

    const splitB = {
      name: 'Treino B - Superior (Puxar)',
      exercises: [
        ...getEx('Costas', 2),
        ...getEx('Bíceps', 2),
        ...getEx('Posterior de Coxa', 0), // Hack to just shuffle
        ...getEx('Cardio', 1)
      ]
    };

    const splitC = {
      name: 'Treino C - Inferior Completo',
      exercises: [
        ...getEx('Quadríceps', 2),
        ...getEx('Posterior de Coxa', 1),
        ...getEx('Glúteo', 1),
        ...getEx('Panturrilha', 1)
      ]
    };

    steps = [splitA, splitB, splitC];
  } else if (goal === 'Emagrecimento') {
    title = `Protocolo Fat Burn - ${clientName}`;
    objective = 'Alta intensidade metabólica para queima de gordura acelerada.';

    const splitA = {
      name: 'Treino A - Full Body Metabólico',
      exercises: [
        ...getEx('Pernas', 0), // Hack
        ...getEx('Quadríceps', 1),
        ...getEx('Peito', 1),
        ...getEx('Costas', 1),
        ...getEx('Cardio', 2)
      ]
    };

    const splitB = {
      name: 'Treino B - Inferior & Cardio',
      exercises: [
        ...getEx('Posterior de Coxa', 1),
        ...getEx('Glúteo', 1),
        ...getEx('Panturrilha', 1),
        ...getEx('Cardio', 2)
      ]
    };
    steps = [splitA, splitB];
  } else {
    // Default / Other goals
    title = `Protocolo Personalizado - ${clientName}`;
    objective = 'Adaptação geral e condicionamento físico.';
    steps = [
      {
        name: 'Treino Adaptativo',
        exercises: [
          ...getEx('Quadríceps', 1),
          ...getEx('Peito', 1),
          ...getEx('Costas', 1),
          ...getEx('Cardio', 1)
        ]
      }
    ];
  }

  // Ensure enough splits for days selected (repeat if needed)
  const finalSplits = [];
  for (let i = 0; i < days; i++) {
    finalSplits.push(steps[i % steps.length]);
  }

  return {
    title,
    objective,
    splits: finalSplits
  };
};

const AIBuilderView: React.FC<AIBuilderViewProps> = ({ user, onBack, onDone }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedGoal, setSelectedGoal] = useState('Hipertrofia');
  const [selectedDays, setSelectedDays] = useState(4);
  const [observations, setObservations] = useState('');
  const [result, setResult] = useState<any>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const quickTags = [
    '+ Lesão no ombro',
    '+ Sem equipamentos',
    '+ Treino curto (30min)',
    '+ Foco em core'
  ];

  const messages = [
    "Analisando perfil biotipológico...",
    "Otimizando volume de treinamento...",
    "Selecionando exercícios de alta sinergia...",
    "Ajustando densidade e descanso...",
    "Finalizando protocolo de elite..."
  ];


  useEffect(() => {
    // Mock loading clients for Demo
    setTimeout(() => {
      setClients(mockClients);
      setSelectedClient(mockClients[0]);
      setFetchingClients(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (!selectedClient) return;
    setLoading(true);
    setLoadingMessageIndex(0);

    setTimeout(() => {
      const workout = generateSmartWorkout(
        selectedClient.name,
        selectedGoal,
        selectedDays,
        observations
      );
      setResult(workout);
      setLoading(false);
      setActiveTabIndex(0);
    }, 4000); // 4 Seconds artificial delay for effect
  };

  const handleSaveWorkout = async () => {
    // Simulated Save
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onDone();
    }, 1500);
  };

  const handleSendWhatsApp = () => {
    if (!result) return;
    const currentSplit = result.splits?.[activeTabIndex];

    let message = `🏋️ *${result.title}*\n\n`;
    message += `📋 *${currentSplit?.name}*\n\n`;

    currentSplit?.exercises?.forEach((ex: any, i: number) => {
      message += `${i + 1}. *${ex.name}*\n`;
      message += `   ${ex.sets} séries x ${ex.reps} • Descanso: ${ex.rest}\n\n`;
    });

    message += `\n💪 Bom treino, ${selectedClient?.name}!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 z-50 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 size-64 bg-blue-600 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 size-64 bg-purple-600 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="size-24 rounded-[32px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-10 shadow-glow animate-bounce">
            <span className="material-symbols-outlined text-white text-[48px]">psychology</span>
          </div>

          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">PersonalPro IA</h2>
          <div className="h-6 overflow-hidden">
            <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em]">
              {messages[loadingMessageIndex]}
            </p>
          </div>

          <div className="mt-12 w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${(loadingMessageIndex + 1) * 20}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      <header className="sticky top-0 bg-transparent px-6 py-4 z-30">
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={onBack}
            className="size-10 rounded-full glass-card flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-black text-white tracking-tight">AI Builder</h2>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Protocolos de Elite</p>
          </div>
          <div className="size-10"></div>
        </div>
      </header>

      <div className="p-6 space-y-8 pb-32">
        {/* Client Selection */}
        <section className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="material-symbols-outlined text-blue-400 text-xl">person_search</span>
              <h3 className="font-black text-white tracking-tight">Selecione o Aluno</h3>
            </div>
            {fetchingClients ? (
              <div className="h-24 glass-card rounded-3xl animate-pulse bg-white/5" />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`min-w-[100px] flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-300 ${selectedClient?.id === client.id
                      ? 'glass-card border-blue-500/50 bg-blue-500/10 shadow-glow scale-105'
                      : 'glass-card opacity-40 hover:opacity-100'
                      }`}
                  >
                    <div
                      className={`size-14 rounded-2xl bg-cover bg-center border-2 ${selectedClient?.id === client.id ? 'border-blue-400' : 'border-white/10'
                        } transition-colors`}
                      style={{ backgroundImage: client.avatar ? `url(${client.avatar})` : 'none' }}
                    >
                      {!client.avatar && <span className="material-symbols-outlined text-slate-500 flex h-full items-center justify-center">person</span>}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedClient?.id === client.id ? 'text-blue-400' : 'text-slate-500'
                      }`}>{client.name.split(' ')[0]}</span>
                  </button>
                ))}
                {clients.length === 0 && (
                  <p className="text-xs text-slate-500 font-bold px-2 italic">Nenhum aluno cadastrado.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="material-symbols-outlined text-indigo-400 text-xl">target</span>
              <h3 className="font-black text-white tracking-tight">Objetivo Principal</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Hipertrofia', 'Emagrecimento', 'Resistência', 'Saúde'].map(goal => (
                <button
                  key={goal}
                  onClick={() => setSelectedGoal(goal)}
                  className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectedGoal === goal
                    ? 'bg-blue-600 text-white shadow-glow translate-y-[-2px]'
                    : 'glass-card text-slate-500'
                    }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="material-symbols-outlined text-amber-400 text-xl">notes</span>
            <h3 className="font-black text-white tracking-tight">Observações</h3>
          </div>

          <div className="glass-card rounded-[28px] p-4 mb-4">
            <textarea
              placeholder="Ex: Aluno com lesão no ombro, focar em bíceps..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-transparent text-white placeholder:text-slate-500 text-sm outline-none min-h-[120px] resize-none font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickTags.map(tag => (
              <button
                key={tag}
                onClick={() => setObservations(prev => prev ? `${prev}, ${tag}` : tag)}
                className="px-4 py-2 rounded-full glass-card border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        <div className="pt-6">
          <button
            onClick={handleGenerate}
            disabled={!selectedClient || !selectedGoal || loading}
            className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black rounded-3xl text-sm transition-all shadow-xl shadow-blue-900/40 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
          >
            <span className="material-symbols-outlined">bolt</span>
            Forjar Protocolo de Elite
          </button>
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-fade-in">
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-0 right-0 size-96 bg-blue-600 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 size-96 bg-purple-600 rounded-full blur-[120px]"></div>
          </div>

          <header className="relative z-10 px-6 pt-14 pb-6 glass-card bg-slate-950/50 border-0 border-b border-white/10 rounded-0">
            <div className="flex justify-between items-center">
              <button onClick={() => setResult(null)} className="size-10 rounded-full glass-card flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="text-center">
                <h3 className="text-lg font-black text-white tracking-tight">{result.title}</h3>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{selectedClient?.name}</p>
              </div>
              <button onClick={handleSendWhatsApp} className="size-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </header>

          <main className="relative z-10 flex-1 overflow-y-auto px-6 py-6 no-scrollbar pb-32">
            <div className="glass-card rounded-[32px] p-6 mb-8 border-l-4 border-blue-500">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estratégia de Treino</p>
              <p className="text-white font-medium leading-relaxed">{result.objective}</p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
              {result.splits?.map((split: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveTabIndex(idx)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTabIndex === idx ? 'bg-blue-600 text-white shadow-glow' : 'glass-card text-slate-500'}`}
                >
                  {split.name}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {result.splits?.[activeTabIndex]?.exercises.map((ex: any, idx: number) => (
                <div key={idx} className="glass-card rounded-3xl p-5 group hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-black">{idx + 1}</div>
                    <span className="text-[9px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded-full uppercase tracking-widest">{ex.targetMuscle}</span>
                  </div>
                  <h4 className="text-white font-black text-lg mb-1 tracking-tight">{ex.name}</h4>
                  <div className="flex gap-4">
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Séries</p>
                      <p className="text-white font-black">{ex.sets}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reps</p>
                      <p className="text-white font-black">{ex.reps}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Descanso</p>
                      <p className="text-indigo-400 font-black">{ex.rest}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>

          <footer className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 max-w-md mx-auto z-20">
            <button
              onClick={handleSaveWorkout}
              className="w-full h-16 bg-white text-slate-950 font-black rounded-3xl flex items-center justify-center gap-3 uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Salvar Protocolo
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default AIBuilderView;
