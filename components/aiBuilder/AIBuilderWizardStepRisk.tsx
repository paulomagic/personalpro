import React, { Suspense, lazy } from 'react';
import { Client } from '../../types';
import type { AdaptiveTrainingSignal } from '../../services/ai/adaptiveSignalsService';
import type { InjuryRiskAssessment } from '../../services/ai/injuryRiskService';

const DetectionFeedback = lazy(() => import('../DetectionFeedback'));

interface AIBuilderWizardStepRiskProps {
  selectedClient: Client | null;
  observations: string;
  setObservations: (value: string) => void;
  quickTags: string[];
  loadingAdaptiveSignal: boolean;
  adaptiveSignal: AdaptiveTrainingSignal | null;
  injuryRisk: InjuryRiskAssessment | null;
  precisionProfile: any;
  canAdvanceFromRiskStep: boolean;
  handleContinueFromRisk: () => void;
  onBack: () => void;
}

const AIBuilderWizardStepRisk: React.FC<AIBuilderWizardStepRiskProps> = ({
  selectedClient,
  observations,
  setObservations,
  quickTags,
  loadingAdaptiveSignal,
  adaptiveSignal,
  injuryRisk,
  precisionProfile,
  canAdvanceFromRiskStep,
  handleContinueFromRisk,
  onBack
}) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="material-symbols-outlined text-blue-400 text-xl">notes</span>
        <h3 className="font-black text-white tracking-tight">Observações</h3>
      </div>

      <div className="glass-card rounded-[28px] p-4 mb-4 border border-white/5 focus-within:border-blue-500/50 transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-all group-focus-within:bg-blue-500/10" />
        <textarea
          placeholder="Ex: Aluno com lesão no ombro, focar em bíceps..."
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          className="w-full bg-transparent text-white placeholder:text-slate-500 text-sm outline-none min-h-[120px] resize-none font-medium relative z-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {quickTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setObservations(observations ? `${observations}, ${tag}` : tag)}
            className="px-4 py-2 rounded-full glass-card border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all"
          >
            {tag}
          </button>
        ))}
      </div>

      {selectedClient && (observations || selectedClient.injuries || selectedClient.observations) && (
        <div className="mt-4">
          <Suspense fallback={<div className="h-24 glass-card rounded-2xl animate-pulse bg-white/5" />}>
            <DetectionFeedback
              observations={`${observations} ${selectedClient.observations || ''}`}
              injuries={selectedClient.injuries}
              age={selectedClient.age}
              weight={selectedClient.weight}
              height={selectedClient.height}
              compact={false}
            />
          </Suspense>
        </div>
      )}

      {selectedClient && (
        <div className="mt-4 glass-card rounded-[24px] p-4 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">IA Adaptativa</p>
            <p className="text-[10px] text-slate-400">
              {loadingAdaptiveSignal ? 'analisando...' : adaptiveSignal ? `${adaptiveSignal.sourceSessions} sessões` : 'sem dados'}
            </p>
          </div>
          {adaptiveSignal ? (
            <div className="space-y-2">
              <p className="text-sm text-white font-bold">
                Readiness: <span className="text-blue-300">{adaptiveSignal.readinessScore}/100</span> · Fadiga: <span className="uppercase">{adaptiveSignal.fatigueLevel}</span>
              </p>
              <p className="text-xs text-slate-300">
                Ajuste sugerido: {adaptiveSignal.recommendedVolumeDeltaPct >= 0 ? '+' : ''}{adaptiveSignal.recommendedVolumeDeltaPct}% volume, {adaptiveSignal.recommendedIntensityDeltaPct >= 0 ? '+' : ''}{adaptiveSignal.recommendedIntensityDeltaPct}% intensidade, {adaptiveSignal.recommendedDaysPerWeek} dias/semana.
              </p>
              <p className="text-[11px] text-slate-400">{adaptiveSignal.rationale}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Sem histórico suficiente. A IA usa baseline conservador.</p>
          )}
        </div>
      )}

      {selectedClient && injuryRisk && (
        <div className={`mt-4 glass-card rounded-[24px] p-4 border ${injuryRisk.level === 'critical'
          ? 'border-red-500/40 bg-red-500/10'
          : injuryRisk.level === 'high'
            ? 'border-amber-500/40 bg-amber-500/10'
            : 'border-emerald-500/30 bg-emerald-500/10'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest">Risco de Lesão</p>
            <p className="text-xs font-black">{injuryRisk.score}/100 · {injuryRisk.level.toUpperCase()}</p>
          </div>
          {injuryRisk.factors.length > 0 && (
            <p className="text-xs text-slate-200 mb-2">{injuryRisk.factors[0]}</p>
          )}
          <p className="text-[11px] text-slate-300">
            {injuryRisk.blockGeneration
              ? 'Geração bloqueada preventivamente. Revise lesões/dor e reduza risco antes de prosseguir.'
              : injuryRisk.conservativeMode
                ? 'Planner em modo conservador: IA reduzirá estímulo e progressão.'
                : 'Risco controlado: progressão padrão com monitoramento.'}
          </p>
        </div>
      )}

      {selectedClient && precisionProfile && (
        <div className="mt-4 glass-card rounded-[24px] p-4 border border-indigo-500/30 bg-indigo-500/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Precisão da IA</p>
            <p className="text-[10px] text-indigo-100">{precisionProfile.segment}</p>
          </div>
          <p className="text-sm text-white font-bold mb-1">{precisionProfile.label}</p>
          <p className="text-xs text-slate-300 mb-2">{precisionProfile.rationale}</p>
          <p className="text-[11px] text-indigo-100">
            Meta: {precisionProfile.target.targetPrecisionScore}/100 · erro RPE ≤ {precisionProfile.target.maxMeanRpeError} · erro RIR ≤ {precisionProfile.target.maxMeanRirError}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={onBack}
          className="h-12 rounded-2xl border border-white/10 text-slate-300 font-bold"
        >
          Voltar
        </button>
        <button
          onClick={handleContinueFromRisk}
          disabled={!canAdvanceFromRiskStep}
          className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest disabled:opacity-40"
        >
          Continuar
        </button>
      </div>
    </section>
  );
};

export default AIBuilderWizardStepRisk;
