
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
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
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

  const messages = [
    "Analisando perfil biotipológico...",
    "Otimizando volume de treinamento...",
    "Selecionando exercícios de alta sinergia...",
    "Ajustando densidade e descanso...",
    "Finalizando protocolo de elite..."
  ];

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
    setLoading(true);
    setLoadingMessageIndex(0);

    // const client = clients.find(c => c.id === selectedClient); // Old line
    // selectedClient is already the full client object

    // Simulate AI processing time
    setTimeout(() => {
      const workout = generateMockWorkout(
        selectedClient?.name || 'Aluno',
        selectedGoal,
        selectedClient?.level || 'Intermediário',
        selectedDays,
        observations
      );
      setResult(workout);
      setLoading(false);
      setActiveTabIndex(0);
    }, 4000);
  };

  const handleSendWhatsApp = () => {
    // const client = clients.find(c => c.id === selectedClient); // Old line
    // selectedClient is already the full client object
    const currentSplit = result?.splits?.[activeTabIndex];

    let message = `🏋️ *${result?.title}*\n\n`;
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
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 size-64 bg-blue-600 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 size-64 bg-purple-600 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="size-24 rounded-[32px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-10 shadow-glow animate-bounce">
            <span className="material-symbols-outlined text-white text-[48px]">psychology</span>
          </div>

          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Criando sua Obra-Prima</h2>
          <div className="h-6 overflow-hidden">
            <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] animate-slide-up">
              {messages[loadingMessageIndex]}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mt-12 w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${(loadingMessageIndex + 1) * 20}%` }}
            ></div>
          </div>
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
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Header */}
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

      <div className="p-6 space-y-8">
        {/* Client Selection */}
        <section className="space-y-6 animate-slide-up stagger-1">
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="material-symbols-outlined text-blue-400 text-xl">person_search</span>
              <h3 className="font-black text-white tracking-tight">Selecione o Aluno</h3>
            </div>
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
                    style={{ backgroundImage: `url(${client.avatar})` }}
                  />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedClient?.id === client.id ? 'text-blue-400' : 'text-slate-500'
                    }`}>{client.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
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

        <section className="animate-slide-up stagger-3">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="material-symbols-outlined text-amber-400 text-xl">notes</span>
            <h3 className="font-black text-white tracking-tight">Observações Adicionais</h3>
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

        {/* Generate Button */}
        <div className="pt-6 animate-slide-up stagger-4">
          <button
            onClick={handleGenerate}
            disabled={!selectedClient || !selectedGoal}
            className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black rounded-3xl text-sm transition-all shadow-xl shadow-blue-900/40 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 uppercase tracking-[0.2em] group"
          >
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">bolt</span>
            Forjar Protocolo de Elite
          </button>
        </div>
      </div>

      {/* Result Modal - Refined for Premium View */}
      {result && !loading && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-fade-in">
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-0 right-0 size-96 bg-blue-600 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 size-96 bg-purple-600 rounded-full blur-[120px]"></div>
          </div>

          <header className="relative z-10 px-6 pt-14 pb-6 glass-nav">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setResult(null)}
                className="size-10 rounded-full glass-card flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="text-center">
                <h3 className="text-lg font-black text-white tracking-tight">{result.title}</h3>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  {typeof selectedClient === 'string' ? selectedClient : selectedClient?.name}
                </p>
              </div>
              <button
                onClick={handleSendWhatsApp}
                className="size-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center"
              >
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </header>

          <main className="relative z-10 flex-1 overflow-y-auto px-6 py-6 no-scrollbar pb-32">
            <div className="glass-card rounded-[32px] p-6 mb-8 border-l-4 border-blue-500">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Objetivo Estratégico</p>
              <p className="text-white font-medium leading-relaxed">{result.objective}</p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
              {result.splits?.map((split: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveTabIndex(idx)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTabIndex === idx
                      ? 'bg-blue-600 text-white shadow-glow'
                      : 'glass-card text-slate-500'
                    }`}
                >
                  {split.name}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {result.splits?.[activeTabIndex]?.exercises.map((ex: any, idx: number) => (
                <div key={idx} className="glass-card rounded-3xl p-5 group hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-black">
                      {idx + 1}
                    </div>
                    <span className="text-[9px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded-full uppercase tracking-widest">
                      {ex.targetMuscle}
                    </span>
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
              onClick={onDone}
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
