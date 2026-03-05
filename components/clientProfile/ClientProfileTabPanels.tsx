import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Dumbbell,
  Edit,
  FileText,
  Mail,
  Phone,
  PlusCircle,
  Save,
  Sparkles,
  TrendingUp,
  User,
  Zap
} from 'lucide-react';
import { Client, MissedClass } from '../../types';
import ClientFinanceSection from '../ClientFinanceSection';
import { ClientPhysicalDataForm } from '../ClientPhysicalDataForm';

interface ProgressAnalysis {
  summary: string;
  improvements: string[];
  concerns: string[];
  recommendations: string[];
}

interface ClientProfileTabPanelsProps {
  activeTab: 'Bio' | 'Treinos' | 'Avaliações' | 'Evolução';
  client: Client;
  chartMode: 'weight' | 'fat';
  setChartMode: (mode: 'weight' | 'fat') => void;
  progressAnalysis: ProgressAnalysis | null;
  loadingAnalysis: boolean;
  handleAnalyzeProgress: () => void;
  onStartAssessment: () => void;
  onOpenGalleryModal: () => void;
  onCreateWorkout?: () => void;
  onStartWorkout: (workout: any) => void;
  onStudentView?: () => void;
  onSportTraining?: () => void;
  onOpenMissedClassModal: () => void;
  getReasonLabel: (reason: MissedClass['reason']) => string;
  handleMarkAsReplaced: (missedClassId: string) => void;
  coachId?: string;
  onFinanceUpdate: (updates: Record<string, unknown>) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleSaveNotes: () => void;
  onOpenContactModal: () => void;
  editedObservations: string;
  setEditedObservations: (value: string) => void;
  editedInjuries: string;
  setEditedInjuries: (value: string) => void;
  editedPreferences: string;
  setEditedPreferences: (value: string) => void;
  onUpdatePhysicalData: (data: Record<string, unknown>) => Promise<void>;
}

