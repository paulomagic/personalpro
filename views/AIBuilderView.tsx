
import React, { useState, useEffect } from 'react';

interface AIBuilderViewProps {
  onBack: () => void;
  onDone: () => void;
}

// Mock workout generator (fallback when API is not available)
const generateMockWorkout = (clientName: string, goal: string, level: string, days: number, observations: string) => {
  const workouts: { [key: string]: any } = {
    'Hipertrofia': {
      title: `Protocolo de Hipertrofia - ${clientName}`,
      objective: 'Ganho de massa muscular com foco em volume progressivo',
      duration: '60-75 min',
      splits: [
        {
          name: 'Treino A - Peito e Tríceps',
          exercises: [
            { name: 'Supino Reto com Barra', sets: 4, reps: '8-10', rest: '90s', targetMuscle: 'Peitoral Maior' },
            { name: 'Supino Inclinado Halteres', sets: 4, reps: '10-12', rest: '75s', targetMuscle: 'Peitoral Superior' },
            { name: 'Crucifixo Máquina', sets: 3, reps: '12-15', rest: '60s', targetMuscle: 'Peitoral' },
            { name: 'Tríceps Pulley Corda', sets: 4, reps: '12-15', rest: '60s', targetMuscle: 'Tríceps' },
            { name: 'Tríceps Francês', sets: 3, reps: '10-12', rest: '60s', targetMuscle: 'Tríceps Longo' },
          ]
        },
        {
          name: 'Treino B - Costas e Bíceps',
          exercises: [
            { name: 'Puxada Frontal', sets: 4, reps: '8-10', rest: '90s', targetMuscle: 'Dorsal' },
            { name: 'Remada Curvada', sets: 4, reps: '8-10', rest: '90s', targetMuscle: 'Costas Média' },
            { name: 'Remada Unilateral', sets: 3, reps: '10-12', rest: '60s', targetMuscle: 'Dorsal' },
            { name: 'Rosca Direta Barra', sets: 4, reps: '10-12', rest: '60s', targetMuscle: 'Bíceps' },
            { name: 'Rosca Martelo', sets: 3, reps: '12-15', rest: '60s', targetMuscle: 'Braquial' },
          ]
        },
        {
          name: 'Treino C - Pernas',
          exercises: [
            { name: 'Agachamento Livre', sets: 4, reps: '8-10', rest: '120s', targetMuscle: 'Quadríceps' },
            { name: 'Leg Press 45°', sets: 4, reps: '10-12', rest: '90s', targetMuscle: 'Quadríceps' },
            { name: 'Cadeira Extensora', sets: 3, reps: '12-15', rest: '60s', targetMuscle: 'Quadríceps' },
            { name: 'Mesa Flexora', sets: 4, reps: '10-12', rest: '60s', targetMuscle: 'Posterior' },
            { name: 'Panturrilha Sentado', sets: 4, reps: '15-20', rest: '45s', targetMuscle: 'Panturrilha' },
          ]
        },
        {
          name: 'Treino D - Ombros e Abdômen',
          exercises: [
            { name: 'Desenvolvimento Halteres', sets: 4, reps: '8-10', rest: '90s', targetMuscle: 'Deltóide' },
            { name: 'Elevação Lateral', sets: 4, reps: '12-15', rest: '60s', targetMuscle: 'Deltóide Lateral' },
            { name: 'Elevação Frontal', sets: 3, reps: '12-15', rest: '60s', targetMuscle: 'Deltóide Anterior' },
            { name: 'Face Pull', sets: 3, reps: '15-20', rest: '45s', targetMuscle: 'Deltóide Posterior' },
            { name: 'Abdominal Máquina', sets: 3, reps: '15-20', rest: '45s', targetMuscle: 'Reto Abdominal' },
          ]
        }
      ]
    },
    'Emagrecer': {
      title: `Protocolo Fat Burn - ${clientName}`,
      objective: 'Emagrecimento com preservação de massa muscular',
      duration: '45-60 min',
      splits: [
        {
          name: 'Treino A - Full Body Intenso',
          exercises: [
            { name: 'Agachamento com Salto', sets: 4, reps: '15', rest: '45s', targetMuscle: 'Pernas' },
            { name: 'Flexão de Braço', sets: 4, reps: '12-15', rest: '45s', targetMuscle: 'Peito' },
            { name: 'Remada com Halteres', sets: 4, reps: '12', rest: '45s', targetMuscle: 'Costas' },
            { name: 'Burpees', sets: 3, reps: '10', rest: '60s', targetMuscle: 'Full Body' },
            { name: 'Prancha', sets: 3, reps: '45s', rest: '30s', targetMuscle: 'Core' },
          ]
        },
        {
          name: 'Treino B - HIIT + Força',
          exercises: [
            { name: 'Mountain Climbers', sets: 4, reps: '30s', rest: '30s', targetMuscle: 'Core/Cardio' },
            { name: 'Kettlebell Swing', sets: 4, reps: '15', rest: '45s', targetMuscle: 'Posterior' },
            { name: 'Thruster', sets: 4, reps: '12', rest: '60s', targetMuscle: 'Full Body' },
            { name: 'Box Jump', sets: 3, reps: '12', rest: '45s', targetMuscle: 'Pernas' },
            { name: 'Battle Ropes', sets: 3, reps: '30s', rest: '45s', targetMuscle: 'Braços/Core' },
          ]
        }
      ]
    },
    'Resistência': {
      title: `Protocolo Endurance - ${clientName}`,
      objective: 'Aumento da resistência muscular e cardiovascular',
      duration: '50-60 min',
      splits: [
        {
          name: 'Treino A - Circuito Superior',
          exercises: [
            { name: 'Supino Máquina', sets: 3, reps: '20', rest: '30s', targetMuscle: 'Peito' },
            { name: 'Puxada Frontal', sets: 3, reps: '20', rest: '30s', targetMuscle: 'Costas' },
            { name: 'Desenvolvimento', sets: 3, reps: '20', rest: '30s', targetMuscle: 'Ombros' },
            { name: 'Tríceps Corda', sets: 3, reps: '20', rest: '30s', targetMuscle: 'Tríceps' },
            { name: 'Rosca Direta', sets: 3, reps: '20', rest: '30s', targetMuscle: 'Bíceps' },
          ]
        },
        {
          name: 'Treino B - Circuito Inferior',
          exercises: [
            { name: 'Leg Press', sets: 3, reps: '25', rest: '30s', targetMuscle: 'Quadríceps' },
            { name: 'Cadeira Flexora', sets: 3, reps: '20', rest: '30s', targetMuscle: 'Posterior' },
            { name: 'Cadeira Adutora', sets: 3, reps: '20', rest: '30s', targetMuscle: 'Adutores' },
            { name: 'Panturrilha', sets: 3, reps: '25', rest: '30s', targetMuscle: 'Panturrilha' },
            { name: 'Corrida Esteira', sets: 1, reps: '15min', rest: '-', targetMuscle: 'Cardio' },
          ]
        }
      ]
    },
    'Saúde': {
      title: `Protocolo Wellness - ${clientName}`,
      objective: 'Melhora da saúde geral, mobilidade e qualidade de vida',
      duration: '40-50 min',
      splits: [
        {
          name: 'Treino A - Funcional',
          exercises: [
            { name: 'Agachamento Livre', sets: 3, reps: '12', rest: '60s', targetMuscle: 'Pernas' },
            { name: 'Remada com Elástico', sets: 3, reps: '15', rest: '45s', targetMuscle: 'Costas' },
            { name: 'Prancha Frontal', sets: 3, reps: '30s', rest: '30s', targetMuscle: 'Core' },
            { name: 'Ponte de Glúteos', sets: 3, reps: '15', rest: '45s', targetMuscle: 'Glúteos' },
            { name: 'Alongamento Global', sets: 1, reps: '10min', rest: '-', targetMuscle: 'Mobilidade' },
          ]
        },
        {
          name: 'Treino B - Mobilidade',
          exercises: [
            { name: 'Caminhada Esteira', sets: 1, reps: '20min', rest: '-', targetMuscle: 'Cardio' },
            { name: 'Yoga Flow', sets: 1, reps: '15min', rest: '-', targetMuscle: 'Flexibilidade' },
            { name: 'Respiração Diafragmática', sets: 3, reps: '10 ciclos', rest: '30s', targetMuscle: 'Core' },
            { name: 'Foam Rolling', sets: 1, reps: '10min', rest: '-', targetMuscle: 'Recuperação' },
          ]
        }
      ]
    }
  };

  const selectedWorkout = workouts[goal] || workouts['Hipertrofia'];

  // Limit splits based on days selected
  selectedWorkout.splits = selectedWorkout.splits.slice(0, Math.min(days, selectedWorkout.splits.length));

  // Add observations note if provided
  if (observations) {
    selectedWorkout.notes = `Observações especiais: ${observations}`;
  }

  return selectedWorkout;
};

