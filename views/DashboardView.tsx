import React, { useState } from 'react';
import { Client } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';

interface DashboardViewProps {
  onSelectClient: (client: Client) => void;
  onOpenAI: () => void;
  onOpenBrandHub?: () => void;
  onNavigate?: (view: string) => void;
}

const data = [
  { name: 'Seg', uv: 4 },
  { name: 'Ter', uv: 6 },
  { name: 'Qua', uv: 8 },
  { name: 'Qui', uv: 5 },
  { name: 'Sex', uv: 9 },
  { name: 'Sáb', uv: 4 },
  { name: 'Dom', uv: 2 },
];

const DashboardView: React.FC<DashboardViewProps> = ({ onSelectClient, onOpenAI, onOpenBrandHub, onNavigate }) => {
  const [clients] = useState<Client[]>([
    { id: '1', name: 'Ana Silva', avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop', goal: 'Hipertrofia', level: 'Intermediário', adherence: 75, lastTraining: 'Treino de Pernas • Em andamento', status: 'active' },
    { id: '2', name: 'Carlos Mendes', avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop', goal: 'Emagrecimento', level: 'Iniciante', adherence: 40, lastTraining: 'Aeróbico • Pendente', status: 'at-risk' },
    { id: '3', name: 'Júlia Costa', avatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop', goal: 'Força', level: 'Avançado', adherence: 10, lastTraining: 'Descanso', status: 'active' },
  ]);

  const todayDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-md mx-auto min-h-screen text-white p-6 space-y-6 pb-32"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="flex justify-between items-start pt-8">
        <div>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{todayDate}</p>
          <h1 className="text-3xl font-black text-white mt-1 tracking-tight">Olá, Rodrigo! 👋</h1>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('settings')}
          className="size-12 rounded-full bg-cover bg-center border-2 border-white/20 shadow-glow active:scale-95 transition-all duration-300 relative group"
          style={{ backgroundImage: 'url(/coach-rodrigo.png)' }}
        >
          <div className="absolute top-0 right-0 size-3 bg-red-500 rounded-full border-2 border-slate-950 animate-pulse"></div>
        </button>
      </motion.header>

      {/* Chart Card */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[32px] bg-slate-900 border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900/50 to-slate-900 z-0"></div>
        <div className="relative z-10 p-6 pb-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Desempenho Semanal</p>
              <h2 className="text-4xl font-black tracking-tighter text-white">38 <span className="text-base text-blue-400 font-bold">treinos</span></h2>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 flex items-center gap-1">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">+12%</span>
            </div>
          </div>
        </div>
        <div className="h-32 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip cursor={false} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: 'none', color: '#fff' }} />
              <Area type="monotone" dataKey="uv" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Tools Grid - Redesigned as Compact Pills */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <button onClick={onOpenAI} className="glass-card p-4 rounded-[24px] flex items-center gap-3 active:scale-[0.98] transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-sm leading-tight">Apex AI</p>
            <p className="text-[10px] text-slate-400">Criar Treino</p>
          </div>
        </button>

        <button onClick={onOpenBrandHub} className="glass-card p-4 rounded-[24px] flex items-center gap-3 active:scale-[0.98] transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span className="material-symbols-outlined text-white text-xl">palette</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-sm leading-tight">Brand Hub</p>
            <p className="text-[10px] text-slate-400">Marketing</p>
          </div>
        </button>
      </motion.div>

      {/* Next Client Spotlight */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-lg font-bold text-white">Próximo Aluno</h3>
          <button className="text-xs font-bold text-blue-400 uppercase tracking-wider hover:text-blue-300 transition-colors">Ver Agenda</button>
        </div>

        <div className="glass-card p-1 rounded-[32px] bg-gradient-to-br from-white/10 to-white/5 active:scale-[0.99] transition-all">
          <div className="bg-slate-950/50 rounded-[28px] p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/30 transition-all"></div>

            <div className="flex items-center gap-4 relative z-10">
              <div
                className="size-16 rounded-2xl bg-cover bg-center border-2 border-white/10 shadow-xl"
                style={{ backgroundImage: `url(${clients[0].avatar})` }}
                onClick={() => onSelectClient(clients[0])}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-black text-lg">{clients[0].name}</h4>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Confirmed</span>
                </div>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  14:30 • {clients[0].goal}
                </p>
              </div>
              <button
                onClick={() => onSelectClient(clients[0])}
                className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-glow group-hover:scale-110 transition-transform"
              >
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-lg font-bold text-white">Atividade Recente</h3>
        <div className="space-y-3">
          {clients.slice(1).map((client) => (
            <div
              key={client.id}
              className="glass-card rounded-[24px] p-4 flex items-center gap-4 active:scale-[0.98] transition-all"
              onClick={() => onSelectClient(client)}
            >
              <div
                className="size-12 rounded-xl bg-cover bg-center border border-white/5 grayscale opacity-70"
                style={{ backgroundImage: `url(${client.avatar})` }}
              />
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-300">{client.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{client.lastTraining}</p>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardView;