const ClientProfileTabPanels: React.FC<ClientProfileTabPanelsProps> = ({
  activeTab,
  client,
  chartMode,
  setChartMode,
  progressAnalysis,
  loadingAnalysis,
  handleAnalyzeProgress,
  onStartAssessment,
  onOpenGalleryModal,
  onCreateWorkout,
  onStartWorkout,
  onStudentView,
  onSportTraining,
  onOpenMissedClassModal,
  getReasonLabel,
  handleMarkAsReplaced,
  coachId,
  onFinanceUpdate,
  isEditing,
  setIsEditing,
  handleSaveNotes,
  onOpenContactModal,
  editedObservations,
  setEditedObservations,
  editedInjuries,
  setEditedInjuries,
  editedPreferences,
  setEditedPreferences,
  onUpdatePhysicalData
}) => {
  return (
    <AnimatePresence mode="wait">
      {activeTab === 'Evolução' && (
        <motion.div
          key="evolution"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {!progressAnalysis && client.assessments && client.assessments.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.1)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} style={{ color: '#3B82F6' }} />
                <h3 className="font-black text-white tracking-tight">Análise de IA</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Clique para gerar uma análise personalizada do progresso de {client.name} com base nas avaliações.
              </p>
              <button
                onClick={handleAnalyzeProgress}
                disabled={loadingAnalysis}
                className="w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  border: '1px solid var(--btn-primary-border)',
                  boxShadow: 'var(--btn-primary-shadow)',
                  opacity: loadingAnalysis ? 0.5 : 1,
                }}
              >
                {loadingAnalysis ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Analisar Progresso com IA
                  </>
                )}
              </button>
            </div>
          )}

          {progressAnalysis && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.1)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} style={{ color: '#3B82F6' }} />
                <h3 className="font-black text-white tracking-tight">Análise de IA</h3>
                <span className="px-2 py-0.5 text-[9px] font-black text-white rounded-full uppercase" style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)' }}>Gemini</span>
              </div>
              <p className="text-sm text-slate-300 mb-4">{progressAnalysis.summary}</p>

              {progressAnalysis.improvements.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">✅ Melhorias</p>
                  <ul className="space-y-1">
                    {progressAnalysis.improvements.map((item, i) => (
                      <li key={i} className="text-xs text-slate-400 pl-3 border-l-2 border-emerald-500/30">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {progressAnalysis.concerns.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">⚠️ Atenção</p>
                  <ul className="space-y-1">
                    {progressAnalysis.concerns.map((item, i) => (
                      <li key={i} className="text-xs text-slate-400 pl-3 border-l-2 border-blue-500/30">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {progressAnalysis.recommendations.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">💡 Recomendações</p>
                  <ul className="space-y-1">
                    {progressAnalysis.recommendations.map((item, i) => (
                      <li key={i} className="text-xs text-slate-400 pl-3 border-l-2 border-blue-500/30">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {loadingAnalysis && (
            <div className="rounded-2xl p-5 animate-pulse" style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.1)' }}>
              <div className="flex items-center gap-2">
                <Sparkles size={18} style={{ color: '#3B82F6' }} className="animate-spin" />
                <p className="text-sm text-slate-400">Analisando progresso com IA...</p>
              </div>
            </div>
          )}

          <div className="glass-card rounded-[24px] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-white tracking-tight">
                Evolução de {chartMode === 'weight' ? 'Peso' : 'Gordura'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartMode('weight')}
                  className={`px-3 py-1 text-[10px] font-black rounded-full uppercase transition-all ${chartMode === 'weight'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-slate-500 hover:bg-white/10'
                    }`}
                >
                  Peso
                </button>
                <button
                  onClick={() => setChartMode('fat')}
                  className={`px-3 py-1 text-[10px] font-black rounded-full uppercase transition-all ${chartMode === 'fat'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-slate-500 hover:bg-white/10'
                    }`}
                >
                  Gordura
                </button>
              </div>
            </div>

            {client.assessments && client.assessments.length > 0 ? (
              <>
                <div className="h-40 flex items-end justify-between gap-2">
                  {(() => {
                    const sortedAssessments = [...client.assessments]
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(-7);
                    const values = sortedAssessments.map(a =>
                      chartMode === 'weight' ? (a.weight || 0) : (a.bodyFat || 0)
                    );
                    const minVal = Math.min(...values.filter(v => v > 0)) * 0.9;
                    const maxVal = Math.max(...values) * 1.1;
                    const range = maxVal - minVal || 1;

                    return sortedAssessments.map((assessment, i) => {
                      const value = chartMode === 'weight' ? (assessment.weight || 0) : (assessment.bodyFat || 0);
                      const heightPercent = value > 0 ? ((value - minVal) / range) * 100 : 0;

                      return (
                        <div key={i} className="flex-1 group relative flex flex-col items-center">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(heightPercent, 5)}%` }}
                            transition={{ delay: i * 0.1 }}
                            className={`w-full rounded-t-lg cursor-pointer ${chartMode === 'weight'
                              ? 'bg-gradient-to-t from-blue-600/20 to-blue-500/80 group-hover:to-blue-400'
                              : 'bg-gradient-to-t from-amber-600/20 to-amber-500/80 group-hover:to-amber-400'
                              }`}
                          />
                          <div className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {value > 0 ? (
                              chartMode === 'weight' ? `${value} kg` : `${value}%`
                            ) : 'N/A'}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex justify-between mt-4 px-1">
                  {[...client.assessments]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(-7)
                    .map((a, i) => (
                      <span key={i} className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        {new Date(a.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                    ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center">
                <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <TrendingUp size={24} className="text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Nenhuma avaliação registrada</p>
                <p className="text-slate-600 text-xs mt-1">Adicione avaliações para ver a evolução</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-white tracking-tight">Galeria de Evolução</h3>
              <button
                onClick={onOpenGalleryModal}
                className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
              >Ver Todas</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {client.assessments.slice(0, 3).map((assessment, i) => (
                <div key={i} className="min-w-[120px] aspect-[3/4] rounded-2xl overflow-hidden relative glass-card p-1">
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                    <Camera size={24} className="text-slate-600" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-3">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">
                      {new Date(assessment.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <button
                onClick={onStartAssessment}
                className="min-w-[120px] aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group hover:border-blue-500/50 transition-all"
              >
                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={20} className="text-blue-400" />
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nova Foto</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'Avaliações' && (
        <motion.div
          key="assessments"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          <button
            onClick={onStartAssessment}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              border: '1px solid var(--btn-primary-border)',
              boxShadow: 'var(--btn-primary-shadow)',
            }}
          >
            <PlusCircle size={20} />
            Nova Avaliação
          </button>

          <h3 className="font-black text-white tracking-tight text-sm mt-4">Histórico</h3>
          <div className="space-y-3">
            {client.assessments.length > 0 ? client.assessments.map((assessment, idx) => (
              <div key={idx} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 active:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">
                      {new Date(assessment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="flex gap-3 text-[10px] text-slate-400 font-medium mt-0.5">
                      <span>Peso: <b className="text-white">{assessment.weight}kg</b></span>
                      {assessment.bodyFat && <span>BF: <b className="text-blue-400">{assessment.bodyFat}%</b></span>}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-600">chevron_right</span>
              </div>
            )) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                Nenhuma avaliação registrada ainda.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'Treinos' && (
        <motion.div
          key="workouts"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          <button
            onClick={() => onCreateWorkout ? onCreateWorkout() : onStartWorkout({ title: 'Novo Treino', exercises: [] })}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              border: '1px solid var(--btn-primary-border)',
              boxShadow: 'var(--btn-primary-shadow)',
            }}
          >
            <Dumbbell size={20} />
            Criar Novo Treino
          </button>

          <div className="grid grid-cols-2 gap-3">
            {onStudentView && (
              <button
                onClick={onStudentView}
                className="py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <User size={16} />
                Ver como Aluno
              </button>
            )}
            {onSportTraining && (
              <button
                onClick={onSportTraining}
                className="py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{ background: 'rgba(59, 130, 246,0.07)', border: '1px solid rgba(59, 130, 246,0.15)', color: '#3B82F6' }}
              >
                <Zap size={16} />
                Esportivo ⭐
              </button>
            )}
          </div>

          <div className="glass-card rounded-2xl p-4 border border-blue-500/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                Aulas Perdidas
              </h3>
              <button
                onClick={onOpenMissedClassModal}
                className="text-xs font-bold text-blue-400 uppercase tracking-widest"
              >
                + Registrar
              </button>
            </div>

            {client.missedClasses.length > 0 ? (
              <div className="space-y-2">
                {client.missedClasses.map((mc, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                    <div>
                      <p className="text-xs font-bold text-white">
                        {new Date(mc.date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-[10px] text-slate-400">{getReasonLabel(mc.reason)}</p>
                    </div>
                    {mc.replaced ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">
                        ✓ Reposta
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkAsReplaced(mc.id!)}
                        className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold hover:bg-blue-500/30 transition-colors"
                      >
                        Marcar como Reposta
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">
                Nenhuma aula perdida registrada 🎉
              </p>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'Bio' && (
        <motion.div
          key="bio"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Phone size={14} className="text-blue-400" />
                Contato
              </h3>
              <button
                onClick={onOpenContactModal}
                className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <Edit size={12} className="inline mr-1" /> Editar
              </button>
            </div>
            {client.email && (
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Mail size={14} className="text-slate-500" />
                {client.email}
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Phone size={14} className="text-slate-500" />
                {client.phone}
                <a
                  href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold"
                >
                  WhatsApp
                </a>
              </div>
            )}
          </div>

          <ClientFinanceSection
            client={{
              id: client.id,
              name: client.name,
              coach_id: coachId,
              monthly_fee: (client as any).monthly_fee,
              payment_day: (client as any).payment_day,
              payment_type: (client as any).payment_type,
              session_price: (client as any).session_price,
            }}
            coachId={coachId}
            onUpdate={onFinanceUpdate}
          />

          <ClientPhysicalDataForm
            age={client.age}
            weight={client.weight}
            height={client.height}
            bodyFat={client.bodyFat}
            compact={false}
            readOnly={false}
            onUpdate={onUpdatePhysicalData}
          />

          <div className="glass-card rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText size={14} className="text-blue-400" />
                Notas do Aluno
              </h3>
              <button
                onClick={() => isEditing ? handleSaveNotes() : setIsEditing(true)}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${isEditing
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
              >
                {isEditing ? <><Save size={12} className="inline mr-1" /> Salvar</> : <><Edit size={12} className="inline mr-1" /> Editar</>}
              </button>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                📝 Observações Gerais
              </label>
              {isEditing ? (
                <textarea
                  value={editedObservations}
                  onChange={(e) => setEditedObservations(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500/50 resize-none"
                  rows={2}
                  placeholder="Observações gerais sobre o aluno..."
                />
              ) : (
                <p className="text-sm text-slate-300">
                  {client.observations || <span className="text-slate-500 italic">Sem observações</span>}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">
                ⚠️ Lesões / Restrições
              </label>
              {isEditing ? (
                <textarea
                  value={editedInjuries}
                  onChange={(e) => setEditedInjuries(e.target.value)}
                  className="w-full bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500/50 resize-none"
                  rows={2}
                  placeholder="Lesões e restrições de movimento..."
                />
              ) : (
                <p className="text-sm text-slate-300">
                  {client.injuries || <span className="text-slate-500 italic">Nenhuma lesão registrada</span>}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9px] font-black text-pink-400 uppercase tracking-widest block mb-1">
                ❤️ Preferências de Treino
              </label>
              {isEditing ? (
                <textarea
                  value={editedPreferences}
                  onChange={(e) => setEditedPreferences(e.target.value)}
                  className="w-full bg-pink-500/5 border border-pink-500/20 rounded-xl p-3 text-sm text-white outline-none focus:border-pink-500/50 resize-none"
                  rows={2}
                  placeholder="Exercícios favoritos, estilos de treino..."
                />
              ) : (
                <p className="text-sm text-slate-300">
                  {client.preferences || <span className="text-slate-500 italic">Sem preferências registradas</span>}
                </p>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-bold text-white text-sm mb-3">📅 Datas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Início</p>
                <p className="text-white font-bold">{client.startDate ? new Date(client.startDate).toLocaleDateString('pt-BR') : '-'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Último Treino</p>
                <p className="text-white font-bold">{client.lastTraining}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClientProfileTabPanels;
