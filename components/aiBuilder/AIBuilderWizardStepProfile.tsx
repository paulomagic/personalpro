import React from 'react';
import { Client } from '../../types';

interface AIBuilderWizardStepProfileProps {
  fetchingClients: boolean;
  clients: Client[];
  selectedClient: Client | null;
  selectedGoal: string;
  selectedDays: number;
  setSelectedClient: (client: Client) => void;
  setSelectedGoal: (goal: string) => void;
  setSelectedDays: (days: number) => void;
  handleContinueFromProfile: () => void;
  canAdvanceFromProfileStep: boolean;
}

const goals = ['Hipertrofia', 'Emagrecimento', 'Resistência', 'Saúde'];
const dayOptions = [2, 3, 4, 5, 6];

const AIBuilderWizardStepProfile: React.FC<AIBuilderWizardStepProfileProps> = ({
  fetchingClients,
  clients,
  selectedClient,
  selectedGoal,
  selectedDays,
  setSelectedClient,
  setSelectedGoal,
  setSelectedDays,
  handleContinueFromProfile,
  canAdvanceFromProfileStep
}) => {
  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="material-symbols-outlined text-blue-400 text-xl">person_search</span>
          <h3 className="font-black text-white tracking-tight">Selecione o Aluno</h3>
        </div>
        {fetchingClients ? (
          <div className="h-24 glass-card rounded-[24px] animate-pulse bg-white/5" />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`min-w-[100px] flex flex-col items-center gap-3 p-4 rounded-[24px] transition-all duration-300 relative overflow-hidden group ${selectedClient?.id === client.id
                  ? 'glass-card border border-blue-500/50 bg-blue-500/10 shadow-glow scale-105'
                  : 'glass-card border border-white/5 opacity-60 hover:opacity-100 hover:border-blue-500/30'
                  }`}
              >
                {selectedClient?.id === client.id && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                )}
                {client.avatar ? (
                  <img
                    className={`size-[60px] rounded-[20px] object-cover border-2 relative z-10 ${selectedClient?.id === client.id ? 'border-blue-400 shadow-lg shadow-blue-500/30' : 'border-white/10 group-hover:border-blue-400/50'
                      } transition-colors`}
                    src={client.avatar}
                    alt={client.name}
                  />
                ) : (
                  <div
                    className={`size-[60px] rounded-[20px] bg-cover bg-center border-2 relative z-10 ${selectedClient?.id === client.id ? 'border-blue-400 shadow-lg shadow-blue-500/30' : 'border-white/10 group-hover:border-blue-400/50'
                      } transition-colors`}
                  >
                    <span className="material-symbols-outlined text-slate-500 flex h-full items-center justify-center">person</span>
                  </div>
                )}
                <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 ${selectedClient?.id === client.id ? 'text-blue-400' : 'text-slate-500'}`}>{client.name.split(' ')[0]}</span>
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
          {goals.map((goal) => (
            <button
              key={goal}
              onClick={() => setSelectedGoal(goal)}
              className={`px-4 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group ${selectedGoal === goal
                ? 'bg-blue-600 border border-blue-400 text-white shadow-glow translate-y-[-2px]'
                : 'glass-card border border-white/5 text-slate-400 hover:border-blue-500/30 hover:text-white'
                }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="material-symbols-outlined text-cyan-400 text-xl">calendar_month</span>
          <h3 className="font-black text-white tracking-tight">Dias por Semana</h3>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {dayOptions.map((dayCount) => (
            <button
              key={dayCount}
              onClick={() => setSelectedDays(dayCount)}
              className={`rounded-2xl py-3 text-sm font-black transition-all border ${selectedDays === dayCount
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                }`}
            >
              {dayCount}d
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinueFromProfile}
        disabled={!canAdvanceFromProfileStep}
        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest transition-all disabled:opacity-40"
      >
        Continuar para Riscos
      </button>
    </section>
  );
};

export default AIBuilderWizardStepProfile;
