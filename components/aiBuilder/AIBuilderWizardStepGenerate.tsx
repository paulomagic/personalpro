import React from 'react';
import { Client } from '../../types';
import type { InjuryRiskAssessment } from '../../services/ai/injuryRiskService';

interface AIBuilderWizardStepGenerateProps {
  selectedClient: Client | null;
  selectedGoal: string;
  selectedDays: number;
  injuryRisk: InjuryRiskAssessment | null;
  loading: boolean;
  onBack: () => void;
  onGenerate: () => void;
}

const AIBuilderWizardStepGenerate: React.FC<AIBuilderWizardStepGenerateProps> = ({
  selectedClient,
  selectedGoal,
  selectedDays,
  injuryRisk,
  loading,
  onBack,
  onGenerate
}) => {
  const blocked = !selectedClient || !selectedGoal || loading || Boolean(injuryRisk?.blockGeneration);

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-[26px] p-5 border border-blue-500/20 bg-blue-500/5">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-3">Resumo de Geração</p>
        <div className="space-y-2 text-sm">
          <p><span className="text-slate-400">Aluno:</span> <span className="text-white font-bold">{selectedClient?.name || 'não definido'}</span></p>
          <p><span className="text-slate-400">Objetivo:</span> <span className="text-white font-bold">{selectedGoal}</span></p>
          <p><span className="text-slate-400">Frequência:</span> <span className="text-white font-bold">{selectedDays} dias/semana</span></p>
          <p><span className="text-slate-400">Risco:</span> <span className="text-white font-bold">{injuryRisk ? `${injuryRisk.score}/100 (${injuryRisk.level})` : 'sem dados'}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBack}
          className="h-12 rounded-2xl border border-white/10 text-slate-300 font-bold"
        >
          Voltar
        </button>
        <button
          onClick={onGenerate}
          disabled={blocked}
          className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest disabled:opacity-40"
        >
          Gerar Treino
        </button>
      </div>

      <button
        onClick={onGenerate}
        disabled={blocked}
        className="w-full h-[68px] glass-card rounded-[24px] relative overflow-hidden group disabled:opacity-30 disabled:grayscale transition-all active:scale-[0.98] border border-blue-500/30 hover:border-blue-400 shadow-xl shadow-blue-900/20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 transition-all group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center gap-3 z-10">
          <span className="material-symbols-outlined text-white">bolt</span>
          <span className="text-white font-black uppercase tracking-[0.2em] text-[13px] text-shadow-sm">Forjar Protocolo de Elite</span>
        </div>
      </button>
    </section>
  );
};

export default AIBuilderWizardStepGenerate;
