
import React, { useState } from 'react';
import { Client } from '../types';

interface DashboardViewProps {
  onSelectClient: (client: Client) => void;
  onOpenAI: () => void;
  onOpenBrandHub?: () => void;
  onNavigate?: (view: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onSelectClient, onOpenAI, onOpenBrandHub, onNavigate }) => {
  const [activeNav, setActiveNav] = useState('home');

  const [clients] = useState<Client[]>([
    { id: '1', name: 'Ana Silva', avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop', goal: 'Hipertrofia', level: 'Intermediário', adherence: 75, lastTraining: 'Treino de Pernas • Em andamento', status: 'active' },
    { id: '2', name: 'Carlos Mendes', avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop', goal: 'Emagrecimento', level: 'Iniciante', adherence: 40, lastTraining: 'Aeróbico • Pendente', status: 'at-risk' },
    { id: '3', name: 'Júlia Costa', avatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop', goal: 'Força', level: 'Avançado', adherence: 10, lastTraining: 'Descanso', status: 'active' },
  ]);

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    if (onNavigate) {
      onNavigate(nav);
    }
  };

  const todayDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="max-w-md mx-auto min-h-screen pb-28 bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{todayDate}</p>
            <h1 className="text-3xl font-black text-white mt-1 tracking-tight">Olá, Rodrigo! 👋</h1>
          </div>
          <button
            onClick={() => handleNavClick('settings')}
            className="size-12 rounded-full bg-cover bg-center border-2 border-white/20 shadow-glow active:scale-95 transition-all duration-300"
            style={{ backgroundImage: 'url(/coach-rodrigo.png)' }}
          />
        </div>
      </header>

      <main className="px-6 space-y-5">
        {/* Quick Actions Row */}
        <div className="grid grid-cols-4 gap-3 animate-slide-up stagger-1">
          <button
            onClick={() => handleNavClick('calendar')}
            className="flex flex-col items-center gap-2 p-3 glass-card rounded-2xl active:scale-95 transition-all duration-300"
          >
            <div className="size-11 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <span className="material-symbols-outlined text-blue-400">calendar_month</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agenda</span>
          </button>

          <button
            onClick={() => handleNavClick('clients')}
            className="flex flex-col items-center gap-2 p-3 glass-card rounded-2xl active:scale-95 transition-all duration-300"
          >
            <div className="size-11 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <span className="material-symbols-outlined text-purple-400">groups</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alunos</span>
          </button>

          <button
            onClick={() => handleNavClick('finance')}
            className="flex flex-col items-center gap-2 p-3 glass-card rounded-2xl active:scale-95 transition-all duration-300"
          >
            <div className="size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <span className="material-symbols-outlined text-emerald-400">payments</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Financeiro</span>
          </button>

          <button
            onClick={() => handleNavClick('metrics')}
            className="flex flex-col items-center gap-2 p-3 glass-card rounded-2xl active:scale-95 transition-all duration-300"
          >
            <div className="size-11 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <span className="material-symbols-outlined text-amber-400">analytics</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Métricas</span>
          </button>
        </div>

        {/* Today Card */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[32px] p-6 text-white shadow-2xl shadow-blue-900/40 animate-slide-up stagger-2 overflow-hidden relative">
          <div className="absolute top-0 right-0 size-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Status de Hoje</p>
              <h2 className="text-[48px] font-black leading-none tracking-tighter">5</h2>
              <p className="text-blue-100/60 text-sm mt-1 font-medium">atendimentos</p>
            </div>

            {/* Next Appointment */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-inner">
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Próximo</p>
              <p className="text-2xl font-black">07:00</p>
              <div className="h-px bg-white/10 my-1"></div>
              <p className="text-[10px] text-blue-50 font-bold">Ana Silva</p>
            </div>
          </div>

          <button
            onClick={() => handleNavClick('calendar')}
            className="w-full py-3.5 bg-white text-blue-700 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all hover:bg-blue-50 shadow-lg active:scale-95"
          >
            Ver Agenda Completa
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>

        {/* Revenue Card */}
        <button
          onClick={() => handleNavClick('finance')}
          className="w-full glass-card rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all duration-300 text-left animate-slide-up stagger-3"
        >
          <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="material-symbols-outlined text-white text-[28px]">payments</span>
          </div>
          <div className="flex-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Faturamento mensal</p>
            <p className="text-2xl font-black text-white">R$ 12.450</p>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <span className="material-symbols-outlined text-emerald-400 text-sm">trending_up</span>
            <span className="text-emerald-400 text-xs font-black">+18%</span>
          </div>
        </button>

        {/* AI Alert */}
        <div className="glass-card rounded-[28px] p-6 flex gap-4 items-start animate-slide-up stagger-4 border-l-4 border-blue-500">
          <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
            <span className="material-symbols-outlined text-[24px] text-blue-400">auto_awesome</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-black text-white text-sm">Alerta Inteligente</h4>
              <span className="text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded leading-none">IA</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              <span className="text-amber-400 font-bold">Carlos Mendes</span> não treina há 5 dias. Considere entrar em contato.
            </p>
          </div>
          <button className="size-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-white text-lg">chevron_right</span>
          </button>
        </div>

        {/* Create with AI */}
        <button
          onClick={onOpenAI}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-[24px] p-5 flex items-center justify-between shadow-xl shadow-blue-900/40 active:scale-[0.98] transition-all duration-300 animate-slide-up stagger-5"
        >
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-white text-[28px]">psychology</span>
            </div>
            <div className="text-left">
              <h4 className="font-black text-white text-lg leading-tight">Criar Treino com IA</h4>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Personalize em segundos</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-white">arrow_forward</span>
        </button>

        {/* Recent Students */}
        <div className="space-y-4 pt-4 animate-slide-up stagger-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-white tracking-tight">Alunos Recentes</h3>
            <button
              onClick={() => handleNavClick('clients')}
              className="text-xs font-black text-blue-400 uppercase tracking-widest active:opacity-70"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="w-full glass-card rounded-[24px] p-4 flex items-center gap-4 cursor-pointer active:scale-[0.99] transition-all duration-300 text-left"
              >
                <div className="relative">
                  <div
                    className="size-14 rounded-full bg-cover bg-center border-2 border-white/10 shadow-xl"
                    style={{ backgroundImage: `url(${client.avatar})` }}
                  />
                  <span className={`absolute bottom-0.5 right-0.5 size-4 rounded-full border-2 border-slate-900 ${client.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                    } shadow-lg`}></span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white text-base leading-tight">{client.name}</h4>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{client.lastTraining}</p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${client.adherence >= 70 ? 'bg-emerald-500' :
                        client.adherence >= 40 ? 'bg-amber-500' : 'bg-red-400'
                        }`}
                      style={{ width: `${client.adherence}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{client.adherence}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-2xl border-t border-white/5 px-4 h-22 flex items-center justify-around max-w-md mx-auto z-40">
        <button
          onClick={() => handleNavClick('home')}
          className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 ${activeNav === 'home' ? 'text-blue-400' : 'text-slate-500'} active:scale-90`}
        >
          <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: activeNav === 'home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
        </button>

        <button
          onClick={() => handleNavClick('calendar')}
          className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 ${activeNav === 'calendar' ? 'text-blue-400' : 'text-slate-500'} active:scale-90`}
        >
          <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: activeNav === 'calendar' ? "'FILL' 1" : "'FILL' 0" }}>calendar_month</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Agenda</span>
        </button>

        {/* Center FAB */}
        <div className="relative -mt-10">
          <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <button
            onClick={onOpenAI}
            className="size-16 rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-600/40 flex items-center justify-center hover:bg-blue-500 active:scale-90 transition-all duration-300 relative z-10"
          >
            <span className="material-symbols-outlined text-[32px]">add</span>
          </button>
        </div>

        <button
          onClick={() => handleNavClick('clients')}
          className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 ${activeNav === 'clients' ? 'text-blue-400' : 'text-slate-500'} active:scale-90`}
        >
          <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: activeNav === 'clients' ? "'FILL' 1" : "'FILL' 0" }}>groups</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Alunos</span>
        </button>

        <button
          onClick={() => handleNavClick('settings')}
          className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 ${activeNav === 'settings' ? 'text-blue-400' : 'text-slate-500'} active:scale-90`}
        >
          <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: activeNav === 'settings' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardView;
