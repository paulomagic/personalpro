
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
    <div className="max-w-md mx-auto min-h-screen bg-white pb-24">
      {/* Hero Header */}
      <header className="relative h-[220px] w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900">
          <img
            src={client.avatar || `https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&h=600&fit=crop`}
            alt={client.name}
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

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

      <main className="p-6 space-y-6">
        {/* Weight Evolution Card */}
        <section className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Peso Corporal</p>
              <h2 className="text-[40px] font-bold text-slate-900 leading-none">
                62.5 <span className="text-xl text-slate-400 font-medium">kg</span>
              </h2>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full">
              <span className="material-symbols-outlined text-emerald-500 text-sm">arrow_downward</span>
              <span className="text-emerald-600 text-xs font-bold">-1.2%</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-32 w-full relative mt-4">
            <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <path
                d="M0,60 C40,55 60,40 100,45 C140,50 180,35 220,30 C260,25 280,20 300,15 L300,80 L0,80 Z"
                fill="url(#chartGradient)"
              />

              {/* Line */}
              <path
                d="M0,60 C40,55 60,40 100,45 C140,50 180,35 220,30 C260,25 280,20 300,15"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Current point */}
              <circle cx="300" cy="15" r="6" fill="#3B82F6" />
              <circle cx="300" cy="15" r="3" fill="white" />
            </svg>

            {/* Value tooltip */}
            <div className="absolute top-0 right-0 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-lg">
              62.5 kg
            </div>
          </div>

          {/* Timeline */}
          <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
            <span>Jan</span>
            <span>Fev</span>
            <span>Mar</span>
            <span>Abr</span>
            <span>Mai</span>
            <span className="text-blue-600 font-bold">Jun</span>
          </div>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Adherence */}
          <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Aderência</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">4</span>
              <span className="text-lg text-slate-300 font-semibold">/5</span>
            </div>
            <div className="flex gap-1 mt-3">
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className={`size-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${i < 4 ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-300'
                    }`}>
                    {day}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Goal */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[20px] p-5 text-white">
            <div className="flex justify-between items-start mb-2">
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Próxima Meta</p>
              <span className="material-symbols-outlined text-blue-200 text-lg">emoji_events</span>
            </div>
            <h3 className="text-3xl font-bold">60 <span className="text-lg font-medium text-blue-200">kg</span></h3>
            <div className="mt-3">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-white rounded-full"></div>
              </div>
              <p className="text-blue-100 text-xs mt-2">75% concluído</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
          {badges.map((badge, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg ${badge.color}`}
            >
              <span className="material-symbols-outlined text-lg">{badge.icon}</span>
              {badge.label}
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 text-slate-500 text-sm font-semibold">
            <span className="material-symbols-outlined text-lg">add</span>
          </div>
        </div>

        {/* Main Loads */}
        <section className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-slate-900">Cargas Principais</h3>
            <button className="text-sm font-semibold text-blue-600">Ver tudo</button>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2">
              <span>Exercício</span>
              <span className="text-right">Carga</span>
              <span></span>
            </div>

            {mainLoads.map((load, i) => (
              <div key={i} className="flex items-center py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3 flex-1">
                  <span className="material-symbols-outlined text-slate-400">{load.icon}</span>
                  <span className="font-medium text-slate-600">{load.name}</span>
                </div>
                <span className="font-bold text-slate-900">{load.load}</span>
                <span className={`ml-3 material-symbols-outlined ${load.trend === 'up' ? 'text-emerald-500' : 'text-slate-300'
                  }`}>
                  {load.trend === 'up' ? 'trending_up' : 'remove'}
                </span>
              </div>
            ))}
          </div>
        </section>
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
