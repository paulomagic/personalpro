
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
    { id: '1', name: 'Ana Silva', avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop', goal: 'Hipertrofia', level: 'Intermediário', adherence: 75, lastTraining: 'Leg Day • Em andamento', status: 'active' },
    { id: '2', name: 'Carlos Mendes', avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop', goal: 'Perda de Peso', level: 'Iniciante', adherence: 40, lastTraining: 'Cardio • Pendente', status: 'at-risk' },
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
    <div className="max-w-md mx-auto min-h-screen pb-28 bg-slate-50">
      {/* Header */}
      <header className="px-6 pt-14 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-slate-400 font-medium capitalize">{todayDate}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Olá, Rodrigo! 👋</h1>
          </div>
          <button
            onClick={() => handleNavClick('settings')}
            className="size-12 rounded-full bg-cover bg-center border-2 border-white shadow-lg active:scale-95 transition-transform"
            style={{ backgroundImage: 'url(/coach-rodrigo.png)' }}
          />
        </div>
      </header>

      <main className="px-6 space-y-5">
        {/* Quick Actions Row */}
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => handleNavClick('calendar')}
            className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
          >
            <div className="size-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">calendar_month</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600">Agenda</span>
          </button>

          <button
            onClick={() => handleNavClick('clients')}
            className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
          >
            <div className="size-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600">groups</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600">Alunos</span>
          </button>

          <button
            onClick={() => handleNavClick('finance')}
            className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
          >
            <div className="size-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600">payments</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600">Financeiro</span>
          </button>

          <button
            onClick={() => handleNavClick('metrics')}
            className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
          >
            <div className="size-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600">analytics</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600">Métricas</span>
          </button>
        </div>

        {/* Today Card */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-[28px] p-5 text-white shadow-xl shadow-blue-600/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Hoje você tem</p>
              <h2 className="text-[42px] font-bold leading-none tracking-tight">5</h2>
              <p className="text-blue-200 text-sm mt-1">agendamentos</p>
            </div>

            {/* Next Appointment */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <p className="text-[10px] text-blue-200 font-medium uppercase">Próximo</p>
              <p className="text-xl font-bold">07:00</p>
              <p className="text-xs text-blue-100">Ana Silva</p>
            </div>
          </div>

          <button
            onClick={() => handleNavClick('calendar')}
            className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            Ver agenda completa
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>

        {/* Revenue Card */}
        <button
          onClick={() => handleNavClick('finance')}
          className="w-full bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.99] transition-transform text-left"
        >
          <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <span className="material-symbols-outlined text-white text-[28px]">payments</span>
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-xs font-medium">Receita de Dezembro</p>
            <p className="text-2xl font-bold text-slate-900">R$ 12.450</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full">
            <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>
            <span className="text-emerald-600 text-xs font-bold">+18%</span>
          </div>
        </button>

        {/* AI Alert */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[24px] p-5 flex gap-4 items-start">
          <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px] text-white">auto_awesome</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-white">Alerta Inteligente</h4>
              <span className="text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded">IA</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              <span className="text-amber-400 font-semibold">Carlos Mendes</span> não treina há 5 dias. Considere entrar em contato.
            </p>
          </div>
          <button className="size-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-white">chevron_right</span>
          </button>
        </div>

        {/* Create with AI */}
        <button
          onClick={onOpenAI}
          className="w-full bg-blue-600 hover:bg-blue-700 rounded-[20px] p-4 flex items-center justify-between shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">psychology</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white">Criar Treino com IA</h4>
              <p className="text-blue-200 text-xs">Personalize em segundos</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-white">arrow_forward</span>
        </button>

        {/* Recent Students */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Alunos Recentes</h3>
            <button
              onClick={() => handleNavClick('clients')}
              className="text-sm font-semibold text-blue-600 active:opacity-70"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="w-full bg-white rounded-[16px] p-3 border border-slate-100 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-all text-left"
              >
                <div className="relative">
                  <div
                    className="size-11 rounded-full bg-cover bg-center border-2 border-white shadow-md"
                    style={{ backgroundImage: `url(${client.avatar})` }}
                  />
                  <span className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white ${client.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                  <p className="text-xs text-slate-400">{client.lastTraining}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${client.adherence >= 70 ? 'bg-emerald-500' :
                        client.adherence >= 40 ? 'bg-amber-500' : 'bg-red-400'
                        }`}
                      style={{ width: `${client.adherence}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-8">{client.adherence}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 h-20 flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => handleNavClick('home')}
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl ${activeNav === 'home' ? 'text-blue-600' : 'text-slate-400'} active:scale-95 transition-all`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeNav === 'home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button
          onClick={() => handleNavClick('calendar')}
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl ${activeNav === 'calendar' ? 'text-blue-600' : 'text-slate-400'} active:scale-95 transition-all`}
        >
          <span className="material-symbols-outlined text-[24px]">calendar_month</span>
          <span className="text-[10px] font-medium">Agenda</span>
        </button>

        {/* Center FAB */}
        <button
          onClick={onOpenAI}
          className="size-14 -mt-6 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>

        <button
          onClick={() => handleNavClick('clients')}
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl ${activeNav === 'clients' ? 'text-blue-600' : 'text-slate-400'} active:scale-95 transition-all`}
        >
          <span className="material-symbols-outlined text-[24px]">groups</span>
          <span className="text-[10px] font-medium">Alunos</span>
        </button>

        <button
          onClick={() => handleNavClick('settings')}
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl ${activeNav === 'settings' ? 'text-blue-600' : 'text-slate-400'} active:scale-95 transition-all`}
        >
          <span className="material-symbols-outlined text-[24px]">person</span>
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardView;