const AIBuilderView: React.FC<AIBuilderViewProps> = ({ onBack, onDone }) => {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedClient, setSelectedClient] = useState<string | null>('ana');
  const [selectedGoal, setSelectedGoal] = useState('Hipertrofia');
  const [selectedDays, setSelectedDays] = useState(4);
  const [observations, setObservations] = useState('');
  const [result, setResult] = useState<any>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const clients = [
    { id: 'ana', name: 'Ana Silva', level: 'Intermediário', avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=100&h=100&fit=crop' },
    { id: 'carlos', name: 'Carlos S.', level: 'Iniciante', avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=100&h=100&fit=crop' },
    { id: 'julia', name: 'Júlia Costa', level: 'Avançado', avatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100&h=100&fit=crop' },
  ];

  const goals = [
    { name: 'Hipertrofia', icon: 'fitness_center' },
    { name: 'Emagrecer', icon: 'directions_run' },
    { name: 'Resistência', icon: 'speed' },
    { name: 'Saúde', icon: 'favorite' },
  ];

  const quickTags = [
    '+ Lesão no ombro',
    '+ Sem equipamentos',
    '+ Treino curto (30min)',
    '+ Foco em core'
  ];

  const loadingMessages = [
    "Analisando perfil do aluno...",
    "Calculando volume ideal...",
    "Estruturando periodização...",
    "Otimizando seleção de exercícios...",
    "Finalizando protocolo..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingStep(0);

    const client = clients.find(c => c.id === selectedClient);

    // Simulate AI processing time
    setTimeout(() => {
      const workout = generateMockWorkout(
        client?.name || 'Aluno',
        selectedGoal,
        client?.level || 'Intermediário',
        selectedDays,
        observations
      );
      setResult(workout);
      setLoading(false);
      setActiveTabIndex(0);
    }, 4000);
  };

  const handleSendWhatsApp = () => {
    const client = clients.find(c => c.id === selectedClient);
    const currentSplit = result?.splits?.[activeTabIndex];

    let message = `🏋️ *${result?.title}*\n\n`;
    message += `📋 *${currentSplit?.name}*\n\n`;

    currentSplit?.exercises?.forEach((ex: any, i: number) => {
      message += `${i + 1}. *${ex.name}*\n`;
      message += `   ${ex.sets} séries x ${ex.reps} • Descanso: ${ex.rest}\n\n`;
    });

    message += `\n💪 Bom treino, ${client?.name}!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900 flex flex-col items-center justify-center p-8">
        <div className="relative mb-12">
          <div className="absolute inset-0 size-32 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative size-28 bg-slate-800/80 backdrop-blur rounded-full flex items-center justify-center border border-slate-700">
            <span className="material-symbols-outlined text-[56px] text-blue-400 animate-pulse">psychology</span>
          </div>
          <div className="absolute inset-0 size-28 border-2 border-blue-500/40 rounded-full animate-ping"></div>
        </div>

        <h4 className="text-white text-xl font-bold mb-2">{loadingMessages[loadingStep]}</h4>
        <p className="text-slate-400 text-sm mb-8">Aguarde enquanto a IA trabalha</p>

        <div className="flex gap-2">
          {loadingMessages.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${i <= loadingStep ? 'w-10 bg-blue-500' : 'w-3 bg-slate-700'
                }`}
            />
          ))}
        </div>

        <p className="text-slate-600 text-xs font-medium mt-12 uppercase tracking-widest">PersonalPro IA</p>
      </div>
    );
  }

  if (result) {
    const currentSplit = result.splits?.[activeTabIndex];

    return (
      <div className="max-w-md mx-auto min-h-screen bg-white pb-32">
        <header className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-30">
          <button onClick={() => setResult(null)} className="size-10 rounded-full bg-slate-50 flex items-center justify-center active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </button>
          <h2 className="font-bold text-slate-900">Treino Gerado</h2>
          <button
            onClick={handleSendWhatsApp}
            className="size-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-lg">share</span>
          </button>
        </header>

        <div className="p-6">
          {/* Workout Info */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[24px] p-5 mb-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined">auto_awesome</span>
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Gerado com IA</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{result.title}</h3>
            <p className="text-blue-200 text-sm">{result.objective}</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">timer</span>
                <span className="text-sm font-medium">{result.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span className="text-sm font-medium">{result.splits?.length}x por semana</span>
              </div>
            </div>
          </div>

          {/* Split Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
            {result.splits?.map((split: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveTabIndex(idx)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTabIndex === idx
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500'
                  }`}
              >
                {split.name.replace('Treino ', '')}
              </button>
            ))}
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            {currentSplit?.exercises?.map((ex: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-[20px] active:scale-[0.99] transition-transform">
                <div className="size-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-bold text-blue-600 shadow-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900">{ex.name}</h4>
                  <p className="text-sm text-slate-400">
                    {ex.sets} séries x {ex.reps} • {ex.rest} descanso
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 uppercase">
                  {ex.targetMuscle}
                </span>
              </div>
            ))}
          </div>

          {result.notes && (
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-amber-600 text-lg">info</span>
                <span className="font-semibold text-amber-800 text-sm">Observações</span>
              </div>
              <p className="text-amber-700 text-sm">{result.notes}</p>
            </div>
          )}
        </div>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 max-w-md mx-auto flex gap-3">
          <button
            onClick={() => setResult(null)}
            className="flex-1 h-14 bg-slate-100 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined">edit</span>
            Ajustar
          </button>
          <button
            onClick={handleSendWhatsApp}
            className="flex-1 h-14 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined">send</span>
            Enviar WhatsApp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-30">
        <button onClick={onBack} className="size-10 rounded-full bg-slate-50 flex items-center justify-center active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </button>
        <h2 className="font-bold text-slate-900">Criar Treino com IA</h2>
        <div className="size-10"></div>
      </header>

      <div className="p-6 space-y-8">
        {/* Client Selection */}
        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-4">Para quem vamos criar?</h3>

          {/* Client Cards */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className={`flex-shrink-0 w-28 p-4 rounded-[20px] border-2 transition-all ${selectedClient === client.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-100 bg-white'
                  }`}
              >
                <div className="relative mx-auto w-14 h-14 mb-3">
                  <div
                    className="w-full h-full rounded-full bg-cover bg-center border-2 border-white shadow-md"
                    style={{ backgroundImage: `url(${client.avatar})` }}
                  />
                  {selectedClient === client.id && (
                    <span className="absolute -top-1 -right-1 size-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xs">check</span>
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-sm text-center">{client.name}</h4>
                <p className="text-xs text-slate-400 text-center">{client.level}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Goal Selection */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Qual o objetivo?</h3>
          <div className="grid grid-cols-2 gap-3">
            {goals.map(goal => (
              <button
                key={goal.name}
                onClick={() => setSelectedGoal(goal.name)}
                className={`flex items-center gap-3 px-4 py-4 rounded-[16px] font-semibold text-sm transition-all ${selectedGoal === goal.name
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-slate-50 text-slate-600 border border-slate-100'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">{goal.icon}</span>
                {goal.name}
              </button>
            ))}
          </div>
        </section>

        {/* Days Selection */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Dias por semana?</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <button
                key={day}
                onClick={() => setSelectedDays(day)}
                className={`size-11 rounded-full font-bold text-sm transition-all ${selectedDays === day
                    ? 'bg-slate-900 text-white scale-110 shadow-lg'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
              >
                {day}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {selectedDays <= 2 ? '⚠️ Volume baixo - bom para iniciantes' :
              selectedDays <= 4 ? '✅ Recomendado para resultados consistentes' :
                selectedDays <= 5 ? '💪 Volume alto - atletas avançados' :
                  '🔥 Volume extremo - apenas atletas experientes'}
          </p>
        </section>

        {/* Observations */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Observações?</h3>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ex: Aluno tem condromalácia no joelho esquerdo..."
            className="w-full h-24 p-4 rounded-[16px] bg-slate-50 border border-slate-100 text-slate-900 placeholder:text-slate-300 resize-none focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {quickTags.map(tag => (
              <button
                key={tag}
                onClick={() => setObservations(prev => prev + (prev ? '\n' : '') + tag.replace('+ ', ''))}
                className="px-3 py-1.5 bg-slate-50 text-slate-500 text-xs font-medium rounded-full border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 max-w-md mx-auto">
        <button
          onClick={handleGenerate}
          disabled={!selectedClient}
          className="w-full h-14 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          Gerar Treino com IA
        </button>
      </div>
    </div>
  );
};

export default AIBuilderView;
