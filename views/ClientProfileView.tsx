
import React, { useState } from 'react';
import { Client } from '../types';

interface ClientProfileViewProps {
  client: Client;
  onBack: () => void;
  onStartWorkout: (workout: any) => void;
}

const ClientProfileView: React.FC<ClientProfileViewProps> = ({ client, onBack, onStartWorkout }) => {
  const [activeTab, setActiveTab] = useState('Evolução');
  const tabs = ['Evolução', 'Treinos', 'Bio'];

  const badges = [
    { icon: 'military_tech', label: '100 Treinos', color: 'bg-amber-400' },
    { icon: 'emoji_events', label: 'Novo Recorde', color: 'bg-blue-500' },
  ];

  const mainLoads = [
    { name: 'Agachamento Livre', load: '85 kg', trend: 'up', icon: 'fitness_center' },
    { name: 'Supino Reto', load: '42 kg', trend: 'equal', icon: 'exercise' },
    { name: 'Levantamento Terra', load: '90 kg', trend: 'up', icon: 'sports_martial_arts' },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Hero Header */}
      <header className="relative h-72 w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=600&fit=crop"
            className="w-full h-full object-cover scale-110 blur-[2px] opacity-60"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>
        {/* Top Actions */}
        <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-10">
          <button
            onClick={onBack}
            className="size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button className="size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        {/* Profile Info */}
        <div className="absolute bottom-6 left-0 right-0 px-6 z-10">
          <h1 className="text-white text-[28px] font-bold leading-tight">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-white/90 text-base font-medium">32 anos • {client.goal}</p>
            <span className="text-white/40">•</span>
            <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-emerald-400 text-sm">trending_up</span>
              <span className="text-emerald-400 text-xs font-semibold">Ativo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-6 border-b border-slate-100">
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === tab ? 'text-slate-900' : 'text-slate-400'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="px-6 space-y-6 pb-28">
        {/* Main Stats Card */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-1">
          <div className="glass-card rounded-3xl p-5 border-l-4 border-blue-500">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Aderência</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white">{client.adherence}%</span>
              <span className="text-emerald-400 text-[10px] font-bold mb-1">+5%</span>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-5 border-l-4 border-purple-500">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Próxima Meta</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white">82kg</span>
              <span className="material-symbols-outlined text-purple-400 text-sm mb-1">target</span>
            </div>
          </div>
        </div>

        {/* Evolution Chart Section */}
        <div className="glass-card rounded-[32px] p-6 animate-slide-up stagger-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-white tracking-tight">Evolução de Peso</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase">Peso</button>
              <button className="px-3 py-1 bg-white/5 text-slate-500 text-[10px] font-black rounded-full uppercase">Gordura</button>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {[65, 59, 80, 81, 56, 55, 40].map((height, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="w-full bg-gradient-to-t from-blue-600/20 to-blue-500/80 rounded-t-lg transition-all duration-500 group-hover:to-blue-400"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {85 + i}kg
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2">
            {['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'].map(mes => (
              <span key={mes} className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{mes}</span>
            ))}
          </div>
        </div>

        {/* Photo Gallery - Nova Funcionalidade */}
        <div className="space-y-4 animate-slide-up stagger-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-black text-white tracking-tight">Galeria de Evolução</h3>
            <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ver Todas</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {[
              { label: 'JAN 2024', img: 'https://images.unsplash.com/photo-1571019623129-fbf8a4f44097?w=300&h=400&fit=crop' },
              { label: 'FEV 2024', img: 'https://images.unsplash.com/photo-1583454110551-21f2fa202214?w=300&h=400&fit=crop' },
              { label: 'MAR 2024', img: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?w=300&h=400&fit=crop' },
            ].map((foto, i) => (
              <div key={i} className="min-w-[140px] aspect-[3/4] rounded-3xl overflow-hidden relative glass-card p-1">
                <img src={foto.img} className="w-full h-full object-cover rounded-2xl opacity-80" alt={foto.label} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-4">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{foto.label}</span>
                </div>
              </div>
            ))}
            <button className="min-w-[140px] aspect-[3/4] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group hover:border-blue-500/50 transition-all">
              <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-blue-400">add_a_photo</span>
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Adicionar Foto</span>
            </button>
          </div>
        </div>

        {/* Badges Section */}
        <div className="glass-card rounded-[32px] p-6 animate-slide-up stagger-4">
          <h3 className="font-black text-white tracking-tight mb-4">Conquistas</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="size-16 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="material-symbols-outlined text-white text-3xl">workspace_premium</span>
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase">10 Noites</span>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="size-16 rounded-full bg-gradient-to-br from-blue-300 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="material-symbols-outlined text-white text-3xl">bolt</span>
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase">Frequência</span>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0 opacity-40 grayscale">
              <div className="size-16 rounded-full bg-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600 text-3xl">lock</span>
              </div>
              <span className="text-[9px] font-black text-slate-600 uppercase">Nível Pro</span>
            </div>
          </div>
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => onStartWorkout({ title: 'Peito e Tríceps', objective: 'Hipertrofia', duration: '45min', exercises: [] })}
        className="fixed bottom-8 right-8 size-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[28px]">edit</span>
      </button>
    </div>
  );
};

export default ClientProfileView;
