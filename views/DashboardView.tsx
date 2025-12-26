import React, { useState } from 'react';
import { Client } from '../types';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Wallet,
  BarChart2,
  ChevronRight,
  Bell,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface DashboardViewProps {
  onSelectClient: (client: Client) => void;
  onOpenAI: () => void;
  onOpenBrandHub?: () => void;
  onNavigate?: (view: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onSelectClient, onOpenAI, onNavigate }) => {
  const [clients] = useState<Client[]>([
    { id: '1', name: 'Ana Silva', avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop', goal: 'Sexta-feira • Leg Day', level: 'Intermediário', adherence: 75, lastTraining: 'Em andamento', status: 'active' },
    { id: '2', name: 'Carlos Mendes', avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop', goal: 'Cardio', level: 'Iniciante', adherence: 40, lastTraining: 'Pendente', status: 'at-risk' },
    { id: '3', name: 'Júlia Costa', avatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop', goal: 'Descanso', level: 'Avançado', adherence: 10, lastTraining: 'Descanso', status: 'active' },
  ]);

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
      className="p-6 space-y-6 pb-32 max-w-md mx-auto"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="flex justify-between items-start pt-4">
        <div>
          <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Sexta-Feira, 26 De Dezembro</p>
          <h1 className="text-2xl font-black text-white mt-1">Olá, Rodrigo! 👋</h1>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('settings')}
          className="size-10 rounded-full bg-cover bg-center ring-2 ring-white/10 shadow-glow"
          style={{ backgroundImage: 'url(/coach-rodrigo.png)' }}
        />
      </motion.header>

      {/* Quick Actions Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: 'Agenda', color: 'text-blue-400', bg: 'bg-blue-500/10', action: 'calendar' },
          { icon: Users, label: 'Alunos', color: 'text-purple-400', bg: 'bg-purple-500/10', action: 'clients' },
          { icon: Wallet, label: 'Financeiro', color: 'text-emerald-400', bg: 'bg-emerald-500/10', action: 'finance' },
          { icon: BarChart2, label: 'Métricas', color: 'text-amber-400', bg: 'bg-amber-500/10', action: 'metrics' },
        ].map((item, index) => (
          <button
            key={index}
            onClick={() => onNavigate && onNavigate(item.action)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-900/50 border border-white/5 active:scale-95 transition-transform backdrop-blur-sm"
          >
            <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
              <item.icon size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Main Appointment Card */}
      <motion.div variants={itemVariants} className="card-blue p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90 z-0"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-200/80 text-xs font-bold uppercase tracking-widest mb-1">Hoje você tem</p>
              <h2 className="text-4xl font-black text-white">5 <span className="text-lg font-medium text-blue-200">agendamentos</span></h2>
            </div>
            <div className="bg-slate-950/20 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[80px]">
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mb-1">Próximo</p>
              <p className="text-xl font-bold text-white">07:00</p>
              <p className="text-xs text-blue-200">Ana Silva</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('calendar')}
            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Ver agenda completa
            <ArrowRight size={16} />
          </button>
        </div>
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -mr-16 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 -mb-32"></div>
      </motion.div>

      {/* Finance Summary */}
      <motion.div variants={itemVariants} className="card-dark p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Receita de Dezembro</p>
            <h3 className="text-xl font-black text-white">R$ 12.450</h3>
          </div>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <TrendingUp size={12} />
          +18%
        </div>
      </motion.div>

      {/* Smart Alert */}
      <motion.div variants={itemVariants} className="card-dark p-4 flex items-center gap-4 bg-slate-900/80 border-amber-500/20">
        <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <Sparkles className="text-amber-400" size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white text-sm">Alerta Inteligente</h4>
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg shadow-amber-900/40">IA</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-amber-400 font-bold">Carlos Mendes</span> não treina há 5 dias.
            Considere entrar em contato.
          </p>
        </div>
        <button className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </motion.div>

      {/* Create Workout AI Action */}
      <motion.div variants={itemVariants}>
        <button
          onClick={onOpenAI}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl shadow-glow flex items-center gap-4 group transition-all active:scale-[0.98] border border-blue-400/20"
        >
          <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
            <BrainCircuit size={24} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-bold text-lg">Criar Treino com IA</h3>
            <p className="text-blue-100 text-xs">Personalize em segundos</p>
          </div>
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Recent Students */}
      <motion.div variants={itemVariants} className="space-y-4 pt-2">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-lg font-bold text-white">Alunos Recentes</h3>
          <button
            onClick={() => onNavigate && onNavigate('clients')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wide"
          >
            Ver todos
          </button>
        </div>

        <div className="space-y-3">
          {clients.map((client) => (
            <div key={client.id} className="card-dark p-3 flex items-center gap-3 active:scale-[0.99] hover:bg-slate-800/50 transition-colors" onClick={() => onSelectClient(client)}>
              <div className="relative">
                <img src={client.avatar} alt={client.name} className="size-12 rounded-full object-cover border-2 border-slate-700" />
                {client.status === 'active' && <div className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>}
                {client.status === 'at-risk' && <div className="absolute bottom-0 right-0 size-3 bg-amber-500 rounded-full border-2 border-slate-900"></div>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-white text-sm truncate">{client.name}</h4>
                  <span className="text-xs font-bold text-slate-300">{client.adherence}%</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mb-1.5">{client.goal} • {client.lastTraining}</div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${client.adherence < 50 ? 'bg-amber-500' : client.adherence < 20 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${client.adherence}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardView;
