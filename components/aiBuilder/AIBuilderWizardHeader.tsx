import React from 'react';

interface AIBuilderWizardHeaderProps {
  wizardStep: 1 | 2 | 3;
  canAdvanceFromProfileStep: boolean;
  canAdvanceFromRiskStep: boolean;
  goToWizardStep: (step: 1 | 2 | 3) => void;
}

const steps = [
  { step: 1 as const, label: 'Perfil', icon: 'person' },
  { step: 2 as const, label: 'Riscos', icon: 'health_and_safety' },
  { step: 3 as const, label: 'Gerar', icon: 'bolt' }
];

const AIBuilderWizardHeader: React.FC<AIBuilderWizardHeaderProps> = ({
  wizardStep,
  canAdvanceFromProfileStep,
  canAdvanceFromRiskStep,
  goToWizardStep
}) => {
  return (
    <section className="glass-card rounded-[26px] p-4 border border-white/10 bg-white/[0.02]">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Wizard IA</p>
      <div className="grid grid-cols-3 gap-2">
        {steps.map((item) => {
          const isActive = wizardStep === item.step;
          const isEnabled = item.step === 1
            || (item.step === 2 && canAdvanceFromProfileStep)
            || (item.step === 3 && canAdvanceFromRiskStep);

          return (
            <button
              key={item.step}
              onClick={() => goToWizardStep(item.step)}
              disabled={!isEnabled}
              className={`rounded-2xl p-3 text-left transition-all border ${isActive
                ? 'bg-blue-600/20 border-blue-500/60'
                : 'bg-white/[0.02] border-white/10'
                } disabled:opacity-40`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`material-symbols-outlined text-base ${isActive ? 'text-blue-300' : 'text-slate-500'}`}>{item.icon}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-300' : 'text-slate-500'}`}>Etapa {item.step}</span>
              </div>
              <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.label}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default AIBuilderWizardHeader;
