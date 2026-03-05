import React from 'react';
import { Download, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react';

interface EditingExercise {
  splitIdx: number;
  exIdx: number;
}

interface AIBuilderResultModalProps {
  result: any;
  selectedClientName?: string;
  activeTabIndex: number;
  setActiveTabIndex: (index: number) => void;
  workoutOptions: any[];
  selectedOptionIndex: number;
  selectWorkoutOption: (index: number) => void;
  feedback: 'positive' | 'negative' | null;
  onFeedback: (type: 'positive' | 'negative') => void;
  editingExercise: EditingExercise | null;
  setEditingExercise: (value: EditingExercise | null) => void;
  handleRegenerateExercise: (splitIdx: number, exIdx: number, exercise: any) => void;
  regeneratingId: string | null;
  updateExercise: (splitIdx: number, exIdx: number, field: string, value: string | number) => void;
  removeExercise: (splitIdx: number, exIdx: number) => void;
  openAddExerciseModal: () => void | Promise<void>;
  refinementInput: string;
  setRefinementInput: (value: string) => void;
  handleRefine: () => void | Promise<void>;
  isRefining: boolean;
  showAddExercise: boolean;
  setShowAddExercise: (value: boolean) => void;
  exerciseSearch: string;
  setExerciseSearch: (value: string) => void;
  filteredExercisesForAdd: any[];
  loadingExerciseCatalog: boolean;
  addExercise: (exercise: any) => void;
  onClose: () => void;
  handleExportPDF: () => void;
  handleSendWhatsApp: () => void;
  handleSaveWorkout: () => void | Promise<void>;
}

const AIBuilderResultModal: React.FC<AIBuilderResultModalProps> = ({
  result,
  selectedClientName,
  activeTabIndex,
  setActiveTabIndex,
  workoutOptions,
  selectedOptionIndex,
  selectWorkoutOption,
  feedback,
  onFeedback,
  editingExercise,
  setEditingExercise,
  handleRegenerateExercise,
  regeneratingId,
  updateExercise,
  removeExercise,
  openAddExerciseModal,
  refinementInput,
  setRefinementInput,
  handleRefine,
  isRefining,
  showAddExercise,
  setShowAddExercise,
  exerciseSearch,
  setExerciseSearch,
  filteredExercisesForAdd,
  loadingExerciseCatalog,
  addExercise,
  onClose,
  handleExportPDF,
  handleSendWhatsApp,
  handleSaveWorkout
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-void)]">
      <div className="w-full max-w-md h-full flex flex-col animate-fade-in relative bg-[var(--bg-void)]">
        <div className="absolute inset-0 z-0 opacity-15">
          <div className="absolute top-0 right-0 size-96 rounded-full blur-[120px] bg-[#1E3A8A]"></div>
          <div className="absolute bottom-0 left-0 size-96 rounded-full blur-[120px] bg-[#3B82F6]"></div>
        </div>

        <header className="relative z-10 px-6 pt-14 pb-6 glass-card bg-slate-950/50 border-0 border-b border-white/10 rounded-0">
          <div className="flex justify-between items-center">
            <button onClick={onClose} className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center">
              <h3 className="text-lg font-black text-white tracking-tight">{result.title}</h3>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{selectedClientName}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={handleExportPDF} className="size-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/20 transition-all active:scale-95" title="Exportar PDF/Imprimir">
                <Download size={18} />
              </button>
              <button onClick={handleSendWhatsApp} className="size-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-all active:scale-95" title="Enviar no WhatsApp">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto px-6 py-6 no-scrollbar pb-44">
          <div className="glass-card rounded-[32px] p-6 mb-4 border-l-4 border-blue-500">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estratégia de Treino</p>
            <p className="text-white font-medium leading-relaxed">{result.objective}</p>
          </div>

          {result.mesocycle && result.mesocycle.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">📅 Periodização (Mesociclo 4 Semanas)</p>
              <div className="grid grid-cols-2 gap-3">
                {result.mesocycle.map((week: any, idx: number) => (
                  <div key={idx} className="glass-card p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-bold text-blue-400 uppercase">Semana {week.week}</span>
                      <span className="text-[9px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">{week.phase}</span>
                    </div>
                    <p className="text-white text-xs font-bold mb-1">{week.focus}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{week.instruction || 'Aumentar carga progressivamente.'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workoutOptions.length > 1 && (
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">🎯 Escolha uma Variação</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {workoutOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectWorkoutOption(idx)}
                    className={`flex-shrink-0 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selectedOptionIndex === idx
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30'
                      : 'glass-card text-slate-400 hover:text-white'
                      }`}
                  >
                    <span className="block">{option.optionLabel || `Opção ${idx + 1}`}</span>
                    <span className="text-[8px] opacity-70 mt-1 block">{option.title?.split(' - ')[0] || ''}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Avalie este resultado</p>
            <div className="flex gap-2">
              <button
                onClick={() => onFeedback('positive')}
                className={`p-2 rounded-full transition-colors ${feedback === 'positive' ? 'bg-green-500/20 text-green-400' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <ThumbsUp size={16} />
              </button>
              <button
                onClick={() => onFeedback('negative')}
                className={`p-2 rounded-full transition-colors ${feedback === 'negative' ? 'bg-red-500/20 text-red-400' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <ThumbsDown size={16} />
              </button>
            </div>
          </div>

          {result.personalNotes && result.personalNotes.length > 0 && (
            <div className="glass-card rounded-[32px] p-4 mb-8 border border-blue-500/20 bg-blue-500/5">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">🤖 Personalização Aplicada</p>
              <div className="space-y-2">
                {result.personalNotes.map((note: string, idx: number) => (
                  <p key={idx} className="text-sm text-slate-300">{note}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
            {result.splits?.map((split: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveTabIndex(idx)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTabIndex === idx ? 'bg-blue-600 text-white shadow-glow' : 'glass-card text-slate-500'}`}
              >
                {split.name}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {(result.splits?.[activeTabIndex]?.exercises || []).length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p>Nenhum exercício gerado para este treino.</p>
              </div>
            ) : (
              (result.splits?.[activeTabIndex]?.exercises || []).map((ex: any, idx: number) => {
                const isEditing = editingExercise?.splitIdx === activeTabIndex && editingExercise?.exIdx === idx;

                return (
                  <div key={idx} className={`glass-card rounded-3xl p-5 transition-all ${isEditing ? 'border border-blue-500/50 bg-blue-500/5' : 'hover:border-blue-500/30'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-black">{idx + 1}</div>
                      <div className="flex gap-2 items-center">
                        {ex.isVerified && (
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">database</span>
                            Validado
                          </span>
                        )}
                        <span className="text-[9px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded-full uppercase tracking-widest">{ex.targetMuscle}</span>
                        <button
                          onClick={() => handleRegenerateExercise(activeTabIndex, idx, ex)}
                          disabled={regeneratingId === `${activeTabIndex}-${idx}`}
                          className="size-7 rounded-lg flex items-center justify-center transition-all bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                          title="Regenerar com IA"
                        >
                          <RefreshCw size={14} className={regeneratingId === `${activeTabIndex}-${idx}` ? 'animate-spin text-blue-500' : ''} />
                        </button>
                        <button
                          onClick={() => setEditingExercise(isEditing ? null : { splitIdx: activeTabIndex, exIdx: idx })}
                          className={`size-7 rounded-lg flex items-center justify-center transition-all ${isEditing ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                          <span className="material-symbols-outlined text-sm">{isEditing ? 'check' : 'edit'}</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="text-white font-black text-lg mb-3 tracking-tight">{ex.name}</h4>

                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Séries</label>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExercise(activeTabIndex, idx, 'sets', parseInt(e.target.value, 10) || 0)}
                              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Reps</label>
                            <input
                              type="text"
                              value={ex.reps}
                              onChange={(e) => updateExercise(activeTabIndex, idx, 'reps', e.target.value)}
                              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Descanso</label>
                            <input
                              type="text"
                              value={ex.rest}
                              onChange={(e) => updateExercise(activeTabIndex, idx, 'rest', e.target.value)}
                              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-indigo-400 font-bold text-center outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeExercise(activeTabIndex, idx)}
                          className="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Remover Exercício
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className="bg-white/5 rounded-xl px-3 py-2">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Séries</p>
                          <p className="text-white font-black">{ex.sets}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl px-3 py-2">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reps</p>
                          <p className="text-white font-black">{ex.reps}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl px-3 py-2">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Descanso</p>
                          <p className="text-indigo-400 font-black">{ex.rest}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <button
              onClick={openAddExerciseModal}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-blue-500/50 hover:text-blue-400 transition-all active:scale-98"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Adicionar Exercício
            </button>

            <div className="mt-8 mb-6 glass-card p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-blue-400 text-lg">auto_fix_high</span>
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Refinar com IA</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={refinementInput}
                  onChange={(e) => setRefinementInput(e.target.value)}
                  placeholder="Ex: Troque agachamento por leg press..."
                  className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                />
                <button
                  onClick={handleRefine}
                  disabled={isRefining || !refinementInput}
                  className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-blue-900/20"
                >
                  {isRefining ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">send</span>}
                </button>
              </div>
            </div>
          </div>
        </main>

        {showAddExercise && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col animate-fade-in">
            <header className="px-6 pt-14 pb-4">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => {
                    setShowAddExercise(false);
                    setExerciseSearch('');
                  }}
                  className="size-10 rounded-full glass-card flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <h3 className="text-lg font-black text-white">Adicionar Exercício</h3>
                <div className="size-10"></div>
              </div>

              <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-500">search</span>
                <input
                  type="text"
                  placeholder="Buscar exercício ou músculo..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none"
                  autoFocus
                />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-3">
                {loadingExerciseCatalog && (
                  <div className="space-y-3">
                    <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                    <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                    <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                  </div>
                )}
                {filteredExercisesForAdd.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => addExercise(ex)}
                    className="w-full glass-card rounded-2xl p-4 text-left hover:border-blue-500/30 transition-all active:scale-98 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-bold">{ex.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{ex.targetMuscle}</p>
                    </div>
                    <span className="material-symbols-outlined text-blue-500">add</span>
                  </button>
                ))}
                {!loadingExerciseCatalog && filteredExercisesForAdd.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Nenhum exercício encontrado</p>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="fixed bottom-20 left-0 right-0 p-4 px-6 max-w-md mx-auto z-20">
          <button
            onClick={handleSaveWorkout}
            className="w-full h-14 text-white font-black rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] shadow-[0_8px_32px_rgba(30,58,138,0.35)]"
          >
            <span className="material-symbols-outlined">check_circle</span>
            Salvar Protocolo
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AIBuilderResultModal;
